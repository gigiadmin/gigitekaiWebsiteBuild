import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { findAdminByEmail, updateLastLogin } from "../admin-auth";
import { TRPCError } from "@trpc/server";

export const adminUnlockRouter = router({
  // Emergency unlock endpoint - creates session directly with password
  unlock: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Security: only accept the hardcoded emergency password
      const EMERGENCY_PASSWORD = "YGnali421!!!";
      
      if (input.password !== EMERGENCY_PASSWORD) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid password",
        });
      }

      // Find the default admin account
      const admin = await findAdminByEmail("harry@gigitekai.com");
      if (!admin) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin account not found",
        });
      }

      // Update last login
      await updateLastLogin(admin.id);

      // Set session cookie
      ctx.res.setHeader(
        "Set-Cookie",
        `app_session_id=${Buffer.from(JSON.stringify({ 
          adminId: admin.id, 
          email: admin.email,
          role: admin.role,
          timestamp: Date.now()
        })).toString("base64")}; Path=/; HttpOnly; Secure; SameSite=Strict`
      );

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

  // Get unlock status
  status: publicProcedure.query(async () => {
    return {
      unlockAvailable: true,
      instructions: "Use the emergency unlock endpoint with the master password",
    };
  }),
});
