/**
 * Admin Auth Router
 * Handles username/password authentication for admin portal
 * Bypasses Manus OAuth - uses its own JWT session system
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  findAdminByEmail,
  findAdminById,
  verifyPassword,
  signAdminToken,
  verifyAdminToken,
  buildAdminSessionCookieHeader,
  clearAdminSessionCookieHeader,
  getAdminSessionCookie,
  createAdminAccount,
  updateLastLogin,
  getAllAdminAccounts,
  updateAdminAccount,
  deleteAdminAccount,
  hashPassword,
} from "../admin-auth";
import type { Request, Response } from "express";

// ── Helper: get admin from request cookies ────────────────────────────────────

export async function getAdminFromRequest(req: Request) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = getAdminSessionCookie(cookies);
  if (!token) return null;
  const payload = await verifyAdminToken(token);
  if (!payload) return null;
  const admin = await findAdminById(payload.adminId);
  if (!admin || !admin.isActive) return null;
  return admin;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name.trim()] = rest.join("=").trim();
  });
  return cookies;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const adminAuthRouter = router({
  // Login with email/password
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const admin = await findAdminByEmail(input.email);

      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      if (!admin.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account is disabled. Contact your administrator.",
        });
      }

      const passwordValid = await verifyPassword(input.password, admin.hashedPassword);
      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Sign JWT token
      const token = await signAdminToken({
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });

      // Set cookie on response
      const res = (ctx as unknown as { res: Response }).res;
      if (res) {
        res.setHeader("Set-Cookie", buildAdminSessionCookieHeader(token));
      }

      // Update last login timestamp
      await updateLastLogin(admin.id);

      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      };
    }),

  // Logout - clear session cookie
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const res = (ctx as unknown as { res: Response }).res;
    if (res) {
      res.setHeader("Set-Cookie", clearAdminSessionCookieHeader());
    }
    return { success: true };
  }),

  // Get current admin session
  me: publicProcedure.query(async ({ ctx }) => {
    const req = (ctx as unknown as { req: Request }).req;
    if (!req) return null;
    const admin = await getAdminFromRequest(req);
    if (!admin) return null;
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  }),

  // Register a new admin/agent (admin only)
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(8),
        role: z.enum(["admin", "agent", "viewer"]).default("agent"),
        adminSecret: z.string(), // Simple secret to prevent unauthorized registration
      })
    )
    .mutation(async ({ input }) => {
      // Check admin secret (stored as env var or hardcoded for now)
      const adminSecret = process.env.ADMIN_REGISTRATION_SECRET || "gigitekai-admin-2024";
      if (input.adminSecret !== adminSecret) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid admin registration secret",
        });
      }

      // Check if email already exists
      const existing = await findAdminByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const admin = await createAdminAccount({
        email: input.email,
        name: input.name,
        password: input.password,
        role: input.role,
      });

      return {
        success: true,
        admin: {
          id: admin!.id,
          email: admin!.email,
          name: admin!.name,
          role: admin!.role,
        },
      };
    }),

  // List all admin accounts (admin only)
  listAccounts: publicProcedure.query(async ({ ctx }) => {
    const req = (ctx as unknown as { req: Request }).req;
    const admin = req ? await getAdminFromRequest(req) : null;
    if (!admin || admin.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return getAllAdminAccounts();
  }),

  // Update an admin account (admin only)
  updateAccount: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).optional(),
        role: z.enum(["admin", "agent", "viewer"]).optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(8).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const req = (ctx as unknown as { req: Request }).req;
      const admin = req ? await getAdminFromRequest(req) : null;
      if (!admin || admin.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      await updateAdminAccount(input.id, input);
      return { success: true };
    }),

  // Delete an admin account (admin only)
  deleteAccount: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const req = (ctx as unknown as { req: Request }).req;
      const admin = req ? await getAdminFromRequest(req) : null;
      if (!admin || admin.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      await deleteAdminAccount(input.id);
      return { success: true };
    }),

  // Change own password (any authenticated admin/agent)
  changePassword: publicProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const req = (ctx as unknown as { req: Request }).req;
      const admin = req ? await getAdminFromRequest(req) : null;
      if (!admin) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }

      // Verify current password
      const valid = await verifyPassword(input.currentPassword, admin.hashedPassword);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      }

      // Hash and update new password
      const hashedPassword = await hashPassword(input.newPassword);
      await updateAdminAccount(admin.id, { password: input.newPassword });
      return { success: true };
    }),

  // Forgot password - send reset link via email
  forgotPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      try {
        const admin = await findAdminByEmail(input.email);
        
        // Always return success to prevent email enumeration
        if (!admin) {
          return { success: true, message: 'If an account exists, a reset link will be sent' };
        }

        // Generate reset token
        const resetToken = await signAdminToken({
          adminId: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          isReset: true,
        });

        // Send reset email
        const { sendEmail } = await import('../_core/email');
        const resetLink = `${process.env.VITE_FRONTEND_URL || 'https://gigitekai.com'}/admin/reset-password?token=${resetToken}`;
        
        await sendEmail({
          to: admin.email,
          subject: 'GigitekAI Admin Portal - Password Reset Request',
          html: `
            <h2>Password Reset Request</h2>
            <p>Hi ${admin.name},</p>
            <p>You requested a password reset for your GigitekAI Admin Portal account.</p>
            <p><a href="${resetLink}" style="background-color: #00D4FF; color: #0A0E1A; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>If you have any questions, contact support@gigitekai.com</p>
          `
        });

        return { success: true, message: 'If an account exists, a reset link will be sent' };
      } catch (error) {
        console.error('[AdminAuth] Forgot password error:', error);
        return { success: true, message: 'If an account exists, a reset link will be sent' };
      }
    }),

  // Reset password with token
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify reset token
        const payload = await verifyAdminToken(input.token);
        if (!payload || !(payload as any).isReset) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired reset token'
          });
        }

        // Update password
        await updateAdminAccount(payload.adminId, { password: input.newPassword });

        return { success: true, message: 'Password reset successfully' };
      } catch (error) {
        console.error('[AdminAuth] Reset password error:', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Failed to reset password'
        });
      }
    }),

  // Create a new agent account (admin only, no secret required)
  createAccount: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(8),
        role: z.enum(["admin", "agent", "viewer"]).default("agent"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const req = (ctx as unknown as { req: Request }).req;
      const admin = req ? await getAdminFromRequest(req) : null;
      if (!admin || admin.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const existing = await findAdminByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
      }

      const newAccount = await createAdminAccount({
        email: input.email,
        name: input.name,
        password: input.password,
        role: input.role,
      });

      return {
        success: true,
        account: {
          id: newAccount!.id,
          email: newAccount!.email,
          name: newAccount!.name,
          role: newAccount!.role,
        },
      };
    }),

  // Azure AD (MSAL) login — validates Microsoft access token via Graph API, issues admin session cookie
  azureLogin: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        email: z.string().email(),
        name: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const res = (ctx as unknown as { res: Response }).res;

      // Validate the access token with Microsoft Graph
      const graphRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${input.accessToken}` },
      });
      if (!graphRes.ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Microsoft access token. Please sign in again.",
        });
      }
      const graphUser = await graphRes.json() as { mail?: string; userPrincipalName?: string; displayName?: string };
      const verifiedEmail = (graphUser.mail || graphUser.userPrincipalName || "").toLowerCase();

      // Allowed admin emails — only these M365 accounts can access the admin portal
      const ALLOWED_ADMINS = ["harry@gigitekai.com"];
      if (!ALLOWED_ADMINS.includes(verifiedEmail)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Access denied. ${verifiedEmail} is not authorized to access this portal.`,
        });
      }

      // Find or auto-create the admin account (first-time Azure AD login)
      let admin = await findAdminByEmail(verifiedEmail);
      if (!admin) {
        admin = await createAdminAccount({
          email: verifiedEmail,
          name: graphUser.displayName || input.name,
          password: crypto.randomUUID(), // random — Azure AD is the auth method
          role: "admin",
        });
      }
      if (!admin) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create admin account" });
      }
      if (!admin.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account is disabled. Contact your administrator." });
      }

      await updateLastLogin(admin.id);
      const token = await signAdminToken({
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
      if (res) res.setHeader("Set-Cookie", buildAdminSessionCookieHeader(token));

      return {
        success: true,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      };
    }),
});
