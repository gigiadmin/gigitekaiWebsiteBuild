import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { realtimeChatSessions, realtimeChatMessages, userSessions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getOnlineUsers } from "../_core/websocket";

export const chatRouter = router({
  // Get online users (for admin)
  getOnlineUsers: protectedProcedure.query(async () => {
    const onlineUserIds = await getOnlineUsers();
    const db = await getDb();
    if (!db) return [];

    const users = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.isOnline, true));

    return users.map((session) => ({
      userId: session.userId,
      isOnline: session.isOnline,
      lastActivityAt: session.lastActivityAt,
    }));
  }),

  // Create or get chat session
  getOrCreateSession: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const targetUserId = input.userId || ctx.user.id;

      // Check if session already exists
      const existingSessions = await db
        .select()
        .from(realtimeChatSessions)
        .where(
          and(
            eq(realtimeChatSessions.userId, targetUserId),
            eq(realtimeChatSessions.status, "active")
          )
        );

      if (existingSessions.length > 0) {
        return existingSessions[0];
      }

      // Create new session
      const result = await db
        .insert(realtimeChatSessions)
        .values({
          userId: targetUserId,
          adminId: ctx.user.role === "admin" ? ctx.user.id : undefined,
          status: "active",
        })
        .$returningId();

      return {
        id: result[0].id,
        userId: targetUserId,
        adminId: ctx.user.role === "admin" ? ctx.user.id : undefined,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

  // Get chat messages for a session
  getMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Verify user has access to this session
      const session = await db
        .select()
        .from(realtimeChatSessions)
        .where(eq(realtimeChatSessions.id, input.sessionId));

      if (session.length === 0) {
        throw new Error("Session not found");
      }

      const chatSession = session[0];
      if (
        ctx.user.id !== chatSession.userId &&
        ctx.user.id !== chatSession.adminId &&
        ctx.user.role !== "admin"
      ) {
        throw new Error("Unauthorized");
      }

      const messages = await db
        .select()
        .from(realtimeChatMessages)
        .where(eq(realtimeChatMessages.sessionId, input.sessionId));

      return messages;
    }),

  // Close chat session
  closeSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user is admin or owner
      const session = await db
        .select()
        .from(realtimeChatSessions)
        .where(eq(realtimeChatSessions.id, input.sessionId));

      if (session.length === 0) {
        throw new Error("Session not found");
      }

      if (
        ctx.user.role !== "admin" &&
        ctx.user.id !== session[0].userId
      ) {
        throw new Error("Unauthorized");
      }

      await db
        .update(realtimeChatSessions)
        .set({
          status: "closed",
          closedAt: new Date(),
        })
        .where(eq(realtimeChatSessions.id, input.sessionId));

      return { success: true };
    }),

  // Get user's active sessions (for user)
  getUserSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const sessions = await db
      .select()
      .from(realtimeChatSessions)
      .where(
        and(
          eq(realtimeChatSessions.userId, ctx.user.id),
          eq(realtimeChatSessions.status, "active")
        )
      );

    return sessions;
  }),

  // Get admin's active sessions
  getAdminSessions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can view all sessions");
    }

    const db = await getDb();
    if (!db) return [];

    const sessions = await db
      .select()
      .from(realtimeChatSessions)
      .where(eq(realtimeChatSessions.status, "active"));

    return sessions;
  }),

  // Mark messages as read
  markAsRead: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(realtimeChatMessages)
        .set({ isRead: true })
        .where(
          and(
            eq(realtimeChatMessages.sessionId, input.sessionId),
            eq(realtimeChatMessages.senderId, ctx.user.id)
          )
        );

      return { success: true };
    }),
});
