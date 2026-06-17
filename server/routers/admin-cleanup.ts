/**
 * admin-cleanup.ts
 * 
 * Admin-only procedures for cleaning up duplicate data
 */

import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { tickets, ticketReplies } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

export const adminCleanupRouter = router({
  /**
   * Get duplicate ticket groups
   */
  getDuplicateTickets: adminProcedure
    .input(z.object({
      subjectPattern: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select({
          subject: tickets.title,
          count: sql<number>`COUNT(*)`,
          ids: sql<string>`GROUP_CONCAT(${tickets.id} ORDER BY ${tickets.id})`,
          firstCreated: sql<string>`MIN(${tickets.createdAt})`,
          lastCreated: sql<string>`MAX(${tickets.createdAt})`,
        })
        .from(tickets)
        .groupBy(tickets.title)
        .having(sql`COUNT(*) > 1`)
        .limit(input.limit);

      // Note: Drizzle doesn't have great support for HAVING with LIKE,
      // so we'll filter in memory if pattern is provided
      const results = await query;

      if (input.subjectPattern) {
        return results.filter(r => 
          r.subject?.toLowerCase().includes(input.subjectPattern!.toLowerCase())
        );
      }

      return results;
    }),

  /**
   * Delete duplicate tickets (keeps the oldest, deletes newer ones)
   */
  deleteDuplicateTickets: adminProcedure
    .input(z.object({
      subjectPattern: z.string().optional(),
      dryRun: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get duplicate groups
      let query = db
        .select({
          subject: tickets.title,
          count: sql<number>`COUNT(*)`,
          ids: sql<string>`GROUP_CONCAT(${tickets.id} ORDER BY ${tickets.id})`,
        })
        .from(tickets)
        .groupBy(tickets.title)
        .having(sql`COUNT(*) > 1`);

      const duplicateGroups = await query;

      if (duplicateGroups.length === 0) {
        return {
          success: true,
          message: "No duplicate tickets found",
          deleted: 0,
          dryRun: input.dryRun,
        };
      }

      // Filter by pattern if provided
      let filtered = duplicateGroups;
      if (input.subjectPattern) {
        filtered = duplicateGroups.filter(g =>
          g.subject?.toLowerCase().includes(input.subjectPattern!.toLowerCase())
        );
      }

      // Collect IDs to delete (keep first, delete rest)
      const toDelete: number[] = [];
      for (const group of filtered) {
        if (!group.ids) continue;
        const ids = group.ids.split(",").map(Number);
        // Keep first, delete the rest
        toDelete.push(...ids.slice(1));
      }

      console.log(`[Admin Cleanup] Found ${toDelete.length} duplicate tickets to delete`);

      if (input.dryRun) {
        return {
          success: true,
          message: `DRY RUN: Would delete ${toDelete.length} tickets`,
          deleted: 0,
          dryRun: true,
          ticketsToDelete: toDelete,
        };
      }

      // Actually delete
      if (toDelete.length > 0) {
        // Delete replies first (foreign key)
        await db
          .delete(ticketReplies)
          .where(sql`${ticketReplies.ticketId} IN (${sql.raw(toDelete.join(","))})`);

        // Delete tickets
        await db
          .delete(tickets)
          .where(sql`${tickets.id} IN (${sql.raw(toDelete.join(","))})`);
      }

      return {
        success: true,
        message: `Deleted ${toDelete.length} duplicate tickets`,
        deleted: toDelete.length,
        dryRun: false,
      };
    }),
});
