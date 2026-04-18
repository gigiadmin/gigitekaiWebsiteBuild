import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, ticketActivity } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

export const bulkActionsRouter = router({
  /**
   * Bulk update ticket status for multiple tickets
   */
  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()).min(1),
        status: z.enum(["open", "in_progress", "on_hold", "resolved", "closed"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      
      // Update tickets
      const result = await db
        .update(tickets)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(inArray(tickets.id, input.ticketIds));

      // Create activity logs for each ticket
      for (const ticketId of input.ticketIds) {
        await db.insert(ticketActivity).values({
          ticketId,
          action: "status_changed",
          fromValue: "previous_status",
          toValue: input.status,
          actorId: ctx.user.id,
          actorName: ctx.user.name || "Unknown",
          createdAt: new Date(),
        });
      }

      return {
        success: true,
        message: `Updated ${input.ticketIds.length} ticket(s) to ${input.status}`,
        updatedCount: input.ticketIds.length,
      };
    }),

  /**
   * Bulk assign tickets to an agent
   */
  bulkAssignAgent: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()).min(1),
        agentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Update tickets
      const result = await db
        .update(tickets)
        .set({
          assignedTo: input.agentId,
          updatedAt: new Date(),
        })
        .where(inArray(tickets.id, input.ticketIds));

      // Create activity logs
      for (const ticketId of input.ticketIds) {
        await db.insert(ticketActivity).values({
          ticketId,
          action: "assigned",
          toValue: `Agent #${input.agentId}`,
          actorId: ctx.user.id,
          actorName: ctx.user.name || "Unknown",
          createdAt: new Date(),
        });
      }

      return {
        success: true,
        message: `Assigned ${input.ticketIds.length} ticket(s) to agent #${input.agentId}`,
        assignedCount: input.ticketIds.length,
      };
    }),

  /**
   * Bulk update ticket priority
   */
  bulkUpdatePriority: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()).min(1),
        priority: z.enum(["low", "medium", "high", "critical"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Update tickets
      const result = await db
        .update(tickets)
        .set({
          priority: input.priority,
          updatedAt: new Date(),
        })
        .where(inArray(tickets.id, input.ticketIds));

      // Create activity logs
      for (const ticketId of input.ticketIds) {
        await db.insert(ticketActivity).values({
          ticketId,
          action: "priority_changed",
          toValue: input.priority,
          actorId: ctx.user.id,
          actorName: ctx.user.name || "Unknown",
          createdAt: new Date(),
        });
      }

      return {
        success: true,
        message: `Updated priority to ${input.priority} for ${input.ticketIds.length} ticket(s)`,
        updatedCount: input.ticketIds.length,
      };
    }),

  /**
   * Bulk update ticket category
   */
  bulkUpdateCategory: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()).min(1),
        category: z.enum(["bug_report", "feature_request", "general_support", "billing"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Update tickets
      const result = await db
        .update(tickets)
        .set({
          category: input.category,
          updatedAt: new Date(),
        })
        .where(inArray(tickets.id, input.ticketIds));

      // Create activity logs
      for (const ticketId of input.ticketIds) {
        await db.insert(ticketActivity).values({
          ticketId,
          action: "category_changed",
          toValue: input.category,
          actorId: ctx.user.id,
          actorName: ctx.user.name || "Unknown",
          createdAt: new Date(),
        });
      }

      return {
        success: true,
        message: `Updated category to ${input.category} for ${input.ticketIds.length} ticket(s)`,
        updatedCount: input.ticketIds.length,
      };
    }),

  /**
   * Bulk close tickets
   */
  bulkClose: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()).min(1),
        closingNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Update tickets
      const result = await db
        .update(tickets)
        .set({
          status: "closed",
          closingNotes: input.closingNotes || null,
          closedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(inArray(tickets.id, input.ticketIds));

      // Create activity logs
      for (const ticketId of input.ticketIds) {
        await db.insert(ticketActivity).values({
          ticketId,
          action: "status_changed",
          toValue: "closed",
          actorId: ctx.user.id,
          actorName: ctx.user.name || "Unknown",
          createdAt: new Date(),
        });
      }

      return {
        success: true,
        message: `Closed ${input.ticketIds.length} ticket(s)`,
        closedCount: input.ticketIds.length,
      };
    }),

  /**
   * Bulk delete tickets (soft delete via status)
   */
  bulkDelete: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Soft delete by setting status to closed
      const result = await db
        .update(tickets)
        .set({
          status: "closed",
          updatedAt: new Date(),
        })
        .where(inArray(tickets.id, input.ticketIds));

      return {
        success: true,
        message: `Deleted ${input.ticketIds.length} ticket(s)`,
        deletedCount: input.ticketIds.length,
      };
    }),

  /**
   * Get bulk action statistics
   */
  getBulkStats: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()).min(1),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const ticketList = await db
        .select()
        .from(tickets)
        .where(inArray(tickets.id, input.ticketIds));

      const stats = {
        total: ticketList.length,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        assigned: 0,
        unassigned: 0,
      };

      for (const ticket of ticketList) {
        // Count by status
        stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1;

        // Count by priority
        stats.byPriority[ticket.priority] = (stats.byPriority[ticket.priority] || 0) + 1;

        // Count by category
        stats.byCategory[ticket.category] = (stats.byCategory[ticket.category] || 0) + 1;

        // Count assigned/unassigned
        if (ticket.assignedTo) {
          stats.assigned++;
        } else {
          stats.unassigned++;
        }
      }

      return stats;
    }),
});
