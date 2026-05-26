import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { realtimeChatSessions, realtimeChatMessages, userSessions, chatSessions, chatMessages, chatLeads, users } from "../../drizzle/schema";
import { eq, and, sql, gte, desc, count } from "drizzle-orm";
import { getOnlineUsers } from "../_core/websocket";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { createAdminNotification } from "./adminNotifications";

// ── Magic bytes validation for file upload security ──────────────────────────
function validateMagicBytes(bytes: Buffer, mimeType: string): boolean {
  // Check first few bytes against known file signatures
  const hex = bytes.toString("hex").toLowerCase();

  const signatures: Record<string, string[]> = {
    "image/jpeg": ["ffd8ff"],
    "image/png": ["89504e47"],
    "image/gif": ["47494638"],
    "image/webp": ["52494646"], // RIFF header
    "application/pdf": ["25504446"], // %PDF
    "application/zip": ["504b0304", "504b0506", "504b0708"],
    "application/x-zip-compressed": ["504b0304", "504b0506", "504b0708"],
    // Office Open XML (docx/xlsx/pptx) are ZIP-based
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["504b0304"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["504b0304"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["504b0304"],
    // Legacy Office formats
    "application/msword": ["d0cf11e0"],
    "application/vnd.ms-excel": ["d0cf11e0"],
    "application/vnd.ms-powerpoint": ["d0cf11e0"],
  };

  const expected = signatures[mimeType];
  if (!expected) {
    // For text types (txt, csv, svg) and unknown types, skip magic byte check
    return true;
  }

  return expected.some((sig) => hex.startsWith(sig));
}

export const chatRouter = router({
  // Get online users (for admin)
  getOnlineUsers: protectedProcedure.query(async () => {
    const onlineUserIds = await getOnlineUsers();
    const db = await getDb();
    if (!db) return [];

    const users = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.isOnline, 1));

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
      const newSessionId = (result[0] as any).id;

      // Notify admin portal when a user (not admin) starts a new chat
      if (ctx.user.role !== "admin") {
        createAdminNotification({
          type: "new_chat",
          title: "New Chat Session Started",
          body: `${ctx.user.name || `User #${targetUserId}`} started a live chat session`,
          href: `/admin/chat`,
          priority: "high",
          sessionId: newSessionId,
        }).catch((e: any) => console.warn("[Chat] Admin notification failed:", e));

        // Note: Push notifications are sent client-side via usePushNotifications hook
        // Admins must have subscribed to push notifications in their preferences
      }

      return {
        id: newSessionId,
        userId: targetUserId,
        adminId: ctx.user.role === "admin" ? ctx.user.id : undefined,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
          closedAt: new Date().toISOString(),
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
        .set({ isRead: 1 })
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
      const header = `Chat Transcript - Session #${chatSession.id}\nDate: ${chatSession.createdAt}\nStatus: ${chatSession.status}\n${"-".repeat(50)}\n`;
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

      // Wrap entire query in 10-second timeout to prevent hanging on DB connection issues
      try {
        const result = await Promise.race([
          (async () => {
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
              .where(gte(realtimeChatSessions.createdAt, since.toISOString()));

            const activeSessions = allRtSessions.filter((s) => s.status === "active").length;
            const closedSessions = allRtSessions.filter((s) => s.status === "closed").length;

            const rtMsgCount = await db
              .select({ cnt: count() })
              .from(realtimeChatMessages)
              .where(gte(realtimeChatMessages.createdAt, since.toISOString()));

            // AI chat stats
            const aiSessions = await db
              .select()
              .from(chatSessions)
              .where(gte(chatSessions.createdAt, since.toISOString()));

            const aiMsgCount = await db
              .select({ cnt: count() })
              .from(chatMessages)
              .where(gte(chatMessages.createdAt, since.toISOString()));

            const escalated = aiSessions.filter((s) => s.status === "escalated").length;

            // Leads
            const leads = await db
              .select({ cnt: count() })
              .from(chatLeads)
              .where(gte(chatLeads.createdAt, since.toISOString()));

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
          })(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Analytics query timeout after 10 seconds")), 10000);
          }),
        ]);
        return result;
      } catch (error: any) {
        console.error("[Analytics] Query failed:", error?.message);
        // Return empty analytics on timeout or error
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
        rtSessionId = (result[0] as any).id;
      }

      // Ensure user session exists for online tracking
      const existingUserSession = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, ctx.user.id));

      if (existingUserSession.length === 0) {
        await db.insert(userSessions).values({
          userId: ctx.user.id,
          isOnline: 1,
          lastActivityAt: new Date().toISOString(),
        });
      } else {
        await db
          .update(userSessions)
          .set({ isOnline: 1, lastActivityAt: new Date().toISOString() })
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
        isRead: 0,
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
        fileName: z.string().max(255),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // ── Security: Validate MIME type ──────────────────────────────────
      const ALLOWED_MIME_TYPES = new Set([
        // Images
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        // Text
        "text/plain", "text/csv",
        // Archives
        "application/zip", "application/x-zip-compressed",
      ]);

      if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
        throw new Error(`File type '${input.mimeType}' is not allowed. Supported: images, PDFs, Office documents, text, CSV, and ZIP files.`);
      }

      // ── Security: Validate file extension matches MIME type ───────────
      const MIME_TO_EXT: Record<string, string[]> = {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/gif": [".gif"],
        "image/webp": [".webp"],
        "image/svg+xml": [".svg"],
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/vnd.ms-powerpoint": [".ppt"],
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
        "text/plain": [".txt", ".log", ".md"],
        "text/csv": [".csv"],
        "application/zip": [".zip"],
        "application/x-zip-compressed": [".zip"],
      };

      const fileExt = "." + input.fileName.split(".").pop()?.toLowerCase();
      const allowedExts = MIME_TO_EXT[input.mimeType];
      if (allowedExts && !allowedExts.includes(fileExt)) {
        throw new Error(`File extension '${fileExt}' does not match the declared type '${input.mimeType}'.`);
      }

      // ── Security: Sanitize filename ───────────────────────────────────
      const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

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

      // Decode base64 and validate size
      const buffer = Buffer.from(input.fileData, "base64");
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (buffer.length > MAX_FILE_SIZE) {
        throw new Error(`File size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds the 10MB limit.`);
      }

      // ── Security: Verify magic bytes match declared MIME type ─────────
      const magicBytes = buffer.slice(0, 8);
      const isValidMagic = validateMagicBytes(magicBytes, input.mimeType);
      if (!isValidMagic) {
        throw new Error("File content does not match the declared file type. Upload rejected for security.");
      }

      const fileKey = `chat-attachments/${input.sessionId}/${nanoid()}-${sanitizedFileName}`;

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
        isRead: 0,
      });

      return {
        success: true,
        fileUrl: url,
        fileName: input.fileName,
      };
    }),
});
