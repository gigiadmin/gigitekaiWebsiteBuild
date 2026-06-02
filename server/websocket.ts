/**
 * WebSocket Server Integration for Real-Time Command Center Alerts
 * 
 * Emits:
 * - command.executed: When a command completes
 * - alert.triggered: When an alert is triggered
 * - alert.resolved: When an alert is resolved
 * - system.health: Periodic system health updates
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getDb } from "./db";
import { commandCenterAuditLogs } from "../drizzle/schema";
import { verifyAdminToken, getAdminSessionCookie } from "./admin-auth";
import { parse as parseCookieHeader } from "cookie";

let io: SocketIOServer | null = null;
const connectedClients = new Map<string, { socket: Socket; userId?: number; authenticated: boolean }>();

export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? ["https://gigitekai.com", "https://www.gigitekai.com", "https://ggai.llc"]
        : ["http://localhost:3000", "http://localhost:5173"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      // Extract JWT from handshake auth or cookies
      let token: string | undefined;
      
      // Try auth object first
      if (socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }
      
      // Fall back to cookies
      if (!token && socket.handshake.headers.cookie) {
        const cookies = parseCookieHeader(socket.handshake.headers.cookie);
        token = getAdminSessionCookie(cookies);
      }
      
      if (!token) {
        console.warn(`[WebSocket] Connection rejected - no authentication token: ${socket.id}`);
        return next(new Error("Authentication required"));
      }

      // Verify admin JWT token
      const verified = await verifyAdminToken(token);
      if (!verified) {
        console.warn(`[WebSocket] Connection rejected - invalid token: ${socket.id}`);
        return next(new Error("Invalid authentication token"));
      }

      // Attach user ID to socket for later reference
      (socket as any).userId = verified.adminId;
      (socket as any).userEmail = verified.email;
      console.log(`[WebSocket] Client authenticated: ${socket.id} (admin: ${verified.email})`);
      next();
    } catch (error) {
      console.error(`[WebSocket] Authentication error for ${socket.id}:`, error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId;
    const userEmail = (socket as any).userEmail;
    console.log(`[WebSocket] Authenticated client connected: ${socket.id} (admin: ${userEmail})`);
    connectedClients.set(socket.id, { socket, userId, authenticated: true });

    // Emit initial system health on connection
    emitSystemHealth();

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });

    socket.on("error", (error) => {
      console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit command execution event to all connected clients
 */
export async function emitCommandExecuted(data: {
  commandId: string;
  intent: string;
  status: "success" | "failed";
  executionTime: number;
  userId?: string;
}) {
  if (!io) return;
  
  console.log(`[WebSocket] Emitting command.executed:`, data);
  io.emit("command.executed", {
    timestamp: new Date().toISOString(),
    ...data,
  });

  // Log to audit trail
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(commandCenterAuditLogs).values({
      userId: data.userId ? parseInt(data.userId) : 0,
      action: "COMMAND_EXECUTED",
      resource: `command_${data.commandId}`,
      details: JSON.stringify(data),
      result: data.status === "success" ? "success" : "failed",
    });
  } catch (error) {
    console.error("[WebSocket] Failed to log command execution:", error);
  }
}

/**
 * Emit alert triggered event to all connected clients
 */
export async function emitAlertTriggered(data: {
  alertId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  source: string;
}) {
  if (!io) return;

  console.log(`[WebSocket] Emitting alert.triggered:`, data);
  io.emit("alert.triggered", {
    timestamp: new Date().toISOString(),
    ...data,
  });

  // Log to audit trail
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(commandCenterAuditLogs).values({
      userId: 0,
      action: "ALERT_TRIGGERED",
      resource: `alert_${data.alertId}`,
      details: JSON.stringify(data),
      result: "success",
    });
  } catch (error) {
    console.error("[WebSocket] Failed to log alert trigger:", error);
  }
}

/**
 * Emit alert resolved event to all connected clients
 */
export async function emitAlertResolved(data: {
  alertId: string;
  title: string;
  resolutionTime: number;
  resolvedBy?: string;
}) {
  if (!io) return;

  console.log(`[WebSocket] Emitting alert.resolved:`, data);
  io.emit("alert.resolved", {
    timestamp: new Date().toISOString(),
    ...data,
  });

  // Log to audit trail
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(commandCenterAuditLogs).values({
      userId: data.resolvedBy ? parseInt(data.resolvedBy) : 0,
      action: "ALERT_RESOLVED",
      resource: `alert_${data.alertId}`,
      details: JSON.stringify(data),
      result: "success",
    });
  } catch (error) {
    console.error("[WebSocket] Failed to log alert resolution:", error);
  }
}

/**
 * Emit system health update to all connected clients
 */
export async function emitSystemHealth() {
  if (!io) return;

  try {
    const healthData = {
      timestamp: new Date().toISOString(),
      status: "operational",
      uptime: process.uptime(),
      activeConnections: connectedClients.size,
      memoryUsage: process.memoryUsage(),
    };

    console.log(`[WebSocket] Emitting system.health:`, healthData);
    io.emit("system.health", healthData);
  } catch (error) {
    console.error("[WebSocket] Failed to emit system health:", error);
  }
}

/**
 * Broadcast system health every 30 seconds
 */
export function startHealthBroadcast() {
  setInterval(() => {
    emitSystemHealth().catch(console.error);
  }, 30000);
}

/**
 * Get count of connected WebSocket clients
 */
export function getConnectedClientCount(): number {
  return connectedClients.size;
}

/**
 * Get authenticated user count
 */
export function getAuthenticatedUserCount(): number {
  return Array.from(connectedClients.values()).filter(c => c.authenticated).length;
}

/**
 * Verify if a socket is authenticated
 */
export function isSocketAuthenticated(socketId: string): boolean {
  const client = connectedClients.get(socketId);
  return client?.authenticated ?? false;
}

/**
 * Get user ID for a socket
 */
export function getSocketUserId(socketId: string): number | undefined {
  const client = connectedClients.get(socketId);
  return client?.userId;
}

/**
 * Get all authenticated connections with their user IDs
 */
export function getAuthenticatedConnections(): Array<{ socketId: string; userId?: number }> {
  return Array.from(connectedClients.entries())
    .filter(([_, client]) => client.authenticated)
    .map(([socketId, client]) => ({ socketId, userId: client.userId }));
}
