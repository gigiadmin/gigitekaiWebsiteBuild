import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { getDb } from "../db";
import { realtimeChatMessages, realtimeChatSessions, userSessions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface WebSocketMessage {
  type: "join" | "message" | "typing" | "read" | "disconnect" | "file_notification";
  userId?: number;
  sessionId?: number;
  message?: string;
  senderRole?: "user" | "admin";
  adminId?: number;
  role?: "user" | "admin";
}

interface ClientConnection {
  ws: WebSocket;
  userId: number;
  role: "user" | "admin";
  sessionId?: number;
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
              .set({ isOnline: false })
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
      .set({ isOnline: true, lastActivityAt: new Date() })
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
    isRead: false,
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
    .set({ isRead: true })
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
