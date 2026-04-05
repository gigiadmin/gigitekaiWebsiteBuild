import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, X, MessageCircle, AlertCircle, Paperclip, FileIcon, Image as ImageIcon, Phone, Video } from "lucide-react";
import VideoCallModal from "@/components/VideoCallModal";
import { trpc } from "@/lib/trpc";
import { HANDOFF_EVENT } from "@/App";

interface ChatMessage {
  id?: number;
  senderId: number;
  senderRole: "user" | "admin";
  message: string;
  timestamp?: Date;
  isRead?: boolean;
}

interface FileAttachment {
  type: "file";
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

function tryParseFileMessage(message: string): FileAttachment | null {
  try {
    const parsed = JSON.parse(message);
    if (parsed.type === "file" && parsed.fileUrl) {
      return parsed as FileAttachment;
    }
  } catch {
    // Not a file message
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Outer wrapper that handles the auth check BEFORE any hooks are called.
 */
export default function UserChatWidget() {
  const { user, isAuthenticated } = useAuth();

  // Only show for authenticated non-admin users
  if (!isAuthenticated || user?.role === "admin") {
    return null;
  }

  return <UserChatWidgetInner user={user} />;
}

/**
 * Inner component that safely uses all hooks unconditionally.
 */
function UserChatWidgetInner({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [typingAdminId, setTypingAdminId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [incomingCall, setIncomingCall] = useState<{ callerId: number; callerName: string; callType: "audio" | "video" } | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC queries
  const { data: userSessions } = trpc.chat.getUserSessions.useQuery(undefined, {
    enabled: true,
  });

  const { data: messagesData, isLoading: isLoadingMessages } = trpc.chat.getMessages.useQuery(
    { sessionId: sessionId || 0 },
    { enabled: !!sessionId }
  );

  const uploadAttachment = trpc.chat.uploadAttachment.useMutation();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(
        JSON.stringify({
          type: "join",
          userId: user.id,
          role: "user",
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWebSocketMessage(msg);
      } catch (error) {
        console.error("[UserChat] Error parsing message:", error);
      }
    };

    ws.onerror = () => {
      toast.error("Connection error");
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user?.id]);

  const handleWebSocketMessage = (msg: any) => {
    switch (msg.type) {
      case "message":
        // Only show messages from the other party (admin), skip own messages
        if (msg.senderId !== user?.id) {
          setChatMessages((prev) => [
            ...prev,
            {
              senderId: msg.senderId,
              senderRole: msg.senderRole,
              message: msg.message,
              timestamp: new Date(msg.timestamp),
            },
          ]);
          if (!isOpen) {
            setUnreadCount((prev) => prev + 1);
            toast.info("New message from admin");
          }
          setSessionId(msg.sessionId);
        }
        break;

      case "typing":
        if (msg.userId !== user?.id) {
          setTypingAdminId(msg.userId);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingAdminId(null);
          }, 3000);
        }
        break;

      case "messages_read":
        setChatMessages((prev) =>
          prev.map((m) =>
            m.senderId === msg.userId ? { ...m, isRead: true } : m
          )
        );
        break;

      case "call_request":
        setIncomingCall({
          callerId: msg.callerId,
          callerName: msg.callerName || "Admin",
          callType: msg.callType || "audio",
        });
        setCallModalOpen(true);
        break;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleTyping = () => {
    if (!wsRef.current || !sessionId) return;

    wsRef.current.send(
      JSON.stringify({
        type: "typing",
        userId: user?.id,
        sessionId: sessionId,
      })
    );
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !wsRef.current || !sessionId) return;

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        userId: user?.id,
        sessionId: sessionId,
        message: messageInput,
        senderRole: "user",
      })
    );

    setChatMessages((prev) => [
      ...prev,
      {
        senderId: user?.id || 0,
        senderRole: "user",
        message: messageInput,
        timestamp: new Date(),
      },
    ]);

    setMessageInput("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum file size is 10MB" });
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadAttachment.mutateAsync({
          sessionId,
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        });

        // Add file message to local state
        const fileMsg = JSON.stringify({
          type: "file",
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          mimeType: file.type,
          fileSize: file.size,
        });

        setChatMessages((prev) => [
          ...prev,
          {
            senderId: user?.id || 0,
            senderRole: "user",
            message: fileMsg,
            timestamp: new Date(),
          },
        ]);

        // Broadcast via WebSocket for real-time notification only (not persisted again)
        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: "file_notification",
              userId: user?.id,
              sessionId: sessionId,
              message: fileMsg,
              senderRole: "user",
            })
          );
        }

        toast.success("File sent");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to upload file");
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Load messages when sessionId changes
  useEffect(() => {
    if (messagesData) {
      setChatMessages(
        messagesData.map((m: any) => ({
          senderId: m.senderId,
          senderRole: m.senderRole,
          message: m.message,
          timestamp: new Date(m.createdAt),
          isRead: m.isRead,
        }))
      );
    }
  }, [messagesData]);

  useEffect(() => {
    setIsLoadingHistory(isLoadingMessages);
  }, [isLoadingMessages]);

  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);

    // Load message history if session exists
    if (userSessions && userSessions.length > 0 && !sessionId) {
      const activeSession = userSessions[0];
      setSessionId(activeSession.id);
    }
  };

  // Listen for handoff events from AI chatbot
  useEffect(() => {
    const handleHandoff = (e: Event) => {
      const customEvent = e as CustomEvent;
      const handoffSessionId = customEvent.detail?.sessionId;
      if (handoffSessionId) {
        setSessionId(handoffSessionId);
      }
      setIsOpen(true);
      setUnreadCount(0);
      toast.success("Live chat connected", {
        description: "You're now chatting with our support team.",
      });
    };

    window.addEventListener(HANDOFF_EVENT, handleHandoff);
    return () => {
      window.removeEventListener(HANDOFF_EVENT, handleHandoff);
    };
  }, []);

  const renderMessage = (msg: ChatMessage) => {
    const fileData = tryParseFileMessage(msg.message);

    if (fileData) {
      const isImage = fileData.mimeType.startsWith("image/");
      return (
        <a
          href={fileData.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {isImage ? (
            <div className="space-y-1">
              <img
                src={fileData.fileUrl}
                alt={fileData.fileName}
                className="max-w-[200px] rounded-lg"
              />
              <p className="text-xs text-gray-400">{fileData.fileName}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <FileIcon className="w-5 h-5 text-[#00D4FF] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm truncate">{fileData.fileName}</p>
                <p className="text-xs text-gray-400">{formatFileSize(fileData.fileSize)}</p>
              </div>
            </div>
          )}
        </a>
      );
    }

    return <p>{msg.message}</p>;
  };

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="Open admin chat"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </div>
            )}
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed z-50 inset-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 bg-[#141B2D] border-[#00D4FF]/30 flex flex-col sm:h-[28rem] shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-[#00D4FF]/20 flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#00D4FF]" />
              <h3 className="font-bold text-white">Admin Support</h3>
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
            </div>
            <div className="flex items-center gap-1">
              {sessionId && (
                <>
                  <button
                    onClick={() => { setCallType("audio"); setCallModalOpen(true); }}
                    className="flex items-center justify-center w-8 h-8 hover:bg-green-500/20 rounded-lg transition-all"
                    aria-label="Audio call"
                    title="Audio call"
                  >
                    <Phone className="w-4 h-4 text-green-400" />
                  </button>
                  <button
                    onClick={() => { setCallType("video"); setCallModalOpen(true); }}
                    className="flex items-center justify-center w-8 h-8 hover:bg-blue-500/20 rounded-lg transition-all"
                    aria-label="Video call"
                    title="Video call"
                  >
                    <Video className="w-4 h-4 text-blue-400" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 bg-white/10 sm:bg-transparent hover:bg-red-500/20 rounded-lg transition-all"
                aria-label="Close chat"
              >
                <X className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingHistory ? (
              <div className="text-center text-gray-400 py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00D4FF] mx-auto mb-2"></div>
                <p className="text-sm">Loading chat history...</p>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Waiting for admin to connect...</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.senderRole === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                      msg.senderRole === "user"
                        ? "bg-[#00D4FF]/20 border border-[#00D4FF]/50 text-white"
                        : "bg-[#0A0E1A] border border-[#00D4FF]/20 text-gray-200"
                    }`}
                  >
                    {renderMessage(msg)}
                    {msg.timestamp && (
                      <p className="text-xs text-gray-400 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            {typingAdminId && (
              <div className="flex justify-start">
                <div className="bg-[#0A0E1A] border border-[#00D4FF]/20 text-gray-200 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-4 border-t border-[#00D4FF]/20 flex-shrink-0">
            {/* File attachment */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!sessionId || isUploading}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-[#00D4FF] disabled:opacity-30 transition-colors"
              title="Attach file"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>

            <Input
              type="text"
              placeholder="Type message..."
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              className="bg-[#0A0E1A] border-[#00D4FF]/30 text-white placeholder-gray-500 text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !isConnected}
              className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black font-bold p-2 flex-shrink-0"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Video/Audio Call Modal */}
      {callModalOpen && user && sessionId && (
        <VideoCallModal
          isOpen={callModalOpen}
          callType={incomingCall ? incomingCall.callType : callType}
          callerName={incomingCall ? incomingCall.callerName : "Admin Support"}
          isIncoming={!!incomingCall}
          ws={wsRef.current}
          myUserId={user.id}
          targetUserId={incomingCall ? incomingCall.callerId : 0}
          sessionId={sessionId}
          onClose={() => {
            setCallModalOpen(false);
            setIncomingCall(null);
          }}
        />
      )}
    </>
  );
}
