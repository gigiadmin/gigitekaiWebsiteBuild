import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, ticketActivity } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const ticketMergeRouter = router({
  /**
   * Merge a source ticket into a target ticket
   * - Marks source as merged
   * - Creates activity log entry
   */
  mergeTicket: protectedProcedure
    .input(
      z.object({
        sourceTicketId: z.number().min(1),
        targetTicketId: z.number().min(1),
        mergeNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify both tickets exist
      const sourceTicketList = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.sourceTicketId));
      const sourceTicket = sourceTicketList[0];

      const targetTicketList = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.targetTicketId));
      const targetTicket = targetTicketList[0];

      if (!sourceTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source ticket not found",
        });
      }

      if (!targetTicket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target ticket not found",
        });
      }

      if (input.sourceTicketId === input.targetTicketId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot merge a ticket into itself",
        });
      }

      // Mark source ticket as merged
      await db
        .update(tickets)
        .set({
          mergedInto: input.targetTicketId,
          status: "closed",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tickets.id, input.sourceTicketId));

      // Log the merge action
      await db.insert(ticketActivity).values({
        ticketId: input.sourceTicketId,
        actorId: ctx.user.id,
        actorName: ctx.user.email || "Unknown",
        action: "merged",
        toValue: `Merged into ticket #${input.targetTicketId}`,
      });

      // Log on target ticket as well
      await db.insert(ticketActivity).values({
        ticketId: input.targetTicketId,
        actorId: ctx.user.id,
        actorName: ctx.user.email || "Unknown",
        action: "merged_from",
        fromValue: `Ticket #${input.sourceTicketId} merged into this ticket`,
      });

      return {
        success: true,
        sourceTicketId: input.sourceTicketId,
        targetTicketId: input.targetTicketId,
        message: `Ticket #${input.sourceTicketId} merged into #${input.targetTicketId}`,
      };
    }),

  /**
   * Unmerge a ticket (reverse a merge operation)
   */
  unmergeTicket: protectedProcedure
    .input(
      z.object({
        ticketId: z.number().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const ticketList = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      if (!ticket.mergedInto) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This ticket is not merged",
        });
      }

      const previousMergedInto = ticket.mergedInto;

      // Unmerge the ticket
      await db
        .update(tickets)
        .set({
          mergedInto: null,
          status: "open",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tickets.id, input.ticketId));

      // Log the unmerge action
      await db.insert(ticketActivity).values({
        ticketId: input.ticketId,
        actorId: ctx.user.id,
        actorName: ctx.user.email || "Unknown",
        action: "unmerged",
        fromValue: `Was merged into ticket #${previousMergedInto}`,
        toValue: "Unmerged",
      });

      return {
        success: true,
        ticketId: input.ticketId,
        previousMergedInto,
        message: `Ticket #${input.ticketId} has been unmerged`,
      };
    }),

  /**
   * Get all tickets merged into a specific ticket
   */
  getMergedTickets: protectedProcedure
    .input(
      z.object({
        ticketId: z.number().min(1),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const mergedTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.mergedInto, input.ticketId));

      return {
        targetTicketId: input.ticketId,
        mergedTickets,
        count: mergedTickets.length,
      };
    }),

  /**
   * Check if a ticket is merged and get its target
   */
  getTicketMergeStatus: protectedProcedure
    .input(
      z.object({
        ticketId: z.number().min(1),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const ticketList = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      if (!ticket.mergedInto) {
        return {
          ticketId: input.ticketId,
          isMerged: 0,
          mergedInto: null,
        };
      }

      // Get target ticket details
      const targetTicketList = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, ticket.mergedInto));
      const targetTicket = targetTicketList[0];

      return {
        ticketId: input.ticketId,
        isMerged: 1,
        mergedInto: ticket.mergedInto,
        targetTicket: targetTicket || null,
      };
    }),
});
