/**
 * PeerChat-style WebRTC Signaling Server
 * Mirrors the PeerChat (divanov11/PeerChat) signaling approach but uses
 * Socket.io instead of Agora RTM, integrated into the existing Express server.
 *
 * Flow (identical to PeerChat):
 *  1. Peer A joins room → server broadcasts 'user-joined' to room
 *  2. Peer B receives 'user-joined' → creates offer → sends to Peer A via server
 *  3. Peer A receives offer → creates answer → sends back via server
 *  4. Both peers exchange ICE candidates via server
 *  5. WebRTC peer connection established (P2P from here)
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

interface RoomParticipant {
  socketId: string;
  userId: string;
  role: "technician" | "client";
  displayName: string;
  joinedAt: Date;
}

// In-memory room registry (per-process; fine for single-instance deployment)
const rooms = new Map<string, RoomParticipant[]>();

function getRoomParticipants(roomId: string): RoomParticipant[] {
  return rooms.get(roomId) ?? [];
}

function addParticipant(roomId: string, participant: RoomParticipant) {
  const existing = rooms.get(roomId) ?? [];
  rooms.set(roomId, [...existing, participant]);
}

function removeParticipant(roomId: string, socketId: string) {
  const existing = rooms.get(roomId) ?? [];
  const updated = existing.filter((p) => p.socketId !== socketId);
  if (updated.length === 0) {
    rooms.delete(roomId);
  } else {
    rooms.set(roomId, updated);
  }
}

function findRoomBySocket(socketId: string): string | null {
  const entries = Array.from(rooms.entries());
  for (const [roomId, participants] of entries) {
    if (participants.some((p: RoomParticipant) => p.socketId === socketId)) {
      return roomId;
    }
  }
  return null;
}

export function setupWebRTCSignaling(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    path: "/ws/webrtc",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[WebRTC] Socket connected: ${socket.id}`);

    // ── Room Join ────────────────────────────────────────────────────────
    // Client emits: join-room { roomId, userId, role, displayName }
    socket.on(
      "join-room",
      (data: {
        roomId: string;
        userId: string;
        role: "technician" | "client";
        displayName: string;
      }) => {
        const { roomId, userId, role, displayName } = data;

        // Enforce max 2 participants per room (1 technician + 1 client)
        const participants = getRoomParticipants(roomId);
        if (participants.length >= 2) {
          socket.emit("room-full", { roomId });
          return;
        }

        socket.join(roomId);

        const participant: RoomParticipant = {
          socketId: socket.id,
          userId,
          role,
          displayName,
          joinedAt: new Date(),
        };
        addParticipant(roomId, participant);

        console.log(`[WebRTC] ${displayName} (${role}) joined room ${roomId}`);

        // Tell the new joiner who is already in the room
        socket.emit("room-joined", {
          roomId,
          participants: getRoomParticipants(roomId).filter(
            (p) => p.socketId !== socket.id
          ),
        });

        // Tell everyone else in the room that a new user joined
        // (mirrors PeerChat's 'MemberJoined' event → triggers createOffer)
        socket.to(roomId).emit("user-joined", {
          socketId: socket.id,
          userId,
          role,
          displayName,
        });
      }
    );

    // ── WebRTC Offer (mirrors PeerChat createOffer → sendMessageToPeer) ──
    socket.on(
      "offer",
      (data: { targetSocketId: string; offer: RTCSessionDescriptionInit }) => {
        console.log(`[WebRTC] Offer from ${socket.id} → ${data.targetSocketId}`);
        socket.to(data.targetSocketId).emit("offer", {
          fromSocketId: socket.id,
          offer: data.offer,
        });
      }
    );

    // ── WebRTC Answer ────────────────────────────────────────────────────
    socket.on(
      "answer",
      (data: { targetSocketId: string; answer: RTCSessionDescriptionInit }) => {
        console.log(`[WebRTC] Answer from ${socket.id} → ${data.targetSocketId}`);
        socket.to(data.targetSocketId).emit("answer", {
          fromSocketId: socket.id,
          answer: data.answer,
        });
      }
    );

    // ── ICE Candidate (mirrors PeerChat onicecandidate handler) ──────────
    socket.on(
      "ice-candidate",
      (data: { targetSocketId: string; candidate: RTCIceCandidateInit }) => {
        socket.to(data.targetSocketId).emit("ice-candidate", {
          fromSocketId: socket.id,
          candidate: data.candidate,
        });
      }
    );

    // ── Screen Share Toggle ──────────────────────────────────────────────
    socket.on("screen-share-started", () => {
      const roomId = findRoomBySocket(socket.id);
      if (roomId) {
        socket.to(roomId).emit("peer-screen-share-started", { socketId: socket.id });
      }
    });

    socket.on("screen-share-stopped", () => {
      const roomId = findRoomBySocket(socket.id);
      if (roomId) {
        socket.to(roomId).emit("peer-screen-share-stopped", { socketId: socket.id });
      }
    });

    // ── Camera / Mic Toggle (mirrors PeerChat toggleCamera/toggleMic) ────
    socket.on("toggle-camera", (data: { enabled: boolean }) => {
      const roomId = findRoomBySocket(socket.id);
      if (roomId) {
        socket.to(roomId).emit("peer-camera-toggled", {
          socketId: socket.id,
          enabled: data.enabled,
        });
      }
    });

    socket.on("toggle-mic", (data: { enabled: boolean }) => {
      const roomId = findRoomBySocket(socket.id);
      if (roomId) {
        socket.to(roomId).emit("peer-mic-toggled", {
          socketId: socket.id,
          enabled: data.enabled,
        });
      }
    });

    // ── Chat Message ─────────────────────────────────────────────────────
    socket.on("chat-message", (data: { message: string; displayName: string }) => {
      const roomId = findRoomBySocket(socket.id);
      if (roomId) {
        socket.to(roomId).emit("chat-message", {
          fromSocketId: socket.id,
          displayName: data.displayName,
          message: data.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ── Leave Room (mirrors PeerChat leaveChannel) ───────────────────────
    socket.on("leave-room", () => {
      handleDisconnect(socket);
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      handleDisconnect(socket);
    });

    function handleDisconnect(s: Socket) {
      const roomId = findRoomBySocket(s.id);
      if (roomId) {
        removeParticipant(roomId, s.id);
        s.to(roomId).emit("user-left", { socketId: s.id });
        console.log(`[WebRTC] Socket ${s.id} left room ${roomId}`);
      }
      console.log(`[WebRTC] Socket disconnected: ${s.id}`);
    }
  });

  console.log("[WebRTC] Signaling server initialized at /ws/webrtc");
  return io;
}
