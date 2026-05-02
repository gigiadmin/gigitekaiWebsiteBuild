/**
 * GigitekAI Remote Session Page
 * PeerChat-style WebRTC implementation using Socket.io signaling
 *
 * Architecture mirrors divanov11/PeerChat:
 *  - Room-based (URL: /remote-session/:roomId)
 *  - Socket.io for signaling (replaces Agora RTM)
 *  - Native RTCPeerConnection with Google STUN servers
 *  - Offer/Answer/ICE candidate exchange
 *  - Camera, mic, and screen share toggles
 *  - Two-video layout (local small + remote large)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  MessageSquare,
  Send,
  Users,
  Shield,
  Wifi,
  WifiOff,
} from "lucide-react";

// ── WebRTC Config (mirrors PeerChat servers const) ───────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
    { urls: "stun:stun.gigitekai.com:3478" }, // Custom STUN (fallback)
  ],
};

// ── Video Constraints (mirrors PeerChat constraints) ─────────────────────────
const VIDEO_CONSTRAINTS = {
  video: {
    width: { min: 640, ideal: 1920, max: 1920 },
    height: { min: 480, ideal: 1080, max: 1080 },
  },
  audio: true,
};

interface ChatMessage {
  fromSocketId: string;
  displayName: string;
  message: string;
  timestamp: string;
  isSelf?: boolean;
}

interface Participant {
  socketId: string;
  userId: string;
  role: "technician" | "client";
  displayName: string;
}

export default function RemoteSession() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();

  // ── Refs (mirrors PeerChat let localStream, remoteStream, peerConnection) ──
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const remotePeerSocketId = useRef<string | null>(null);

  // ── State ────────────────────────────────────────────────────────────────
  const [connected, setConnected] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<"good" | "fair" | "poor">("good");
  const [displayName] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("name") || "GigitekAI User";
  });
  const [role] = useState<"technician" | "client">(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("role") as "technician" | "client") || "client";
  });

  // ── Session Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setSessionDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Create Peer Connection (mirrors PeerChat createPeerConnection) ────────
  const createPeerConnection = useCallback(
    async (targetSocketId: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;
      remotePeerSocketId.current = targetSocketId;

      // Remote stream setup (mirrors PeerChat remoteStream = new MediaStream())
      const remoteStream = new MediaStream();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.style.display = "block";
      }

      // Add local tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Receive remote tracks (mirrors PeerChat peerConnection.ontrack)
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        setPeerConnected(true);
      };

      // ICE candidate exchange (mirrors PeerChat peerConnection.onicecandidate)
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setPeerConnected(true);
          setConnectionQuality("good");
        } else if (state === "disconnected" || state === "failed") {
          setPeerConnected(false);
        }
      };

      return pc;
    },
    []
  );

  // ── Create Offer (mirrors PeerChat createOffer) ──────────────────────────
  const createOffer = useCallback(
    async (targetSocketId: string) => {
      const pc = await createPeerConnection(targetSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("offer", { targetSocketId, offer });
    },
    [createPeerConnection]
  );

  // ── Create Answer (mirrors PeerChat createAnswer) ────────────────────────
  const createAnswer = useCallback(
    async (targetSocketId: string, offer: RTCSessionDescriptionInit) => {
      const pc = await createPeerConnection(targetSocketId);
      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("answer", { targetSocketId, answer });
    },
    [createPeerConnection]
  );

  // ── Add Answer (mirrors PeerChat addAnswer) ──────────────────────────────
  const addAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (pc && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(answer);
    }
  }, []);

  // ── Initialize (mirrors PeerChat init()) ─────────────────────────────────
  useEffect(() => {
    if (!roomId) {
      navigate("/helpdesk");
      return;
    }

    let socket: Socket;

    const initialize = async () => {
      // Get local media (mirrors PeerChat getUserMedia)
      try {
        const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("[WebRTC] Camera/mic not available, proceeding without media:", err);
      }

      // Connect to signaling server (replaces Agora RTM client)
      socket = io(window.location.origin, {
        path: "/ws/webrtc",
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        console.log("[WebRTC] Connected to signaling server:", socket.id);

        // Join room (mirrors PeerChat channel.join())
        socket.emit("join-room", {
          roomId,
          userId: socket.id,
          role,
          displayName,
        });
      });

      socket.on("disconnect", () => {
        setConnected(false);
        setPeerConnected(false);
      });

      // Room joined — existing participants
      socket.on("room-joined", (data: { participants: Participant[] }) => {
        setParticipants(data.participants);
      });

      // New user joined (mirrors PeerChat MemberJoined → handleUserJoined → createOffer)
      socket.on("user-joined", (data: Participant) => {
        console.log("[WebRTC] User joined:", data.displayName);
        setParticipants((prev) => [...prev, data]);
        createOffer(data.socketId);
      });

      // User left (mirrors PeerChat MemberLeft → handleUserLeft)
      socket.on("user-left", (data: { socketId: string }) => {
        setParticipants((prev) => prev.filter((p) => p.socketId !== data.socketId));
        if (remoteVideoRef.current) {
          remoteVideoRef.current.style.display = "none";
        }
        setPeerConnected(false);
        remotePeerSocketId.current = null;
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
      });

      // Receive offer (mirrors PeerChat handleMessageFromPeer type==='offer')
      socket.on(
        "offer",
        (data: { fromSocketId: string; offer: RTCSessionDescriptionInit }) => {
          createAnswer(data.fromSocketId, data.offer);
        }
      );

      // Receive answer (mirrors PeerChat handleMessageFromPeer type==='answer')
      socket.on(
        "answer",
        (data: { fromSocketId: string; answer: RTCSessionDescriptionInit }) => {
          addAnswer(data.answer);
        }
      );

      // Receive ICE candidate (mirrors PeerChat handleMessageFromPeer type==='candidate')
      socket.on(
        "ice-candidate",
        (data: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
          peerConnectionRef.current?.addIceCandidate(data.candidate);
        }
      );

      // Screen share events
      socket.on("peer-screen-share-started", () => {
        console.log("[WebRTC] Peer started screen sharing");
      });

      socket.on("peer-screen-share-stopped", () => {
        console.log("[WebRTC] Peer stopped screen sharing");
      });

      // Chat messages
      socket.on("chat-message", (msg: ChatMessage) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      // Room full
      socket.on("room-full", () => {
        alert("This session is already full (max 2 participants).");
        navigate("/helpdesk");
      });
    };

    initialize();

    // Cleanup (mirrors PeerChat window.beforeunload → leaveChannel)
    return () => {
      socket?.emit("leave-room");
      socket?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
    };
  }, [roomId, role, displayName, createOffer, createAnswer, addAnswer, navigate]);

  // ── Toggle Camera (mirrors PeerChat toggleCamera) ────────────────────────
  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current
      ?.getTracks()
      .find((t) => t.kind === "video");
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraEnabled(videoTrack.enabled);
      socketRef.current?.emit("toggle-camera", { enabled: videoTrack.enabled });
    }
  }, []);

  // ── Toggle Mic (mirrors PeerChat toggleMic) ──────────────────────────────
  const toggleMic = useCallback(() => {
    const audioTrack = localStreamRef.current
      ?.getTracks()
      .find((t) => t.kind === "audio");
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
      socketRef.current?.emit("toggle-mic", { enabled: audioTrack.enabled });
    }
  }, []);

  // ── Screen Share ─────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = screenStream;

        // Replace video track in peer connection
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);

        // Show screen in local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setScreenSharing(true);
        socketRef.current?.emit("screen-share-started");
      } catch (err) {
        console.error("[WebRTC] Screen share failed:", err);
      }
    } else {
      stopScreenShare();
    }
  }, [screenSharing]);

  const stopScreenShare = useCallback(async () => {
    const pc = peerConnectionRef.current;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    // Restore camera track
    if (localStreamRef.current && pc) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    setScreenSharing(false);
    socketRef.current?.emit("screen-share-stopped");
  }, []);

  // ── Leave Session (mirrors PeerChat leaveChannel) ────────────────────────
  const leaveSession = useCallback(() => {
    socketRef.current?.emit("leave-room");
    socketRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    navigate("/helpdesk");
  }, [navigate]);

  // ── Send Chat Message ────────────────────────────────────────────────────
  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit("chat-message", {
      message: chatInput,
      displayName,
    });
    setChatMessages((prev) => [
      ...prev,
      {
        fromSocketId: "self",
        displayName,
        message: chatInput,
        timestamp: new Date().toISOString(),
        isSelf: true,
      },
    ]);
    setChatInput("");
  }, [chatInput, displayName]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex flex-col">
      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0D1220] border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-cyan-400">GigitekAI Remote Session</span>
          <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
            Room: {roomId}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection quality */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {connected ? (
              <Wifi className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={connected ? "text-green-400" : "text-red-400"}>
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length + 1} in room</span>
          </div>

          {/* Timer */}
          <div className="text-xs font-mono text-cyan-300">
            {formatDuration(sessionDuration)}
          </div>

          {/* Role badge */}
          <Badge
            variant="outline"
            className={
              role === "technician"
                ? "border-cyan-500/40 text-cyan-300 text-xs"
                : "border-purple-500/40 text-purple-300 text-xs"
            }
          >
            {role === "technician" ? "🔧 Technician" : "👤 Client"}
          </Badge>
        </div>
      </div>

      {/* ── Main Video Area ── */}
      <div className="flex-1 relative bg-[#060910] overflow-hidden">
        {/* Remote video (large, full screen — mirrors PeerChat user-2) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ display: peerConnected ? "block" : "none" }}
        />

        {/* Waiting state when no peer connected */}
        {!peerConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-cyan-500/40 flex items-center justify-center">
              <Users className="w-8 h-8 text-cyan-400 opacity-60" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-white/80">
                Waiting for the other participant...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Share the room link: <span className="text-cyan-400 font-mono">{window.location.href}</span>
              </p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Local video (small frame, bottom-right — mirrors PeerChat user-1.smallFrame) */}
        <div
          className={`absolute transition-all duration-300 ${
            peerConnected
              ? "bottom-20 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
              : "inset-0 flex items-center justify-center"
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={
              peerConnected
                ? "w-full h-full object-cover"
                : "w-64 h-48 object-cover rounded-xl border border-cyan-500/30"
            }
          />
          {!cameraEnabled && (
            <div className="absolute inset-0 bg-[#0A0E1A] flex items-center justify-center rounded-xl">
              <VideoOff className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {peerConnected && (
            <div className="absolute bottom-1 left-1 text-xs bg-black/60 rounded px-1.5 py-0.5">
              You
            </div>
          )}
        </div>

        {/* Screen share indicator */}
        {screenSharing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5" />
            Screen Sharing Active
          </div>
        )}
      </div>

      {/* ── Control Bar (mirrors PeerChat camera-btn, mic-btn) ── */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-[#0D1220] border-t border-cyan-500/20">
        {/* Camera toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full border-2 transition-all ${
            cameraEnabled
              ? "border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
              : "border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400"
          }`}
          title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        {/* Mic toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full border-2 transition-all ${
            micEnabled
              ? "border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
              : "border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400"
          }`}
          title={micEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        {/* Screen share */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-full border-2 transition-all ${
            screenSharing
              ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
              : "border-slate-500/50 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400"
          }`}
          title={screenSharing ? "Stop screen share" : "Share screen"}
        >
          {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </Button>

        {/* Chat toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setChatOpen((o) => !o)}
          className={`w-12 h-12 rounded-full border-2 transition-all relative ${
            chatOpen
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
              : "border-slate-500/50 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400"
          }`}
          title="Toggle chat"
        >
          <MessageSquare className="w-5 h-5" />
          {chatMessages.filter((m) => !m.isSelf).length > 0 && !chatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 text-black text-xs rounded-full flex items-center justify-center font-bold">
              {chatMessages.filter((m) => !m.isSelf).length}
            </span>
          )}
        </Button>

        {/* End call */}
        <Button
          variant="outline"
          size="icon"
          onClick={leaveSession}
          className="w-14 h-14 rounded-full border-2 border-red-500/60 bg-red-500/10 hover:bg-red-500/30 text-red-400 ml-4"
          title="End session"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      {/* ── Chat Panel ── */}
      {chatOpen && (
        <div className="absolute bottom-20 right-4 w-80 h-96 bg-[#0D1220] border border-cyan-500/20 rounded-xl flex flex-col shadow-2xl shadow-cyan-500/10">
          <div className="px-4 py-2 border-b border-cyan-500/20 flex items-center justify-between">
            <span className="text-sm font-medium text-cyan-300">Session Chat</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatOpen(false)}
              className="h-6 w-6 p-0 text-muted-foreground"
            >
              ×
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-8">
                No messages yet. Start the conversation!
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
              >
                <span className="text-xs text-muted-foreground mb-0.5">{msg.displayName}</span>
                <div
                  className={`max-w-[85%] px-3 py-1.5 rounded-lg text-sm ${
                    msg.isSelf
                      ? "bg-cyan-500/20 text-cyan-100"
                      : "bg-slate-700/50 text-slate-100"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-cyan-500/20 flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
              placeholder="Type a message..."
              className="h-8 text-sm bg-slate-800/50 border-slate-600/50"
            />
            <Button
              size="sm"
              onClick={sendChatMessage}
              className="h-8 px-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
