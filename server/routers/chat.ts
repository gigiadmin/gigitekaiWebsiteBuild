import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { realtimeChatSessions, realtimeChatMessages, userSessions, chatSessions, chatMessages, chatLeads, users } from "../../drizzle/schema";
import { eq, and, sql, gte, desc, count } from "drizzle-orm";
import { getOnlineUsers } from "../_core/websocket";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

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

  // Link chat session to help desk ticket
  linkToTicket: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        ticketId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user is admin or owner of the session
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

      // Update session with ticket ID
      await db
        .update(realtimeChatSessions)
        .set({ ticketId: input.ticketId })
        .where(eq(realtimeChatSessions.id, input.sessionId));

      return { success: true };
    }),

  // Export chat transcript
  exportTranscript: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        format: z.enum(["text", "json"]).default("text"),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify access
      const session = await db
        .select()
        .from(realtimeChatSessions)
        .where(eq(realtimeChatSessions.id, input.sessionId));

      if (session.length === 0) throw new Error("Session not found");
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

      // Get user names
      const userIds = Array.from(new Set(messages.map((m) => m.senderId)));
      const userRecords = userIds.length > 0
        ? await db.select({ id: users.id, name: users.name }).from(users)
        : [];
      const userMap = new Map(userRecords.map((u) => [u.id, u.name || `User #${u.id}`]));

      if (input.format === "json") {
        return {
          session: {
            id: chatSession.id,
            status: chatSession.status,
            createdAt: chatSession.createdAt,
            closedAt: chatSession.closedAt,
          },
          messages: messages.map((m) => ({
            sender: userMap.get(m.senderId) || `User #${m.senderId}`,
            role: m.senderRole,
            message: m.message,
            timestamp: m.createdAt,
          })),
        };
      }

      // Text format
      const header = `Chat Transcript - Session #${chatSession.id}\nDate: ${chatSession.createdAt?.toISOString()}\nStatus: ${chatSession.status}\n${"-".repeat(50)}\n`;
      const body = messages
        .map((m) => {
          const name = userMap.get(m.senderId) || `User #${m.senderId}`;
          const time = m.createdAt ? new Date(m.createdAt).toLocaleString() : "";
          return `[${time}] ${name} (${m.senderRole}): ${m.message}`;
        })
        .join("\n");

      return { transcript: header + body };
    }),

  // Chat analytics (admin only)
  getAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view analytics");
      }

      const db = await getDb();
      if (!db) {
        return {
          totalSessions: 0,
          activeSessions: 0,
          closedSessions: 0,
          totalMessages: 0,
          avgMessagesPerSession: 0,
          totalLeads: 0,
          aiChatSessions: 0,
          aiChatMessages: 0,
          escalatedChats: 0,
          recentSessions: [],
        };
      }

      const since = new Date();
      since.setDate(since.getDate() - input.days);

      // Real-time chat stats
      const allRtSessions = await db
        .select()
        .from(realtimeChatSessions)
        .where(gte(realtimeChatSessions.createdAt, since));

      const activeSessions = allRtSessions.filter((s) => s.status === "active").length;
      const closedSessions = allRtSessions.filter((s) => s.status === "closed").length;

      const rtMsgCount = await db
        .select({ cnt: count() })
        .from(realtimeChatMessages)
        .where(gte(realtimeChatMessages.createdAt, since));

      // AI chat stats
      const aiSessions = await db
        .select()
        .from(chatSessions)
        .where(gte(chatSessions.createdAt, since));

      const aiMsgCount = await db
        .select({ cnt: count() })
        .from(chatMessages)
        .where(gte(chatMessages.createdAt, since));

      const escalated = aiSessions.filter((s) => s.status === "escalated").length;

      // Leads
      const leads = await db
        .select({ cnt: count() })
        .from(chatLeads)
        .where(gte(chatLeads.createdAt, since));

      // Recent sessions for timeline
      const recentSessions = await db
        .select()
        .from(realtimeChatSessions)
        .orderBy(desc(realtimeChatSessions.createdAt))
        .limit(10);

      const totalMessages = (rtMsgCount[0]?.cnt || 0) + (aiMsgCount[0]?.cnt || 0);
      const totalSessions = allRtSessions.length + aiSessions.length;

      return {
        totalSessions,
        activeSessions,
        closedSessions,
        totalMessages,
        avgMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
        totalLeads: leads[0]?.cnt || 0,
        aiChatSessions: aiSessions.length,
        aiChatMessages: aiMsgCount[0]?.cnt || 0,
        escalatedChats: escalated,
        recentSessions: recentSessions.map((s) => ({
          id: s.id,
          userId: s.userId,
          status: s.status,
          createdAt: s.createdAt,
          closedAt: s.closedAt,
        })),
      };
    }),

  // Get all sessions (admin, for transcript list)
  getAllSessions: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "closed", "archived", "all"]).default("all"),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view all sessions");
      }

      const db = await getDb();
      if (!db) return [];

      if (input.status !== "all") {
        return await db
          .select()
          .from(realtimeChatSessions)
          .where(eq(realtimeChatSessions.status, input.status))
          .orderBy(desc(realtimeChatSessions.createdAt))
          .limit(input.limit);
      }

      return await db
        .select()
        .from(realtimeChatSessions)
        .orderBy(desc(realtimeChatSessions.createdAt))
        .limit(input.limit);
    }),

  // Get chat session by ticket ID
  getSessionByTicket: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const sessions = await db
        .select()
        .from(realtimeChatSessions)
        .where(eq(realtimeChatSessions.ticketId, input.ticketId));

      if (sessions.length === 0) return null;

      const session = sessions[0];
      // Verify user has access
      if (
        ctx.user.id !== session.userId &&
        ctx.user.id !== session.adminId &&
        ctx.user.role !== "admin"
      ) {
        throw new Error("Unauthorized");
      }

      return session;
    }),

  // Handoff from AI chatbot to live admin chat
  handoffFromBot: protectedProcedure
    .input(
      z.object({
        aiSessionId: z.string(), // The AI bot session ID (string UUID)
        summary: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get AI chat history for context
      const aiMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.aiSessionId));

      // Check if user already has an active realtime session
      const existingSessions = await db
        .select()
        .from(realtimeChatSessions)
        .where(
          and(
            eq(realtimeChatSessions.userId, ctx.user.id),
            eq(realtimeChatSessions.status, "active")
          )
        );

      let rtSessionId: number;

      if (existingSessions.length > 0) {
        rtSessionId = existingSessions[0].id;
      } else {
        // Create a new realtime chat session
        const result = await db
          .insert(realtimeChatSessions)
          .values({
            userId: ctx.user.id,
            status: "active",
          })
          .$returningId();
        rtSessionId = result[0].id;
      }

      // Ensure user session exists for online tracking
      const existingUserSession = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, ctx.user.id));

      if (existingUserSession.length === 0) {
        await db.insert(userSessions).values({
          userId: ctx.user.id,
          isOnline: true,
          lastActivityAt: new Date(),
        });
      } else {
        await db
          .update(userSessions)
          .set({ isOnline: true, lastActivityAt: new Date() })
          .where(eq(userSessions.userId, ctx.user.id));
      }

      // Insert a system message with AI conversation summary
      const summaryText = input.summary ||
        `[Handoff from AI Assistant] Previous conversation had ${aiMessages.length} messages. The user has been transferred to live support.`;

      await db.insert(realtimeChatMessages).values({
        sessionId: rtSessionId,
        senderId: ctx.user.id,
        senderRole: "user",
        message: summaryText,
        isRead: false,
      });

      // Update AI session status to escalated
      await db
        .update(chatSessions)
        .set({ status: "escalated" })
        .where(eq(chatSessions.sessionId, input.aiSessionId));

      return {
        success: true,
        realtimeSessionId: rtSessionId,
        message: "You've been connected to live support. An admin will respond shortly.",
      };
    }),

  // Upload file attachment for chat
  uploadAttachment: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify access to session
      const session = await db
        .select()
        .from(realtimeChatSessions)
        .where(eq(realtimeChatSessions.id, input.sessionId));

      if (session.length === 0) throw new Error("Session not found");
      const chatSession = session[0];
      if (
        ctx.user.id !== chatSession.userId &&
        ctx.user.id !== chatSession.adminId &&
        ctx.user.role !== "admin"
      ) {
        throw new Error("Unauthorized");
      }

      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileData, "base64");
      const fileKey = `chat-attachments/${input.sessionId}/${nanoid()}-${input.fileName}`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Save as a chat message with file metadata
      const messageContent = JSON.stringify({
        type: "file",
        fileName: input.fileName,
        fileUrl: url,
        mimeType: input.mimeType,
        fileSize: buffer.length,
      });

      await db.insert(realtimeChatMessages).values({
        sessionId: input.sessionId,
        senderId: ctx.user.id,
        senderRole: ctx.user.role === "admin" ? "admin" : "user",
        message: messageContent,
        isRead: false,
      });

      return {
        success: true,
        fileUrl: url,
        fileName: input.fileName,
      };
    }),
});
