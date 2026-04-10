import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getEmailDigestPreferences,
  updateEmailDigestPreferences,
  getDigestSummary,
} from "../db";

export const emailDigestRouter = router({
  // Get current user's digest preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const preferences = await getEmailDigestPreferences(ctx.user.id);
    return preferences || {
      userId: ctx.user.id,
      enabled: true,
      frequency: "daily",
      sendTime: "06:00",
      includeLeads: true,
      includeTickets: true,
      includeApprovals: true,
      lastSentAt: null,
    };
  }),

  // Update digest preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        frequency: z.enum(["daily", "weekly"]).optional(),
        sendTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:MM format
        includeLeads: z.boolean().optional(),
        includeTickets: z.boolean().optional(),
        includeApprovals: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await updateEmailDigestPreferences(ctx.user.id, input);
      return { success: true, message: "Preferences updated successfully" };
    }),

  // Get digest summary (for preview)
  getDigestSummary: protectedProcedure.query(async ({ ctx }) => {
    return await getDigestSummary(ctx.user.id);
  }),

  // Test send digest (admin only)
  testSend: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can test send digest");
    }

    // Import here to avoid circular dependency
    const { runDigestNow } = await import("../_core/digestScheduler");
    
    try {
      await runDigestNow();
      return { success: true, message: "Test digest sent successfully" };
    } catch (error) {
      throw new Error(`Failed to send test digest: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }),
});
