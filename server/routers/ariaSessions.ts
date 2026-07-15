import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { ariaSessions, ariaSessionMessages } from "../../drizzle/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export const ariaSessionsRouter = router({
  /**
   * Get or create a session for the current user
   */
  getOrCreateSession: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Check for existing active session
    const existing = await db
      .select()
      .from(ariaSessions)
      .where(and(eq(ariaSessions.userId, ctx.user.id), eq(ariaSessions.status, "active")))
      .limit(1);

    if (existing.length > 0) return existing[0];

    // Create new session
    const [result] = await db.insert(ariaSessions).values({
      userId: ctx.user.id,
      userName: ctx.user.name || "Unknown",
      userEmail: ctx.user.email || "",
      status: "active",
      messageCount: 0,
    });

    const newSession = await db.select().from(ariaSessions).where(eq(ariaSessions.id, result.insertId)).limit(1);
    return newSession[0];
  }),

  /**
   * Add a message to the session (called by Aria command center on each interaction)
   */
  addMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      role: z.enum(["user", "aria", "admin"]),
      content: z.string(),
      intent: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return;

      await db.insert(ariaSessionMessages).values({
        sessionId: input.sessionId,
        role: input.role,
        content: input.content,
        intent: input.intent,
        senderName: input.role === "admin" ? ctx.user.name : undefined,
      });

      // Update session stats
      await db
        .update(ariaSessions)
        .set({
          messageCount: sql`message_count + 1`,
          lastMessageAt: sql`NOW()`,
        })
        .where(eq(ariaSessions.id, input.sessionId));
    }),

  /**
   * List all active sessions (admin view)
   */
  listActiveSessions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(ariaSessions)
      .where(eq(ariaSessions.status, "active"))
      .orderBy(desc(ariaSessions.lastMessageAt));
  }),

  /**
   * List all sessions with pagination (admin view)
   */
  listAllSessions: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(20),
      offset: z.number().int().min(0).default(0),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { sessions: [], total: 0 };

      const conditions = input.status ? eq(ariaSessions.status, input.status) : undefined;
      const [sessions, countResult] = await Promise.all([
        db.select().from(ariaSessions).where(conditions).orderBy(desc(ariaSessions.createdAt)).limit(input.limit).offset(input.offset),
        db.select({ count: sql`COUNT(*)` }).from(ariaSessions).where(conditions),
      ]);

      return { sessions, total: (countResult[0]?.count as number) || 0 };
    }),

  /**
   * Get session messages (for admin to view conversation)
   */
  getSessionMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(ariaSessionMessages)
        .where(eq(ariaSessionMessages.sessionId, input.sessionId))
        .orderBy(ariaSessionMessages.createdAt);
    }),

  /**
   * Take over a session (admin action)
   */
  takeOverSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(ariaSessions)
        .set({
          status: "taken_over",
          takenOverBy: ctx.user.id,
          takenOverByName: ctx.user.name || "Admin",
          takenOverAt: sql`NOW()`,
        })
        .where(eq(ariaSessions.id, input.sessionId));

      // Add system message
      await db.insert(ariaSessionMessages).values({
        sessionId: input.sessionId,
        role: "admin",
        content: `🔄 ${ctx.user.name || "Admin"} has taken over this conversation.`,
        senderName: ctx.user.name || "Admin",
      });

      return { success: true };
    }),

  /**
   * Send admin message to a session
   */
  sendAdminMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.insert(ariaSessionMessages).values({
        sessionId: input.sessionId,
        role: "admin",
        content: input.content,
        senderName: ctx.user.name || "Admin",
      });

      await db
        .update(ariaSessions)
        .set({
          messageCount: sql`message_count + 1`,
          lastMessageAt: sql`NOW()`,
        })
        .where(eq(ariaSessions.id, input.sessionId));

      return { success: true };
    }),

  /**
   * Close a session
   */
  closeSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(ariaSessions)
        .set({ status: "closed", closedAt: sql`NOW()` })
        .where(eq(ariaSessions.id, input.sessionId));

      return { success: true };
    }),
});
