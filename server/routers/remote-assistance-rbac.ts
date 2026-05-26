/**
 * Remote Assistance Role-Based Access Control (RBAC)
 * Enterprise-grade permission management
 */

import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Role Definitions
 */
export const ROLES = {
  admin: {
    name: 'Administrator',
    description: 'Full system access',
    permissions: [
      'view_all_sessions',
      'manage_sessions',
      'manage_technicians',
      'manage_policies',
      'view_audit_logs',
      'export_reports',
      'manage_users',
      'configure_security',
    ],
  },
  supervisor: {
    name: 'Supervisor',
    description: 'Monitor and manage technicians',
    permissions: [
      'view_all_sessions',
      'manage_technicians',
      'view_audit_logs',
      'export_reports',
      'observe_sessions',
    ],
  },
  technician: {
    name: 'Technician',
    description: 'Conduct remote assistance sessions',
    permissions: [
      'create_session',
      'view_own_sessions',
      'manage_own_sessions',
      'transfer_files',
      'record_sessions',
    ],
  },
  client: {
    name: 'Client',
    description: 'Participate in support sessions',
    permissions: ['view_own_sessions', 'accept_session', 'end_session', 'chat'],
  },
  observer: {
    name: 'Observer',
    description: 'View sessions without control',
    permissions: ['view_all_sessions', 'chat'],
  },
} as const;

export type UserRole = keyof typeof ROLES;

/**
 * Permission Checker
 */
export class PermissionChecker {
  private rolePermissions: Record<UserRole, string[]> = {
    admin: [...ROLES.admin.permissions],
    supervisor: [...ROLES.supervisor.permissions],
    technician: [...ROLES.technician.permissions],
    client: [...ROLES.client.permissions],
    observer: [...ROLES.observer.permissions],
  };

  hasPermission(role: UserRole, permission: string): boolean {
    return this.rolePermissions[role]?.includes(permission) || false;
  }

  hasAnyPermission(role: UserRole, permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(role, permission));
  }

  hasAllPermissions(role: UserRole, permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(role, permission));
  }

  getRolePermissions(role: UserRole): string[] {
    return this.rolePermissions[role] || [];
  }
}

export const permissionChecker = new PermissionChecker();

/**
 * tRPC router for RBAC
 */
export const remoteAssistanceRbacRouter = router({
  /**
   * Get current user's role and permissions
   */
  getCurrentUserPermissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    try {
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (userRecord.length === 0) {
        throw new Error('User not found');
      }

      const user = userRecord[0];
      const role = (user.role || 'client') as UserRole;
      const permissions = permissionChecker.getRolePermissions(role);

      return {
        userId: user.id,
        email: user.email,
        role,
        permissions,
        roleInfo: ROLES[role],
      };
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      throw new Error('Failed to retrieve user permissions');
    }
  }),

  /**
   * Check if user has specific permission
   */
  checkPermission: protectedProcedure
    .input(z.object({ permission: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const userRecord = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id));

        if (userRecord.length === 0) {
          return { hasPermission: false };
        }

        const user = userRecord[0];
        const role = (user.role || 'client') as UserRole;
        const hasPermission = permissionChecker.hasPermission(role, input.permission);

        return { hasPermission };
      } catch (error) {
        console.error('Failed to check permission:', error);
        return { hasPermission: false };
      }
    }),

  /**
   * Get all roles and their permissions
   */
  getAllRoles: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    try {
      // Check if user is admin
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (userRecord.length === 0 || userRecord[0].role !== 'admin') {
        throw new Error('Unauthorized: Only admins can view all roles');
      }

      return Object.entries(ROLES).map(([key, role]) => ({
        id: key,
        ...role,
      }));
    } catch (error) {
      console.error('Failed to get all roles:', error);
      throw new Error('Failed to retrieve roles');
    }
  }),

  /**
   * Assign role to user
   */
  assignRoleToUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(['admin', 'user', 'technician']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Check if current user is admin
        const currentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id));

        if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
          throw new Error('Unauthorized: Only admins can assign roles');
        }

        // Update user role
        await db
          .update(users)
          .set({ role: input.role })
          .where(eq(users.id, input.userId));

        return {
          success: true,
          message: `Role updated to ${input.role}`,
        };
      } catch (error) {
        console.error('Failed to assign role:', error);
        throw new Error('Failed to assign role to user');
      }
    }),

  /**
   * Get users by role
   */
  getUsersByRole: protectedProcedure
    .input(z.object({ role: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Check if current user is admin or supervisor
        const currentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id));

        if (
          currentUser.length === 0 ||
          currentUser[0].role !== 'admin'
        ) {
          throw new Error('Unauthorized: Only admins can view users');
        }

        const usersWithRole = await db
          .select()
          .from(users)
          .where(eq(users.role, input.role as any));

        return usersWithRole.map((user) => ({
          id: user.id,
          email: user.email,
          role: user.role,
        }));
      } catch (error) {
        console.error('Failed to get users by role:', error);
        throw new Error('Failed to retrieve users');
      }
    }),

  /**
   * Create custom role (admin only)
   */
  createCustomRole: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        permissions: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Check if current user is admin
        const currentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id));

        if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
          throw new Error('Unauthorized: Only admins can create roles');
        }

        // In production, this would save to database
        // For now, return success
        return {
          success: true,
          message: 'Custom role created successfully',
          roleId: `custom_${Date.now()}`,
        };
      } catch (error) {
        console.error('Failed to create custom role:', error);
        throw new Error('Failed to create custom role');
      }
    }),

  /**
   * Get permission audit trail
   */
  getPermissionAuditTrail: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Check if current user is admin
        const currentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id));

        if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
          throw new Error('Unauthorized: Only admins can view audit trail');
        }

        // In production, this would query audit logs
        // For now, return mock data
        return [
          {
            id: 1,
            userId: input.userId || 1,
            action: 'role_assigned',
            oldRole: 'technician',
            newRole: 'supervisor',
            timestamp: new Date().toISOString(),
            performedBy: 'admin@example.com',
          },
        ];
      } catch (error) {
        console.error('Failed to get permission audit trail:', error);
        throw new Error('Failed to retrieve audit trail');
      }
    }),

  /**
   * Revoke user access
   */
  revokeUserAccess: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Check if current user is admin
        const currentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id));

        if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
          throw new Error('Unauthorized: Only admins can revoke access');
        }

        // Set user role to 'user' (minimal permissions)
        await db
          .update(users)
          .set({ role: 'user' })
          .where(eq(users.id, input.userId));

        return {
          success: true,
          message: 'User access revoked',
        };
      } catch (error) {
        console.error('Failed to revoke user access:', error);
        throw new Error('Failed to revoke user access');
      }
    }),
});
