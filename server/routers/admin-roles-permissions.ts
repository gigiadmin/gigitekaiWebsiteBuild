import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { customRoles, userRoleAssignments, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const adminRolesRouter = router({
  // Create custom role
  createRole: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        permissions: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false, message: "Database error" };
      
      await db.insert(customRoles).values({
        name: input.name,
        description: input.description || "",
        permissions: input.permissions,
        createdBy: ctx.user.id,
        isSystem: 0,
      });
      return { success: true };
    }),

  // List all custom roles
  listRoles: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const roles = await db.select().from(customRoles);
    return roles;
  }),

  // Update role
  updateRole: adminProcedure
    .input(
      z.object({
        roleId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        permissions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      
      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.description) updates.description = input.description;
      if (input.permissions) updates.permissions = input.permissions;
      updates.updatedAt = new Date();

      await db.update(customRoles).set(updates).where(eq(customRoles.id, input.roleId));
      return { success: true };
    }),

  // Delete role
  deleteRole: adminProcedure
    .input(z.object({ roleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      
      await db.delete(customRoles).where(eq(customRoles.id, input.roleId));
      return { success: true };
    }),

  // Assign role to user
  assignRoleToUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        roleId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false, message: "Database error" };
      
      const existing = await db
        .select()
        .from(userRoleAssignments)
        .where(
          and(
            eq(userRoleAssignments.userId, input.userId),
            eq(userRoleAssignments.roleId, input.roleId)
          )
        );

      if (existing.length > 0) {
        return { success: false, message: "User already has this role" };
      }

      await db.insert(userRoleAssignments).values({
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: ctx.user.id,
      });
      return { success: true };
    }),

  // Remove role from user
  removeRoleFromUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        roleId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      
      await db
        .delete(userRoleAssignments)
        .where(
          and(
            eq(userRoleAssignments.userId, input.userId),
            eq(userRoleAssignments.roleId, input.roleId)
          )
        );
      return { success: true };
    }),

  // Get user roles
  getUserRoles: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const assignments = await db
        .select()
        .from(userRoleAssignments)
        .where(eq(userRoleAssignments.userId, input.userId));

      if (assignments.length === 0) return [];

      const roleIds = assignments.map((a) => a.roleId);
      const roles = await db
        .select()
        .from(customRoles)
        .where(eq(customRoles.id, roleIds[0]));

      return roles;
    }),

  // List all users
  listUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const allUsers = await db.select().from(users);
    
    // Get custom roles for each user
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        const assignments = await db
          .select()
          .from(userRoleAssignments)
          .where(eq(userRoleAssignments.userId, user.id));
        
        return {
          ...user,
          customRoles: assignments.map((a) => a.roleId),
        };
      })
    );
    
    return usersWithRoles;
  }),

  // Check permission
  hasPermission: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        permission: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return false;
      
      const assignments = await db
        .select()
        .from(userRoleAssignments)
        .where(eq(userRoleAssignments.userId, input.userId));

      if (assignments.length === 0) return false;

      const roles = await db
        .select()
        .from(customRoles)
        .where(eq(customRoles.id, assignments[0].roleId));

      if (roles.length === 0) return false;
      const permissions = roles[0].permissions as string[] | null;
      return Array.isArray(permissions) && permissions.includes(input.permission);
    }),
});
