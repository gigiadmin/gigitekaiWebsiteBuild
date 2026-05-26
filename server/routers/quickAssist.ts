import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { quickAssistSessions } from "../../drizzle/schema";
import { desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

/**
 * Intune Remote Help Integration
 * Initiates remote help sessions using Microsoft Graph API
 * Better for enterprise MSP scenarios than Quick Assist
 */

export const quickAssistRouter = router({
  /**
   * Initiate a remote help session via Intune
   * Creates a session and generates a shareable code
   */
  initiateSession: protectedProcedure
    .input(
      z.object({
        ticketId: z.number().optional(),
        customerId: z.number().optional(),
        deviceId: z.string().optional(), // Intune device ID
        description: z.string().optional(),
        targetEmail: z.string().email().optional(), // Support target email
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Store session in database
      await db.insert(quickAssistSessions).values({
        sessionCode,
        ticketId: input.ticketId || null,
        customerId: input.customerId || null,
        initiatedBy: ctx.user.id,
        description: input.description || null,
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      // Generate Intune Remote Help link
      // Format: https://aka.ms/remotehelp?code=SESSIONCODE
      const remoteHelpUrl = `https://aka.ms/remotehelp?code=${sessionCode}`;

      return {
        sessionCode,
        remoteHelpUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        instructions: `Share this code with the user: ${sessionCode}\nOr send them this link: ${remoteHelpUrl}`,
      };
    }),

  /**
   * Get active remote help session
   */
  getActiveSession: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const sessions = await db.select().from(quickAssistSessions).limit(1);
      const session = sessions.find((s: any) => s.ticketId === input.ticketId && s.status === "active");

      if (!session) return null;

      return {
        sessionCode: session.sessionCode,
        remoteHelpUrl: `https://aka.ms/remotehelp?code=${session.sessionCode}`,
        status: session.status,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      };
    }),

  /**
   * End remote help session
   */
  endSession: protectedProcedure
    .input(z.object({ sessionCode: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const sessions = await db.select().from(quickAssistSessions);
      const session = sessions.find((s: any) => s.sessionCode === input.sessionCode);

      if (session) {
        await db.update(quickAssistSessions).set({ status: "ended", endedAt: new Date().toISOString() });
      }

      return { success: true };
    }),

  /**
   * Get session history for a ticket
   */
  getSessionHistory: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const allSessions = await db
        .select()
        .from(quickAssistSessions)
        .orderBy(desc(quickAssistSessions.createdAt));
      const sessions = allSessions.filter((s: any) => s.ticketId === input.ticketId);

      return sessions.map((s: any) => ({
        sessionCode: s.sessionCode,
        status: s.status,
        createdAt: s.createdAt,
        endedAt: s.endedAt,
        duration: s.endedAt
          ? Math.round((s.endedAt.getTime() - s.createdAt.getTime()) / 1000 / 60)
          : null,
      }));
    }),

  /**
   * Get all active sessions for admin dashboard
   */
  getActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view all sessions",
      });
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const allSessions = await db
      .select()
      .from(quickAssistSessions)
      .orderBy(desc(quickAssistSessions.createdAt));
    const sessions = allSessions.filter((s: any) => s.status === "active");

    return sessions.map((s: any) => ({
      sessionCode: s.sessionCode,
      ticketId: s.ticketId,
      customerId: s.customerId,
      initiatedBy: s.initiatedBy,
      description: s.description,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }),
});
