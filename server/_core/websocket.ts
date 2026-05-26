import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { getDb } from "../db";
import { realtimeChatMessages, realtimeChatSessions, userSessions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendChatMessageNotificationToTeams } from "../teamsBot";
import { ticketNotificationEmitter, TicketNotification } from "../ticketNotificationEmitter";

interface WebSocketMessage {
  type: "join" | "message" | "typing" | "read" | "disconnect" | "file_notification" | "call_offer" | "call_answer" | "ice_candidate" | "call_end" | "call_reject" | "call_request" | "subscribe_tickets" | "unsubscribe_tickets";
  userId?: number;
  sessionId?: number;
  message?: string;
  typingStatus?: boolean;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  callData?: string;
  callType?: "audio" | "video";
  callerName?: string;
  role?: "user" | "admin";
  targetUserId?: number;
  senderRole?: "user" | "admin";
  answer?: string;
  candidate?: string;
  offer?: string;
}

interface ClientConnection {
  ws: WebSocket;
  userId: number;
  role: "user" | "admin";
  sessionId?: number;
  agentId?: number;
}

const clients = new Map<string, ClientConnection>();
const userToSessionMap = new Map<number, number>(); // userId -> sessionId

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[WS] New connection");

    ws.on("message", async (data: string) => {
      try {
        const msg: WebSocketMessage = JSON.parse(data);
        await handleMessage(ws, msg, clients, userToSessionMap);
      } catch (error) {
        console.error("[WS] Error handling message:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", async () => {
      // Find and remove the client
      const entriesArray = Array.from(clients.entries());
      for (const [key, client] of entriesArray) {
        if (client.ws === ws) {
          const userId = client.userId;
          clients.delete(key);
          userToSessionMap.delete(userId);

          // Update user session status
          const db = await getDb();
          if (db) {
            await db
              .update(userSessions)
              .set({ isOnline: 0 })
              .where(eq(userSessions.userId, userId));
          }

          // Notify admins that user is offline
          broadcastToAdmins({
            type: "user_offline",
            userId,
          });

          console.log(`[WS] Client disconnected: ${key}`);
          break;
        }
      }
    });

    ws.on("error", (error: any) => {
      console.error("[WS] WebSocket error:", error);
    });
  });

  return wss;
}

function updateClientSessionId(
  ws: WebSocket,
  userId: number,
  sessionId: number,
  clients: Map<string, ClientConnection>
) {
  const entriesArray = Array.from(clients.entries());
  for (const [key, client] of entriesArray) {
    if (client.ws === ws && client.userId === userId) {
      client.sessionId = sessionId;
      clients.set(key, client);
      break;
    }
  }
}

async function handleMessage(
  ws: WebSocket,
  msg: WebSocketMessage,
  clients: Map<string, ClientConnection>,
  userToSessionMap: Map<number, number>
) {
  switch (msg.type) {
    case "join":
      if (!msg.userId) return;
      await handleJoin(ws, msg.userId, msg.role || "user", clients, userToSessionMap);
      break;

    case "message":
      if (!msg.userId || !msg.sessionId || !msg.message) return;
      // Update the sender's client sessionId so broadcastToSession works
      updateClientSessionId(ws, msg.userId, msg.sessionId, clients);
      await handleChatMessage(msg.userId, msg.sessionId, msg.message, msg.senderRole || "user", clients);
      break;

    case "typing":
      if (!msg.userId || !msg.sessionId) return;
      // Update sender's sessionId for typing broadcasts
      updateClientSessionId(ws, msg.userId, msg.sessionId, clients);
      broadcastToSession(msg.sessionId, {
        type: "typing",
        userId: msg.userId,
      });
      break;

    case "read":
      if (!msg.userId || !msg.sessionId) return;
      // Update sender's sessionId for read receipt broadcasts
      updateClientSessionId(ws, msg.userId, msg.sessionId, clients);
      await handleReadReceipt(msg.sessionId, msg.userId);
      break;

    case "call_request":
      if (!msg.userId || !msg.targetUserId) return;
      broadcastToUser(msg.targetUserId, {
        type: "call_request",
        callerId: msg.userId,
        callerName: msg.callerName || "Unknown",
        callType: msg.callType || "audio",
        sessionId: msg.sessionId,
      });
      break;

    case "call_offer":
      if (!msg.userId || !msg.targetUserId || !msg.offer) return;
      broadcastToUser(msg.targetUserId, {
        type: "call_offer",
        callerId: msg.userId,
        offer: msg.offer,
        callType: msg.callType || "audio",
        sessionId: msg.sessionId,
      });
      break;

    case "call_answer":
      if (!msg.userId || !msg.targetUserId || !msg.answer) return;
      broadcastToUser(msg.targetUserId, {
        type: "call_answer",
        answererId: msg.userId,
        answer: msg.answer,
        sessionId: msg.sessionId,
      });
      break;

    case "ice_candidate":
      if (!msg.userId || !msg.targetUserId || !msg.candidate) return;
      broadcastToUser(msg.targetUserId, {
        type: "ice_candidate",
        senderId: msg.userId,
        candidate: msg.candidate,
        sessionId: msg.sessionId,
      });
      break;

    case "call_end":
      if (!msg.userId || !msg.targetUserId) return;
      broadcastToUser(msg.targetUserId, {
        type: "call_end",
        senderId: msg.userId,
        sessionId: msg.sessionId,
      });
      break;

    case "call_reject":
      if (!msg.userId || !msg.targetUserId) return;
      broadcastToUser(msg.targetUserId, {
        type: "call_reject",
        senderId: msg.userId,
        sessionId: msg.sessionId,
      });
      break;

    case "file_notification":
      // Broadcast file message to other participants without saving to DB
      // (already persisted by the uploadAttachment mutation)
      if (!msg.userId || !msg.sessionId || !msg.message) return;
      updateClientSessionId(ws, msg.userId, msg.sessionId, clients);
      broadcastToSession(msg.sessionId, {
        type: "message",
        senderId: msg.userId,
        senderRole: msg.senderRole || "user",
        message: msg.message,
        sessionId: msg.sessionId,
        timestamp: new Date(),
      });
      // Also notify the other party directly
      if (msg.senderRole === "admin") {
        const db = await getDb();
        if (db) {
          const sessions = await db
            .select()
            .from(realtimeChatSessions)
            .where(eq(realtimeChatSessions.id, msg.sessionId));
          if (sessions.length > 0) {
            broadcastToUser(sessions[0].userId, {
              type: "message",
              senderId: msg.userId,
              senderRole: "admin",
              message: msg.message,
              sessionId: msg.sessionId,
              timestamp: new Date(),
            });
          }
        }
      }
      break;

    case "subscribe_tickets":
      if (!msg.userId) return;
      // Subscribe to ticket notifications
      const ticketNewListener = (notification: TicketNotification) => {
        ws.send(JSON.stringify({
          type: "ticket_notification",
          data: notification,
        }));
      };
      
      // Subscribe to new tickets (admins only)
      if (msg.role === "admin") {
        ticketNotificationEmitter.on("ticket:new", ticketNewListener);
      }
      
      // Subscribe to assigned tickets (for assigned agent)
      const ticketAssignedListener = (data: any) => {
        if (data.agentId === msg.userId) {
          ws.send(JSON.stringify({
            type: "ticket_assigned_notification",
            data: data.notification,
          }));
        }
      };
      ticketNotificationEmitter.on("ticket:assigned", ticketAssignedListener);
      
      ws.on("close", () => {
        ticketNotificationEmitter.off("ticket:new", ticketNewListener);
        ticketNotificationEmitter.off("ticket:assigned", ticketAssignedListener);
      });
      
      ws.send(JSON.stringify({
        type: "subscription_confirmed",
        subscribed_to: "ticket_notifications",
      }));
      break;

    case "unsubscribe_tickets":
      // Unsubscribe handled by close event
      ws.send(JSON.stringify({
        type: "unsubscription_confirmed",
        unsubscribed_from: "ticket_notifications",
      }));
      break;
  }
}

async function handleJoin(
  ws: WebSocket,
  userId: number,
  role: "user" | "admin",
  clients: Map<string, ClientConnection>,
  userToSessionMap: Map<number, number>
) {
  const clientId = `${role}-${userId}-${Date.now()}`;
  clients.set(clientId, {
    ws,
    userId,
    role,
    sessionId: undefined,
  });

  // Update user session status
  const db = await getDb();
  if (db) {
    await db
      .update(userSessions)
      .set({ isOnline: 1, lastActivityAt: new Date().toISOString() })
      .where(eq(userSessions.userId, userId))
      .catch((err: any) => console.error("[WS] Error updating user session:", err));
  }

  ws.send(
    JSON.stringify({
      type: "connected",
      clientId,
      userId,
      role,
    })
  );

  // Notify admins of new online user
  if (role === "user") {
    // Send notification to owner via Manus notification API
    try {
      const notifyOwnerUrl = process.env.BUILT_IN_FORGE_API_URL + "/notification/notify-owner";
      await fetch(notifyOwnerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
        },
        body: JSON.stringify({
          title: "User Online - Help Desk Support",
          content: `User #${userId} is now online and available for chat support.`,
        }),
      }).catch((err: any) => console.error("[WS] Error sending owner notification:", err));
    } catch (error) {
      console.error("[WS] Error notifying owner:", error);
    }
    
    broadcastToAdmins({
      type: "user_online",
      userId,
    });
  }

  console.log(`[WS] User ${userId} (${role}) joined`);
}

async function handleChatMessage(
  senderId: number,
  sessionId: number,
  message: string,
  senderRole: "user" | "admin",
  clients: Map<string, ClientConnection>
) {
  const db = await getDb();
  if (!db) {
    console.error("[WS] Database not available for saving message");
    return;
  }

  // Save message to database
  await db.insert(realtimeChatMessages).values({
    sessionId,
    senderId,
    senderRole,
    message,
    isRead: 0,
  });

  // Broadcast to session participants
  broadcastToSession(sessionId, {
    type: "message",
    senderId,
    senderRole,
    message,
    sessionId,
    timestamp: new Date(),
  });

  // If user sent message, notify Teams so admins are alerted
  if (senderRole === "user") {
    try {
      const sessions = await db
        .select()
        .from(realtimeChatSessions)
        .where(eq(realtimeChatSessions.id, sessionId));
      if (sessions.length > 0) {
        sendChatMessageNotificationToTeams(sessions[0], message, senderId).catch(
          (err) => console.warn("[Teams] Chat notification failed:", err)
        );
      }
    } catch (_) { /* non-blocking */ }
  }
  // If admin sent message, notify the user
  if (senderRole === "admin") {
    const sessions = await db
      .select()
      .from(realtimeChatSessions)
      .where(eq(realtimeChatSessions.id, sessionId));

    if (sessions.length > 0) {
      const session = sessions[0];
      broadcastToUser(session.userId, {
        type: "message",
        senderId,
        senderRole,
        message,
        sessionId,
        timestamp: new Date(),
      });
    }
  }
}

async function handleReadReceipt(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.error("[WS] Database not available for read receipt");
    return;
  }

  await db
    .update(realtimeChatMessages)
    .set({ isRead: 1 })
    .where(
      and(
        eq(realtimeChatMessages.sessionId, sessionId),
        eq(realtimeChatMessages.senderId, userId)
      )
    );

  broadcastToSession(sessionId, {
    type: "messages_read",
    userId,
    sessionId,
  });
}

function broadcastToSession(sessionId: number, data: any) {
  const clientsArray = Array.from(clients.values());
  for (const client of clientsArray) {
    if (client.sessionId === sessionId && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(data));
    }
  }
}

function broadcastToUser(userId: number, data: any) {
  const clientsArray = Array.from(clients.values());
  for (const client of clientsArray) {
    if (client.userId === userId && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(data));
    }
  }
}

function broadcastToAdmins(data: any) {
  const clientsArray = Array.from(clients.values());
  for (const client of clientsArray) {
    if (client.role === "admin" && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(data));
    }
  }
}

export async function getOnlineUsers() {
  const onlineUsers = new Set<number>();
  const clientsArray = Array.from(clients.values());
  for (const client of clientsArray) {
    if (client.role === "user") {
      onlineUsers.add(client.userId);
    }
  }
  return Array.from(onlineUsers);
}

/**
 * Broadcast a real-time admin notification to all connected admin clients.
 * Called by createAdminNotification() after persisting to the DB.
 */
export function broadcastAdminNotification(data: {
  id: number | null;
  type: string;
  title: string;
  body?: string;
  href?: string;
  priority: string;
  createdAt: string;
}) {
  const payload = JSON.stringify({ type: "admin_notification", notification: data });
  const clientsArray = Array.from(clients.values());
  for (const client of clientsArray) {
    if (client.role === "admin" && client.ws.readyState === 1) {
      client.ws.send(payload);
    }
  }
}
