import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { adminNotifications } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminNotificationsRouter = router({
  /**
   * Get unread notifications
   */
  getUnread: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const notifications = await db
      .select()
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, 0))
      .orderBy(desc(adminNotifications.createdAt))
      .limit(50);

    return notifications;
  }),

  /**
   * Get all notifications with pagination
   */
  getAll: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const notifications = await db
        .select()
        .from(adminNotifications)
        .orderBy(desc(adminNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        notifications,
        total: notifications.length,
      };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: adminProcedure
    .input(z.object({ notificationId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(adminNotifications)
        .set({ isRead: 1 })
        .where(eq(adminNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await db
      .update(adminNotifications)
      .set({ isRead: 1 })
      .where(eq(adminNotifications.isRead, 0));

    return { success: true };
  }),

  /**
   * Delete notification
   */
  delete: adminProcedure
    .input(z.object({ notificationId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .delete(adminNotifications)
        .where(eq(adminNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Get notification statistics
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const unreadCount = await db
      .select({ count: adminNotifications.id })
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, 0));

    const criticalCount = await db
      .select({ count: adminNotifications.id })
      .from(adminNotifications)
      .where(eq(adminNotifications.type, "critical"));

    return {
      unreadCount: unreadCount.length > 0 ? unreadCount[0].count : 0,
      criticalCount: criticalCount.length > 0 ? criticalCount[0].count : 0,
    };
  }),
});
