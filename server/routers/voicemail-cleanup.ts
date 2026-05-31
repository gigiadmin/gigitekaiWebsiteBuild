import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { callDraftTickets } from "../../drizzle/schema";
import { sql, eq } from "drizzle-orm";

/**
 * Voicemail Cleanup Router
 * 
 * Provides procedures to identify and remove duplicate voicemail tickets
 * created due to race conditions in the voicemail dedup logic.
 */

export const voicemailCleanupRouter = router({
  /**
   * Find duplicate voicemail tickets
   * Groups by title + description to identify duplicates
   */
  findDuplicates: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    
    const duplicates = await db.execute(sql`
      SELECT 
        title,
        description,
        COUNT(*) as count,
        GROUP_CONCAT(id ORDER BY created_at) as ids,
        MIN(created_at) as oldest_created_at
      FROM callDraftTickets
      WHERE title LIKE '%Voicemail%'
        AND reviewStatus = 'pending'
      GROUP BY title, description
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    return duplicates;
  }),

  /**
   * Remove duplicate voicemail tickets
   * Keeps the oldest ticket, deletes newer duplicates
   */
  removeDuplicates: protectedProcedure.mutation(async ({ ctx }) => {
    // Only admins can run cleanup
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const duplicates = await db.execute(sql`
      SELECT 
        title,
        description,
        COUNT(*) as count,
        GROUP_CONCAT(id ORDER BY created_at) as ids
      FROM callDraftTickets
      WHERE title LIKE '%Voicemail%'
        AND reviewStatus = 'pending'
      GROUP BY title, description
      HAVING COUNT(*) > 1
    `);

    let totalDeleted = 0;
    const deletedTickets = [];

    for (const dup of duplicates as any[]) {
      const ids = dup.ids.split(',').map(Number);
      const keepId = ids[0]; // Keep the oldest
      const deleteIds = ids.slice(1); // Delete the rest

      // Delete duplicates
      if (!db) throw new Error('Database connection lost');
      const result = await db.execute(sql`
        DELETE FROM callDraftTickets 
        WHERE id IN (${sql.join(deleteIds, sql`, `)})
      `);

      totalDeleted += deleteIds.length;
      deletedTickets.push({
        title: dup.title,
        keptId: keepId,
        deletedIds: deleteIds,
        count: dup.count,
      });
    }

    return {
      success: true,
      totalDeleted,
      duplicateGroups: deletedTickets.length,
      details: deletedTickets,
    };
  }),

  /**
   * Get voicemail dedup table status
   * Shows expiration of dedup entries
   */
  getDedupStatus: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    
    const status = await db.execute(sql`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN expiresAt > NOW() THEN 1 END) as active_entries,
        COUNT(CASE WHEN expiresAt <= NOW() THEN 1 END) as expired_entries,
        MIN(expiresAt) as oldest_expiry,
        MAX(expiresAt) as newest_expiry
      FROM voicemailDedup
    `);

    return status[0];
  }),

  /**
   * Clean up expired dedup entries
   */
  cleanupExpiredEntries: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const result = await db.execute(sql`
      DELETE FROM voicemailDedup 
      WHERE expiresAt <= NOW()
    `);

    return {
      success: true,
      deletedCount: (result as any).affectedRows || 0,
    };
  }),
});
