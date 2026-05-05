/**
 * Magic Link Auth Router
 * Passwordless admin login via email magic links
 * Eliminates OAuth cross-domain cookie issues
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, magicLinkTokens } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import type { Request, Response } from "express";
import { randomBytes } from "crypto";

const COOKIE_NAME = "session";
const TOKEN_EXPIRY_MINUTES = 15;

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Check if a token is expired
 */
function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export const magicLinkAuthRouter = router({
  /**
   * Request a magic link email
   * Admin enters their email, receives a login link
   */
  requestMagicLink: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        // Check if user exists and is an admin
        const user = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        
        if (user.length === 0 || user[0].role !== "admin") {
          // Always return success to prevent email enumeration
          return {
            success: true,
            message: "If an admin account exists with this email, a login link will be sent",
          };
        }

        const admin = user[0];

        // Generate magic link token
        const token = generateToken();
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

        // Store token in database
        await db.insert(magicLinkTokens).values({
          email: admin.email!,
          token,
          expiresAt,
          used: false,
        });

        // Build magic link URL
        const frontendUrl = process.env.VITE_FRONTEND_URL || "https://gigitekai.com";
        const magicLink = `${frontendUrl}/admin/magic-link?token=${token}`;

        // Send email
        await sendEmail({
          to: admin.email!,
          subject: "GigitekAI Admin Portal - Your Login Link",
          html: `
            <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333;">
              <h2 style="color: #00D4FF;">Your GigitekAI Admin Login Link</h2>
              <p>Hi ${admin.name || "Admin"},</p>
              <p>Click the link below to securely log in to your GigitekAI Admin Portal:</p>
              <p style="margin: 24px 0;">
                <a href="${magicLink}" style="background-color: #00D4FF; color: #0A0E1A; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Log In to Admin Portal
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">This link expires in ${TOKEN_EXPIRY_MINUTES} minutes.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this login link, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">
                GigitekAI Admin Portal | support@gigitekai.com | (727) 382-5776
              </p>
            </div>
          `,
        });

        return {
          success: true,
          message: "If an admin account exists with this email, a login link will be sent",
        };
      } catch (error) {
        console.error("[MagicLink] Request error:", error);
        // Always return success to prevent email enumeration
        return {
          success: true,
          message: "If an admin account exists with this email, a login link will be sent",
        };
      }
    }),

  /**
   * Verify magic link token and create session
   * Called when admin clicks the email link
   */
  verifyMagicLink: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        // Look up token
        const tokenRecord = await db
          .select()
          .from(magicLinkTokens)
          .where(eq(magicLinkTokens.token, input.token))
          .limit(1);

        if (tokenRecord.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid magic link",
          });
        }

        const record = tokenRecord[0];

        // Check if token is expired
        if (isTokenExpired(record.expiresAt)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Magic link has expired. Please request a new one.",
          });
        }

        // Check if token was already used
        if (record.used) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "This magic link has already been used",
          });
        }

        // Get user
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, record.email))
          .limit(1);

        if (user.length === 0 || user[0].role !== "admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User is not an admin",
          });
        }

        const admin = user[0];

        // Mark token as used
        await db
          .update(magicLinkTokens)
          .set({ used: true })
          .where(eq(magicLinkTokens.token, input.token));

        // Create session cookie (same as Manus OAuth does)
        const req = (ctx as unknown as { req: Request }).req;
        const res = (ctx as unknown as { res: Response }).res;

        if (res && req) {
          const cookieOptions = getSessionCookieOptions(req);
          
          // Create session token using SDK
          const sessionToken = await sdk.createSessionToken(admin.openId, {
            name: admin.name || admin.email!,
            expiresInMs: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
        }

        return {
          success: true,
          message: "Logged in successfully",
          user: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          },
        };
      } catch (error) {
        console.error("[MagicLink] Verify error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify magic link",
        });
      }
    }),
});
