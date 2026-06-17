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
  signResetToken,
  verifyResetToken,
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
import {
  getMsOAuthUrl,
  exchangeCodeForToken,
  getUserFromToken,
  isAuthorizedAdmin,
  signAdminToken as signMs365Token,
  verifyAdminToken as verifyMs365Token,
  buildAdminSessionCookieHeader as buildMs365Cookie,
  getAdminSessionCookie as getMs365Cookie,
} from "../ms365-admin-auth";
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
  // Get MS 365 OAuth login URL
  getMsOAuthUrl: publicProcedure
    .input(
      z.object({
        redirectUri: z.string().url(),
      })
    )
    .query(({ input }) => {
      try {
        const url = getMsOAuthUrl(input.redirectUri);
        return { url };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate OAuth URL",
        });
      }
    }),

  // Handle MS 365 OAuth callback
  handleMsOAuthCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        redirectUri: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Exchange code for token
        const accessToken = await exchangeCodeForToken(input.code, input.redirectUri);

        // Get user info
        const user = await getUserFromToken(accessToken);

        // Check if user is authorized
        const isAuthorized = await isAuthorizedAdmin(user.email);
        if (!isAuthorized) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to access the admin portal.",
          });
        }

        // Sign JWT token
        const token = await signMs365Token({
          adminId: user.id,
          email: user.email,
          name: user.name,
          role: "admin",
        });

        // Set cookie on response
        const forwardedProto = ctx.req.headers["x-forwarded-proto"];
        const isSecure = process.env.NODE_ENV === "production" || ctx.req.protocol === "https" ||
          (typeof forwardedProto === "string" && forwardedProto.split(",")[0].trim() === "https");
        
        // Extract domain from request host for cookie domain setting
        let domain: string | undefined = undefined;
        const host = ctx.req.headers.host || "";
        const hostWithoutPort = host.split(":")[0];
        if (host && !hostWithoutPort.includes("localhost") && !hostWithoutPort.includes("127.0.0.1") && !/^\d+\./.test(hostWithoutPort)) {
          // For production domains, set domain to root domain
          const parts = hostWithoutPort.split(".");
          if (parts.length >= 2) {
            domain = "." + parts.slice(-2).join("."); // e.g., ".gigitekai.com"
          }
        }
        
        ctx.res.setHeader("Set-Cookie", buildMs365Cookie(token, isSecure, domain));

        return {
          success: true,
          email: user.email,
          name: user.name,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("[Admin Auth] MS OAuth callback failed:", {
          message: errorMsg,
          stack: error instanceof Error ? error.stack : undefined,
          redirectUri: input.redirectUri,
          hasCode: !!input.code,
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Authentication failed: ${errorMsg}`,
        });
      }
    }),

  // Legacy: Login with email/password (kept for backward compatibility)
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        password: z.string().min(1, "Password is required"),
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

      // Set cookie on response — detect HTTPS via x-forwarded-proto
      const forwardedProtoLogin = ctx.req.headers["x-forwarded-proto"];
      const isSecureLogin = process.env.NODE_ENV === "production" || ctx.req.protocol === "https" ||
        (typeof forwardedProtoLogin === "string" && forwardedProtoLogin.split(",")[0].trim() === "https");
      
      // Extract domain from request host for cookie domain setting
      let domain: string | undefined = undefined;
      const host = ctx.req.headers.host || "";
      const hostWithoutPort = host.split(":")[0];
      if (host && !hostWithoutPort.includes("localhost") && !hostWithoutPort.includes("127.0.0.1") && !/^\d+\./.test(hostWithoutPort)) {
        // For production domains, set domain to root domain
        const parts = hostWithoutPort.split(".");
        if (parts.length >= 2) {
          domain = "." + parts.slice(-2).join("."); // e.g., ".gigitekai.com"
        }
      }
      
      ctx.res.setHeader("Set-Cookie", buildAdminSessionCookieHeader(token, isSecureLogin, domain));

      // Update last login timestamp (legacy)
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
  // Logout (works for both OAuth and legacy)
  logout: publicProcedure.mutation(async ({ ctx }) => {
      const forwardedProtoLogout = ctx.req.headers["x-forwarded-proto"];
      const isSecureLogout = ctx.req.protocol === "https" ||
        (typeof forwardedProtoLogout === "string" && forwardedProtoLogout.split(",")[0].trim() === "https");
      ctx.res.setHeader("Set-Cookie", clearAdminSessionCookieHeader(isSecureLogout));
    return { success: true };
  }),

  // Get current admin session
  me: publicProcedure.query(async ({ ctx }) => {
    const req = ctx.req;
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
        email: z.string().email("Please enter a valid email address"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        password: z.string().min(8, "Password must be at least 8 characters"),
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
    const req = ctx.req;
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
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        role: z.enum(["admin", "agent", "viewer"]).optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(8, "Password must be at least 8 characters").optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const req = ctx.req;
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
      const req = ctx.req;
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
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const req = ctx.req;
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
      email: z.string().email("Please enter a valid email address"),
    }))
    .mutation(async ({ input }) => {
      try {
        const admin = await findAdminByEmail(input.email);
        
        // Always return success to prevent email enumeration
        if (!admin) {
          return { success: true, message: 'If an account exists, a reset link will be sent' };
        }

        // Generate short-lived reset token (1 hour expiration)
        const resetToken = await signResetToken({
          adminId: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
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
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify reset token using separate reset secret
        const payload = await verifyResetToken(input.token);
        if (!payload) {
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
        email: z.string().email("Please enter a valid email address"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(["admin", "agent", "viewer"]).default("agent"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const req = ctx.req;
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
        email: z.string().email("Please enter a valid email address"),
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Detect HTTPS via x-forwarded-proto (production is behind a reverse proxy)
      const forwardedProto = ctx.req.headers["x-forwarded-proto"];
      const isSecure = ctx.req.protocol === "https" ||
        (typeof forwardedProto === "string" && forwardedProto.split(",")[0].trim() === "https");

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
      const adminEmailsEnv = process.env.ADMIN_EMAILS || "harry@gigitekai.com,nas@gigitekai.com";
      const ALLOWED_ADMINS = adminEmailsEnv.split(",").map(e => e.trim().toLowerCase());
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
      ctx.res.setHeader("Set-Cookie", buildAdminSessionCookieHeader(token, isSecure));

      return {
        success: true,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      };
    }),
});
