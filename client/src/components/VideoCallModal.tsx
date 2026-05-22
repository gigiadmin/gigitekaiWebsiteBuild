import { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Free STUN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface VideoCallModalProps {
  isOpen: boolean;
  callType: "audio" | "video";
  callerName: string;
  isIncoming: boolean;
  ws: WebSocket | null;
  myUserId: number;
  targetUserId: number;
  sessionId: number;
  onClose: () => void;
}

type CallState =
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "rejected";

export default function VideoCallModal({
  isOpen,
  callType,
  callerName,
  isIncoming,
  ws,
  myUserId,
  targetUserId,
  sessionId,
  onClose,
}: VideoCallModalProps) {
  const [callState, setCallState] = useState<CallState>("ringing");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setCallDuration(0);
  }, []);

  // Initialize media and peer connection
  const initializeCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && ws && ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: "ice_candidate",
              userId: myUserId,
              targetUserId,
              candidate: event.candidate,
              sessionId,
            })
          );
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCallState("connected");
          // Start duration timer
          durationIntervalRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setCallState("ended");
          cleanup();
        }
      };

      // Handle ICE connection state for better feedback
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          // ICE failed — likely restrictive NAT without TURN server
          console.warn("[Call] ICE connection failed. TURN server may be needed for this network.");
          setCallState("ended");
          cleanup();
        } else if (pc.iceConnectionState === "disconnected") {
          // Temporary disconnection — wait 5s before ending
          setTimeout(() => {
            if (pc.iceConnectionState === "disconnected") {
              setCallState("ended");
              cleanup();
            }
          }, 5000);
        }
      };

      // Timeout: if not connected within 30s, end the call
      setTimeout(() => {
        if (pc.connectionState !== "connected" && pc.connectionState !== "closed") {
          console.warn("[Call] Connection timeout after 30s");
          setCallState("ended");
          cleanup();
        }
      }, 30000);

      return pc;
    } catch (error) {
      console.error("[Call] Error initializing:", error);
      setCallState("ended");
      return null;
    }
  }, [callType, ws, myUserId, targetUserId, sessionId, cleanup]);

  // Start outgoing call
  const startCall = useCallback(async () => {
    setCallState("connecting");
    const pc = await initializeCall();
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (ws && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "call_offer",
          userId: myUserId,
          targetUserId,
          offer,
          callType,
          sessionId,
        })
      );
    }
  }, [initializeCall, ws, myUserId, targetUserId, callType, sessionId]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    setCallState("connecting");
    const pc = await initializeCall();
    if (!pc) return;

    // The offer will come via WebSocket message handler
  }, [initializeCall]);

  // Reject/end call
  const endCall = useCallback(() => {
    if (ws && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: callState === "ringing" && isIncoming ? "call_reject" : "call_end",
          userId: myUserId,
          targetUserId,
          sessionId,
        })
      );
    }
    setCallState("ended");
    cleanup();
    setTimeout(onClose, 1000);
  }, [ws, callState, isIncoming, myUserId, targetUserId, sessionId, cleanup, onClose]);

  // Handle incoming WebSocket messages for call signaling
  useEffect(() => {
    if (!ws) return;

    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "call_offer": {
            const pc = peerConnectionRef.current;
            if (!pc) {
              // Initialize if not yet done (incoming call accepted)
              const newPc = await initializeCall();
              if (!newPc) return;
              await newPc.setRemoteDescription(
                new RTCSessionDescription(data.offer)
              );
              const answer = await newPc.createAnswer();
              await newPc.setLocalDescription(answer);
              ws.send(
                JSON.stringify({
                  type: "call_answer",
                  userId: myUserId,
                  targetUserId: data.callerId,
                  answer,
                  sessionId,
                })
              );
            } else {
              await pc.setRemoteDescription(
                new RTCSessionDescription(data.offer)
              );
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(
                JSON.stringify({
                  type: "call_answer",
                  userId: myUserId,
                  targetUserId: data.callerId,
                  answer,
                  sessionId,
                })
              );
            }
            break;
          }

          case "call_answer": {
            const pc = peerConnectionRef.current;
            if (pc) {
              await pc.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
            }
            break;
          }

          case "ice_candidate": {
            const pc = peerConnectionRef.current;
            if (pc && data.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
            break;
          }

          case "call_end":
          case "call_reject": {
            setCallState(data.type === "call_reject" ? "rejected" : "ended");
            cleanup();
            setTimeout(onClose, 2000);
            break;
          }
        }
      } catch (error) {
        console.error("[Call] Error handling WS message:", error);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, myUserId, targetUserId, sessionId, initializeCall, cleanup, onClose]);

  // Auto-start outgoing call
  useEffect(() => {
    if (!isIncoming && isOpen && callState === "ringing") {
      startCall();
    }
  }, [isIncoming, isOpen, callState, startCall]);

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={`relative bg-[#0A0E1A] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,212,255,0.2)] border border-[rgba(0,212,255,0.2)] transition-[opacity,transform] duration-300 ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-[90vw] max-w-lg h-[70vh] max-h-[600px]"
        }`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div>
            <p className="text-white font-semibold text-sm">{callerName}</p>
            <p className="text-[#00D4FF] text-xs">
              {callState === "ringing" && isIncoming && "Incoming call..."}
              {callState === "ringing" && !isIncoming && "Calling..."}
              {callState === "connecting" && "Connecting..."}
              {callState === "connected" && formatDuration(callDuration)}
              {callState === "ended" && "Call ended"}
              {callState === "rejected" && "Call declined"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Video area */}
        <div className="w-full h-full bg-[#050810] flex items-center justify-center">
          {/* Remote video (full size) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${
              callState !== "connected" ? "hidden" : ""
            }`}
          />

          {/* Calling/connecting state */}
          {callState !== "connected" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-[#0099CC]/20 border-2 border-[#00D4FF]/40 flex items-center justify-center">
                <span className="text-3xl font-bold text-[#00D4FF]">
                  {callerName.charAt(0).toUpperCase()}
                </span>
              </div>
              {callState === "ringing" && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-bounce" />
                  <div
                    className="w-2 h-2 rounded-full bg-[#00D4FF] animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-[#00D4FF] animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          {callType === "video" && (
            <div className="absolute bottom-24 right-4 w-32 h-24 rounded-lg overflow-hidden border border-[rgba(0,212,255,0.3)] shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 bg-[#0A0E1A] flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {/* Incoming call: Accept/Reject */}
          {callState === "ringing" && isIncoming && (
            <>
              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg animate-pulse"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Active call controls */}
          {(callState === "connecting" || callState === "connected") && (
            <>
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? "bg-red-500/80 hover:bg-red-500"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </button>

              {callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isVideoOff
                      ? "bg-red-500/80 hover:bg-red-500"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-5 h-5 text-white" />
                  ) : (
                    <Video className="w-5 h-5 text-white" />
                  )}
                </button>
              )}

              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Outgoing ringing */}
          {callState === "ringing" && !isIncoming && (
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
