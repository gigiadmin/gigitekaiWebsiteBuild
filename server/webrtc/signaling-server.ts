/**
 * WebRTC Signaling Server
 * Handles SDP offer/answer exchange and ICE candidate routing
 * Uses Socket.io for real-time bidirectional communication
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * Signaling Message Types
 */
export enum SignalingMessageType {
  JOIN = 'join',
  LEAVE = 'leave',
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice-candidate',
  SESSION_START = 'session-start',
  SESSION_END = 'session-end',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
}

/**
 * Session Participant
 */
interface SessionParticipant {
  userId: number;
  socketId: string;
  role: 'technician' | 'client' | 'observer';
  joinedAt: Date;
  connectionState: 'connecting' | 'connected' | 'disconnected';
}

/**
 * Remote Assistance Session
 */
interface RemoteAssistanceSession {
  sessionId: string;
  createdAt: Date;
  participants: Map<number, SessionParticipant>;
  recordingEnabled: boolean;
  encryptionKey: string;
}

/**
 * WebRTC Signaling Server Manager
 */
export class WebRTCSignalingServer extends EventEmitter {
  private io: SocketIOServer;
  private sessions: Map<string, RemoteAssistanceSession> = new Map();
  private userSessions: Map<number, string> = new Map(); // userId -> sessionId
  private socketUsers: Map<string, number> = new Map(); // socketId -> userId
  private messageQueue: Map<string, any[]> = new Map(); // sessionId -> messages
  private maxQueueSize = 100;

  constructor(httpServer: HTTPServer) {
    super();

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.VITE_FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    this.setupEventHandlers();
    this.setupMiddleware();
  }

  /**
   * Setup Socket.io middleware
   */
  private setupMiddleware() {
    this.io.use((socket: any, next: any) => {
      const sessionId = socket.handshake.auth.sessionId;
      const userId = socket.handshake.auth.userId;
      const token = socket.handshake.auth.token;

      // Validate session and user
      if (!sessionId || !userId || !token) {
        return next(new Error('Missing authentication parameters'));
      }

      // Store user info on socket
      socket.data.sessionId = sessionId;
      socket.data.userId = userId;
      socket.data.token = token;

      next();
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebRTC Signaling] User connected: ${socket.id}`);

      const userId = socket.data.userId;
      const sessionId = socket.data.sessionId;

      // Store socket-to-user mapping
      this.socketUsers.set(socket.id, userId);
      this.userSessions.set(userId, sessionId);

      // Join session room
      socket.join(sessionId);

      // Handle join event
      socket.on(SignalingMessageType.JOIN, (data: any) => {
        this.handleJoin(socket, data);
      });

      // Handle offer
      socket.on(SignalingMessageType.OFFER, (data: any) => {
        this.handleOffer(socket, data);
      });

      // Handle answer
      socket.on(SignalingMessageType.ANSWER, (data: any) => {
        this.handleAnswer(socket, data);
      });

      // Handle ICE candidate
      socket.on(SignalingMessageType.ICE_CANDIDATE, (data: any) => {
        this.handleIceCandidate(socket, data);
      });

      // Handle ping
      socket.on(SignalingMessageType.PING, (data: any) => {
        socket.emit(SignalingMessageType.PONG, { timestamp: Date.now() });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error: any) => {
        console.error(`[WebRTC Signaling] Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Handle user join
   */
  private handleJoin(socket: Socket, data: any) {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;
    const role = data.role || 'client';

    // Create or get session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        createdAt: new Date(),
        participants: new Map(),
        recordingEnabled: data.recordingEnabled || false,
        encryptionKey: crypto.randomBytes(32).toString('hex'),
      };
      this.sessions.set(sessionId, session);
    }

    // Add participant
    const participant: SessionParticipant = {
      userId,
      socketId: socket.id,
      role,
      joinedAt: new Date(),
      connectionState: 'connecting',
    };

    session.participants.set(userId, participant);

    // Notify others in session
    socket.to(sessionId).emit(SignalingMessageType.SESSION_START, {
      userId,
      role,
      participants: Array.from(session.participants.values()).map((p) => ({
        userId: p.userId,
        role: p.role,
        connectionState: p.connectionState,
      })),
    });

    // Send session info to joining user
    socket.emit(SignalingMessageType.SESSION_START, {
      sessionId,
      encryptionKey: session.encryptionKey,
      participants: Array.from(session.participants.values()).map((p) => ({
        userId: p.userId,
        role: p.role,
        connectionState: p.connectionState,
      })),
    });

    console.log(`[WebRTC Signaling] User ${userId} joined session ${sessionId} as ${role}`);
  }

  /**
   * Handle SDP offer
   */
  private handleOffer(socket: Socket, data: any) {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;
    const targetUserId = data.targetUserId;

    if (!targetUserId) {
      socket.emit(SignalingMessageType.ERROR, {
        message: 'Target user ID required',
      });
      return;
    }

    // Queue message if target not connected
    const targetSocket = this.findSocketByUserId(sessionId, targetUserId);
    if (!targetSocket) {
      this.queueMessage(sessionId, {
        type: SignalingMessageType.OFFER,
        from: userId,
        to: targetUserId,
        offer: data.offer,
      });
      return;
    }

    // Send offer to target
    targetSocket.emit(SignalingMessageType.OFFER, {
      from: userId,
      offer: data.offer,
    });

    console.log(`[WebRTC Signaling] Offer sent from ${userId} to ${targetUserId}`);
  }

  /**
   * Handle SDP answer
   */
  private handleAnswer(socket: Socket, data: any) {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;
    const targetUserId = data.targetUserId;

    if (!targetUserId) {
      socket.emit(SignalingMessageType.ERROR, {
        message: 'Target user ID required',
      });
      return;
    }

    const targetSocket = this.findSocketByUserId(sessionId, targetUserId);
    if (!targetSocket) {
      this.queueMessage(sessionId, {
        type: SignalingMessageType.ANSWER,
        from: userId,
        to: targetUserId,
        answer: data.answer,
      });
      return;
    }

    // Send answer to target
    targetSocket.emit(SignalingMessageType.ANSWER, {
      from: userId,
      answer: data.answer,
    });

    console.log(`[WebRTC Signaling] Answer sent from ${userId} to ${targetUserId}`);
  }

  /**
   * Handle ICE candidate
   */
  private handleIceCandidate(socket: Socket, data: any) {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;
    const targetUserId = data.targetUserId;

    if (!targetUserId || !data.candidate) {
      return;
    }

    const targetSocket = this.findSocketByUserId(sessionId, targetUserId);
    if (!targetSocket) {
      return;
    }

    // Send ICE candidate to target
    targetSocket.emit(SignalingMessageType.ICE_CANDIDATE, {
      from: userId,
      candidate: data.candidate,
    });
  }

  /**
   * Handle user disconnect
   */
  private handleDisconnect(socket: Socket) {
    const userId = this.socketUsers.get(socket.id);
    const sessionId = socket.data.sessionId;

    if (!userId || !sessionId) {
      return;
    }

    // Remove participant from session
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants.delete(userId);

      // Notify others
      this.io.to(sessionId).emit(SignalingMessageType.SESSION_END, {
        userId,
        participants: Array.from(session.participants.values()).map((p) => ({
          userId: p.userId,
          role: p.role,
        })),
      });

      // Clean up empty sessions
      if (session.participants.size === 0) {
        this.sessions.delete(sessionId);
        this.messageQueue.delete(sessionId);
      }
    }

    // Clean up mappings
    this.socketUsers.delete(socket.id);
    this.userSessions.delete(userId);

    console.log(`[WebRTC Signaling] User ${userId} disconnected from session ${sessionId}`);
  }

  /**
   * Find socket by user ID in session
   */
  private findSocketByUserId(sessionId: string, userId: number): Socket | undefined {
    const sockets = this.io.sockets.sockets;
    const socketsArray = Array.from(sockets.entries());
    for (const [, socket] of socketsArray) {
      if (socket.data.sessionId === sessionId && socket.data.userId === userId) {
        return socket;
      }
    }
    return undefined;
  }

  /**
   * Queue message for offline user
   */
  private queueMessage(sessionId: string, message: any) {
    if (!this.messageQueue.has(sessionId)) {
      this.messageQueue.set(sessionId, []);
    }

    const queue = this.messageQueue.get(sessionId)!;
    if (queue.length < this.maxQueueSize) {
      queue.push(message);
    }
  }

  /**
   * Get queued messages for user
   */
  private getQueuedMessages(sessionId: string, userId: number): any[] {
    const queue = this.messageQueue.get(sessionId) || [];
    return queue.filter((msg) => msg.to === userId);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId,
      createdAt: session.createdAt,
      participantCount: session.participants.size,
      participants: Array.from(session.participants.values()).map((p) => ({
        userId: p.userId,
        role: p.role,
        connectionState: p.connectionState,
        joinedAt: p.joinedAt,
      })),
      recordingEnabled: session.recordingEnabled,
      queuedMessages: this.messageQueue.get(sessionId)?.length || 0,
    };
  }

  /**
   * Get all active sessions
   */
  getAllSessions() {
    return Array.from(this.sessions.values()).map((session) => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      participantCount: session.participants.size,
      recordingEnabled: session.recordingEnabled,
    }));
  }

  /**
   * Broadcast message to session
   */
  broadcastToSession(sessionId: string, event: string, data: any) {
    this.io.to(sessionId).emit(event, data);
  }

  /**
   * Send message to specific user in session
   */
  sendToUser(sessionId: string, userId: number, event: string, data: any) {
    const socket = this.findSocketByUserId(sessionId, userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * Close session
   */
  closeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Notify all participants
      this.io.to(sessionId).emit(SignalingMessageType.SESSION_END, {
        reason: 'Session closed by administrator',
      });

      // Disconnect all sockets in session
      const sockets = this.io.sockets.sockets;
      const socketsArray = Array.from(sockets.entries());
      for (const [, socket] of socketsArray) {
        if (socket.data.sessionId === sessionId) {
          socket.disconnect(true);
        }
      }

      // Clean up
      this.sessions.delete(sessionId);
      this.messageQueue.delete(sessionId);
    }
  }

  /**
   * Get server statistics
   */
  getServerStats() {
    return {
      activeSessions: this.sessions.size,
      connectedUsers: this.socketUsers.size,
      totalParticipants: Array.from(this.sessions.values()).reduce(
        (sum, session) => sum + session.participants.size,
        0
      ),
      uptime: process.uptime(),
    };
  }
}

/**
 * Initialize signaling server
 */
export function initializeSignalingServer(httpServer: HTTPServer): WebRTCSignalingServer {
  return new WebRTCSignalingServer(httpServer);
}

export default WebRTCSignalingServer;
