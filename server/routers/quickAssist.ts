import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { quickAssistSessions } from "../../drizzle/schema";
import { desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Microsoft Quick Assist Integration
 * Generates shareable Quick Assist session codes for remote support
 */

export const quickAssistRouter = router({
  /**
   * Generate a new Quick Assist session
   */
  createSession: protectedProcedure
    .input(
      z.object({
        ticketId: z.number().optional(),
        customerId: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.insert(quickAssistSessions).values({
        sessionCode,
        ticketId: input.ticketId || null,
        customerId: input.customerId || null,
        initiatedBy: ctx.user.id,
        description: input.description || null,
        status: "active",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      return {
        sessionCode,
        quickAssistUrl: `https://quickassist.microsoft.com/?session=${sessionCode}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }),

  /**
   * Get active Quick Assist session for a ticket
   */
  getSessionByTicket: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const sessions = await db.select().from(quickAssistSessions).limit(1);
      const session = sessions.find((s: any) => s.ticketId === input.ticketId);

      if (!session) return null;

      return {
        sessionCode: session.sessionCode,
        quickAssistUrl: `https://quickassist.microsoft.com/?session=${session.sessionCode}`,
        status: session.status,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      };
    }),

  /**
   * End a Quick Assist session
   */
  endSession: protectedProcedure
    .input(z.object({ sessionCode: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const sessions = await db.select().from(quickAssistSessions);
      const session = sessions.find((s: any) => s.sessionCode === input.sessionCode);
      
      if (session) {
        await db.update(quickAssistSessions).set({ status: "ended", endedAt: new Date() });
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
      const allSessions = await db.select().from(quickAssistSessions).orderBy(desc(quickAssistSessions.createdAt));
      const sessions = allSessions.filter((s: any) => s.ticketId === input.ticketId);

      return sessions.map((s: any) => ({
        sessionCode: s.sessionCode,
        status: s.status,
        createdAt: s.createdAt,
        endedAt: s.endedAt,
        duration: s.endedAt ? Math.round((s.endedAt.getTime() - s.createdAt.getTime()) / 1000 / 60) : null,
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
    const allSessions = await db.select().from(quickAssistSessions).orderBy(desc(quickAssistSessions.createdAt));
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
