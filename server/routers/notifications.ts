import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { notificationQueue, notificationPreferences } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = router({
  /**
   * Queue a notification for sending
   */
  queueNotification: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        type: z.enum(["email", "sms", "in_app"]),
        subject: z.string().optional(),
        content: z.string().min(1),
        relatedTicketId: z.number().int().optional(),
        relatedEntityType: z.string().optional(),
        relatedEntityId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if user has preferences for this notification type
      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, input.userId));

      if (prefs.length > 0) {
        const pref = prefs[0];

        // Skip if user has disabled this notification type
        if (input.type === "email" && !pref.emailNotifications) {
          return { queued: false, reason: "Email notifications disabled" };
        }
        if (input.type === "sms" && !pref.smsNotifications) {
          return { queued: false, reason: "SMS notifications disabled" };
        }
        if (input.type === "in_app" && !pref.inAppNotifications) {
          return { queued: false, reason: "In-app notifications disabled" };
        }
      }

      // Queue the notification
      const result = await db.insert(notificationQueue).values({
        userId: input.userId,
        type: input.type,
        subject: input.subject,
        content: input.content,
        relatedTicketId: input.relatedTicketId,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        status: "pending",
      });

      return {
        queued: true,
        notificationId: (result as any).insertId || 0,
      };
    }),

  /**
   * Get pending notifications for a user
   */
  getPendingNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const notifications = await db
        .select()
        .from(notificationQueue)
        .where(and(eq(notificationQueue.userId, ctx.user.id), eq(notificationQueue.status, "pending")))
        .limit(input.limit)
        .offset(input.offset);

      return notifications;
    }),

  /**
   * Mark notification as sent
   */
  markNotificationSent: adminProcedure
    .input(z.object({ notificationId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(notificationQueue)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(notificationQueue.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Mark notification as failed
   */
  markNotificationFailed: adminProcedure
    .input(
      z.object({
        notificationId: z.number().int().positive(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const notification = await db
        .select()
        .from(notificationQueue)
        .where(eq(notificationQueue.id, input.notificationId));

      if (!notification || notification.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      }

      const notif = notification[0];
      const retryCount = (notif.retryCount || 0) + 1;
      const maxRetries = notif.maxRetries || 3;

      const newStatus = retryCount >= maxRetries ? "failed" : "pending";

      await db
        .update(notificationQueue)
        .set({
          status: newStatus,
          retryCount,
          failureReason: input.reason,
        })
        .where(eq(notificationQueue.id, input.notificationId));

      return { success: true, willRetry: newStatus === "pending" };
    }),

  /**
   * Get notification statistics
   */
  getNotificationStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allNotifications = await db.select().from(notificationQueue);

    const pending = allNotifications.filter((n) => n.status === "pending").length;
    const sent = allNotifications.filter((n) => n.status === "sent").length;
    const failed = allNotifications.filter((n) => n.status === "failed").length;
    const bounced = allNotifications.filter((n) => n.status === "bounced").length;

    const byType = {
      email: allNotifications.filter((n) => n.type === "email").length,
      sms: allNotifications.filter((n) => n.type === "sms").length,
      in_app: allNotifications.filter((n) => n.type === "in_app").length,
    };

    return {
      total: allNotifications.length,
      pending,
      sent,
      failed,
      bounced,
      byType,
      successRate: allNotifications.length > 0 ? Math.round((sent / allNotifications.length) * 100) : 0,
    };
  }),

  /**
   * Send ticket update notification to customer
   */
  notifyTicketUpdate: protectedProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        customerId: z.number().int().positive(),
        updateType: z.enum(["created", "updated", "resolved", "closed", "comment"]),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const subjects: Record<string, string> = {
        created: "Your support ticket has been created",
        updated: "Your support ticket has been updated",
        resolved: "Your support ticket has been resolved",
        closed: "Your support ticket has been closed",
        comment: "New comment on your support ticket",
      };

      // Queue email notification
      await db.insert(notificationQueue).values({
        userId: input.customerId,
        type: "email",
        subject: subjects[input.updateType],
        content: input.message,
        relatedTicketId: input.ticketId,
        relatedEntityType: "ticket",
        relatedEntityId: input.ticketId,
        status: "pending",
      });

      // Queue in-app notification
      await db.insert(notificationQueue).values({
        userId: input.customerId,
        type: "in_app",
        content: input.message,
        relatedTicketId: input.ticketId,
        relatedEntityType: "ticket",
        relatedEntityId: input.ticketId,
        status: "pending",
      });

      return { success: true };
    }),

  /**
   * Get notification history for user
   */
  getNotificationHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const notifications = await db
        .select()
        .from(notificationQueue)
        .where(eq(notificationQueue.userId, ctx.user.id))
        .limit(input.limit)
        .offset(input.offset);

      return notifications;
    }),
});
