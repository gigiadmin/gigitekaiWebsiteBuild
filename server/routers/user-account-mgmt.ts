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
        SET updatedAt = NOW(),
            deletedAt = NOW()
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

      // Check if user exists and is deleted
      const result = await db.execute(`
        SELECT deletedAt FROM users WHERE id = ${input.userId} AND deletedAt IS NOT NULL
      `);

      if (!result || (result as any).length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found or not deleted",
        });
      }

      await db.execute(`
        UPDATE users 
        SET updatedAt = NOW(),
            deletedAt = NULL
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
        createdAt
      FROM users
      WHERE deletedAt IS NOT NULL
      ORDER BY deletedAt DESC
    `);

    return result || [];
  }),

  /**
   * Change user role (admin, technician, user)
   */
  changeUserRole: adminProcedure
    .input(z.object({ 
      userId: z.number(), 
      newRole: z.enum(['admin', 'technician', 'user']) 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db.execute(`
        UPDATE users 
        SET role = '${input.newRole}', updatedAt = NOW()
        WHERE id = ${input.userId}
      `);

      return { 
        success: true, 
        message: `User role changed to ${input.newRole}` 
      };
    }),

  /**
   * Add a new user with specified role
   */
  addUser: adminProcedure
    .input(z.object({ 
      email: z.string().email(),
      name: z.string(),
      role: z.enum(['admin', 'technician', 'user']).default('user')
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if user already exists
      const existingUser = await db.execute(`
        SELECT id FROM users WHERE email = '${input.email}'
      `);

      if (existingUser && (existingUser as any).length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      // Generate a temporary openId for the new user
      const tempOpenId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await db.execute(`
        INSERT INTO users (email, name, role, openId, loginMethod, isActive, approved, createdAt, updatedAt, lastSignedIn)
        VALUES ('${input.email}', '${input.name}', '${input.role}', '${tempOpenId}', 'manual', 1, 1, NOW(), NOW(), NOW())
      `);

      return { 
        success: true, 
        message: `User ${input.name} added as ${input.role}`,
        userId: (result as any).insertId
      };
    }),

  /**
   * Get role statistics
   */
  getRoleStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const result = await db.execute(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      WHERE deletedAt IS NULL
      GROUP BY role
    `);

    const stats = {
      admin: 0,
      technician: 0,
      user: 0,
      total: 0
    };

    if (result && Array.isArray(result)) {
      (result as any).forEach((row: any) => {
        stats[row.role as keyof typeof stats] = row.count;
        stats.total += row.count;
      });
    }

    return stats;
  }),
});
