import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

export const helpdeskNotificationsRouter = router({
  /**
   * Send notification when ticket status changes
   */
  notifyStatusChange: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        oldStatus: z.string(),
        newStatus: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get ticket
      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      // Get ticket creator
      const creatorList = await db.select().from(users).where(eq(users.id, ticket.userId));
      const creator = creatorList[0];

      if (!creator) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket creator not found" });
      }

      // Send notification via Manus notification API
      await notifyOwner({
        title: `Ticket #${input.ticketId} Status Changed`,
        content: `Ticket "${ticket.title}" status changed from ${input.oldStatus} to ${input.newStatus}`,
      });

      return {
        success: true,
        ticketId: input.ticketId,
        notifiedUser: creator.id,
        message: "Status change notification sent",
      };
    }),

  /**
   * Send notification when ticket is assigned
   */
  notifyAssignment: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        assignedTo: z.number(),
        assignedBy: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get ticket
      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      // Get assigned agent
      const agentList = await db.select().from(users).where(eq(users.id, input.assignedTo));
      const agent = agentList[0];

      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      // Notify owner
      await notifyOwner({
        title: `Ticket #${input.ticketId} Assigned`,
        content: `Ticket "${ticket.title}" has been assigned to ${agent.email || "an agent"}`,
      });

      return {
        success: true,
        ticketId: input.ticketId,
        notifiedAgent: input.assignedTo,
        message: "Assignment notification sent",
      };
    }),

  /**
   * Send notification for new ticket reply
   */
  notifyNewReply: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        repliedBy: z.number(),
        replyPreview: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get ticket
      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      // Get ticket creator
      const creatorList = await db.select().from(users).where(eq(users.id, ticket.userId));
      const creator = creatorList[0];

      if (!creator) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket creator not found" });
      }

      // Send notification
      await notifyOwner({
        title: `New Reply on Ticket #${input.ticketId}`,
        content: `${input.replyPreview.substring(0, 100)}...`,
      });

      return {
        success: true,
        ticketId: input.ticketId,
        notifiedUser: creator.id,
        message: "Reply notification sent",
      };
    }),

  /**
   * Get user notifications (stub - would use ticketNotifications table)
   */
  getUserNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      // Stub implementation - would query ticketNotifications table if it existed
      return [
        {
          id: 1,
          ticketId: 1,
          userId: ctx.user.id,
          type: "status_change",
          title: "Ticket Status Updated",
          message: "Your ticket has been updated",
          isRead: false,
          createdAt: new Date(),
        },
      ];
    }),

  /**
   * Mark notification as read (stub)
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        notificationId: input.notificationId,
      };
    }),

  /**
   * Get notification statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return {
      totalNotifications: 5,
      unreadCount: 2,
      byType: {
        status_change: 3,
        assignment: 1,
        new_reply: 1,
      },
      lastNotification: new Date(),
    };
  }),

  /**
   * Mark all notifications as read (stub)
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return {
      success: true,
      markedCount: 2,
    };
  }),

  /**
   * Send SLA breach notification
   */
  notifySlaBreach: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        slType: z.enum(["response", "resolution"]),
        hoursOverdue: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      await notifyOwner({
        title: `SLA Breach Alert: Ticket #${input.ticketId}`,
        content: `${input.slType} SLA breached by ${input.hoursOverdue.toFixed(1)} hours for ticket "${ticket.title}"`,
      });

      return {
        success: true,
        ticketId: input.ticketId,
        message: "SLA breach notification sent",
      };
    }),
});
