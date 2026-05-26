import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getEmailDigestPreferences,
  updateEmailDigestPreferences,
  getDigestSummary,
  getDb,
} from "../db";
import { emailDigestPreferences, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const emailDigestRouter = router({
  // Get current user's digest preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const preferences = await getEmailDigestPreferences(ctx.user.id);
    return preferences || {
      userId: ctx.user.id,
      enabled: 1,
      frequency: "daily",
      sendTime: "06:00",
      includeLeads: 1,
      includeTickets: 1,
      includeApprovals: 1,
      lastSentAt: null,
    };
  }),

  // Update digest preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        frequency: z.enum(["daily", "weekly", "bi-weekly", "monthly"]).optional(),
        sendTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:MM format
        includeLeads: z.boolean().optional(),
        includeTickets: z.boolean().optional(),
        includeApprovals: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mapped: Record<string, unknown> = { ...input };
      if (input.enabled !== undefined) mapped.enabled = input.enabled ? 1 : 0;
      if (input.includeLeads !== undefined) mapped.includeLeads = input.includeLeads ? 1 : 0;
      if (input.includeTickets !== undefined) mapped.includeTickets = input.includeTickets ? 1 : 0;
      if (input.includeApprovals !== undefined) mapped.includeApprovals = input.includeApprovals ? 1 : 0;
      await updateEmailDigestPreferences(ctx.user.id, mapped as any);
      return { success: true, message: "Preferences updated successfully" };
    }),

  // Get digest summary (for preview)
  getDigestSummary: protectedProcedure.query(async ({ ctx }) => {
    return await getDigestSummary(ctx.user.id);
  }),

  // Get all user digest preferences (admin only)
  getAllUserPreferences: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can view all user preferences");
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    const preferences = await db
      .select({
        id: emailDigestPreferences.id,
        userId: emailDigestPreferences.userId,
        userEmail: users.email,
        userName: users.name,
        enabled: emailDigestPreferences.enabled,
        frequency: emailDigestPreferences.frequency,
        sendTime: emailDigestPreferences.sendTime,
        includeLeads: emailDigestPreferences.includeLeads,
        includeTickets: emailDigestPreferences.includeTickets,
        includeApprovals: emailDigestPreferences.includeApprovals,
        lastSentAt: emailDigestPreferences.lastSentAt,
      })
      .from(emailDigestPreferences)
      .innerJoin(users, eq(emailDigestPreferences.userId, users.id));

    return preferences;
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
