import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

export const userAccountMgmtRouter = router({
  /**
   * Disable a user account
   */
  disableUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.execute(`
        UPDATE users 
        SET isActive = false, updatedAt = NOW()
        WHERE id = ${input.userId}
      `);

      return { success: true, message: "User account disabled" };
    }),

  /**
   * Enable a disabled user account
   */
  enableUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.execute(`
        UPDATE users 
        SET isActive = true, updatedAt = NOW()
        WHERE id = ${input.userId}
      `);

      return { success: true, message: "User account enabled" };
    }),

  /**
   * Delete a user account (soft delete with 30-day recovery window)
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const recoveryDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.execute(`
        UPDATE users 
        SET isActive = false, 
            updatedAt = NOW(),
            deletedAt = NOW(),
            recoveryDeadline = '${recoveryDeadline.toISOString()}'
        WHERE id = ${input.userId}
      `);

      return {
        success: true,
        message: "User account deleted. Can be restored within 30 days.",
        recoveryDeadline,
      };
    }),

  /**
   * Restore a deleted user account
   */
  restoreUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if recovery window is still valid
      const result = await db.execute(`
        SELECT recoveryDeadline FROM users WHERE id = ${input.userId} AND deletedAt IS NOT NULL
      `);

      if (!result || (result as any).length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found or recovery window expired",
        });
      }

      const recoveryDeadline = (result as any)[0]?.recoveryDeadline;
      if (recoveryDeadline && new Date(recoveryDeadline) < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Recovery window has expired (30 days)",
        });
      }

      await db.execute(`
        UPDATE users 
        SET isActive = true, 
            updatedAt = NOW(),
            deletedAt = NULL,
            recoveryDeadline = NULL
        WHERE id = ${input.userId}
      `);

      return { success: true, message: "User account restored" };
    }),

  /**
   * Bulk disable users
   */
  bulkDisableUsers: adminProcedure
    .input(z.object({ userIds: z.array(z.number()), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const ids = input.userIds.join(",");
      await db.execute(`
        UPDATE users 
        SET isActive = false, updatedAt = NOW()
        WHERE id IN (${ids})
      `);

      return {
        success: true,
        message: `${input.userIds.length} user accounts disabled`,
      };
    }),

  /**
   * Bulk enable users
   */
  bulkEnableUsers: adminProcedure
    .input(z.object({ userIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const ids = input.userIds.join(",");
      await db.execute(`
        UPDATE users 
        SET isActive = true, updatedAt = NOW()
        WHERE id IN (${ids})
      `);

      return {
        success: true,
        message: `${input.userIds.length} user accounts enabled`,
      };
    }),

  /**
   * Get all users with account status
   */
  getAllUsersWithStatus: adminProcedure
    .input(
      z.object({
        includeDeleted: z.boolean().default(false),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = `
        SELECT 
          id, 
          email, 
          name, 
          role, 
          isActive, 
          createdAt, 
          updatedAt,
          deletedAt,
          recoveryDeadline
        FROM users
        WHERE 1=1
      `;

      if (!input.includeDeleted) {
        query += ` AND deletedAt IS NULL`;
      }

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        query += ` AND (email LIKE '${searchTerm}' OR name LIKE '${searchTerm}')`;
      }

      query += ` ORDER BY createdAt DESC`;

      const result = await db.execute(query);
      return (result as any) || [];
    }),

  /**
   * Get recovery queue (users that can be restored within 30 days)
   */
  getRecoveryQueue: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const result = await db.execute(`
      SELECT 
        id, 
        email, 
        name, 
        deletedAt,
        recoveryDeadline,
        DATEDIFF(recoveryDeadline, NOW()) as daysRemaining
      FROM users
      WHERE deletedAt IS NOT NULL 
        AND recoveryDeadline > NOW()
      ORDER BY recoveryDeadline ASC
    `);

    return result || [];
  }),
});
