import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Send,
  LogOut,
  MessageCircle,
  User,
  Clock,
  Download,
  BarChart3,
  FileText,
  Users,
  Zap,
  TrendingUp,
  ArrowLeft,
  Home,
  Paperclip,
  FileIcon,
  Phone,
  Video,
  Mail,
} from "lucide-react";
import VideoCallModal from "@/components/VideoCallModal";
import QuickReplyModal from "@/components/QuickReplyModal";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface OnlineUser {
  userId: number;
  userName?: string;
  email?: string;
}

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

type Tab = "chat" | "analytics" | "transcripts";

export default function AdminChat() {
  // Primary: Manus OAuth (same session as /helpdesk)
  const { user: oauthUser, loading: oauthLoading, isAuthenticated: oauthAuthenticated } = useAuth();

  // Fallback: custom admin auth (for agents/viewers without Manus accounts)
  const { data: customAdminUser, isLoading: customAdminLoading } = trpc.adminAuth.me.useQuery(
    undefined,
    { enabled: !oauthLoading && !oauthAuthenticated }
  );

  const loading = oauthLoading || (!oauthAuthenticated && customAdminLoading);

  // Determine active user — OAuth takes priority
  const adminUser = oauthAuthenticated && oauthUser
    ? { id: oauthUser.id, email: oauthUser.email ?? "", role: oauthUser.role === "admin" ? "admin" as const : "agent" as const }
    : customAdminUser
    ? { id: customAdminUser.id, email: customAdminUser.email, role: customAdminUser.role as "admin" | "agent" | "viewer" }
    : null;

  const isAuthenticated = !!adminUser;
  const user = adminUser;
  const [, navigate] = useLocation();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [quickReplySessionId, setQuickReplySessionId] = useState<number | undefined>();
  const [quickReplyEmail, setQuickReplyEmail] = useState("");
  const [quickReplyName, setQuickReplyName] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [typingUserId, setTypingUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [isUploading, setIsUploading] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [incomingCall, setIncomingCall] = useState<{ callerId: number; callerName: string; callType: "audio" | "video" } | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isChatRefreshing, setIsChatRefreshing] = useState(false);
  const chatListScrollRef = useRef<HTMLDivElement>(null);
  const chatTouchStartYRef = useRef(0);

  // tRPC queries
  const { data: adminSessions } = trpc.chat.getAdminSessions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const markAsReadMutation = trpc.chat.markAsRead.useMutation();
  const uploadAttachment = trpc.chat.uploadAttachment.useMutation();

  // Analytics query
  const { data: analytics, isLoading: analyticsLoading } = trpc.chat.getAnalytics.useQuery(
    { days: analyticsDays },
    { enabled: isAuthenticated && activeTab === "analytics" }
  );

  // All sessions for transcript list
  const { data: allSessions } = trpc.chat.getAllSessions.useQuery(
    { status: "all", limit: 50 },
    { enabled: isAuthenticated && activeTab === "transcripts" }
  );

  // Transcript export for selected session
  const [transcriptSessionId, setTranscriptSessionId] = useState<number | null>(null);
  const { data: transcriptData } = trpc.chat.exportTranscript.useQuery(
    { sessionId: transcriptSessionId || 0, format: "text" },
    { enabled: !!transcriptSessionId }
  );

  // Redirect if not authenticated — send to Manus OAuth login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  // Pull-to-refresh for mobile chat sessions list
  useEffect(() => {
    const container = chatListScrollRef.current;
    if (!container) return;
    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) chatTouchStartYRef.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (container.scrollTop === 0 && chatTouchStartYRef.current > 0) {
        const diff = e.touches[0].clientY - chatTouchStartYRef.current;
        if (diff > 80 && !isChatRefreshing) {
          setIsChatRefreshing(true);
          // Re-connect WebSocket to get fresh online users
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'get_online_users' }));
          }
          setTimeout(() => { setIsChatRefreshing(false); chatTouchStartYRef.current = 0; }, 1000);
        }
      }
    };
    const handleTouchEnd = () => { chatTouchStartYRef.current = 0; };
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isChatRefreshing]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(
        JSON.stringify({
          type: "join",
          userId: user.id,
          role: "admin",
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWebSocketMessage(msg);
      } catch (error) {
        console.error("[AdminChat] Error parsing message:", error);
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
  }, [isAuthenticated, user, loading]);

  const handleWebSocketMessage = (msg: any) => {
    switch (msg.type) {
      case "user_online":
        setOnlineUsers((prev) => {
          const exists = prev.some((u) => u.userId === msg.userId);
          if (!exists) {
            return [...prev, { userId: msg.userId }];
          }
          return prev;
        });
        toast.info(`User ${msg.userId} is now online`);
        break;

      case "user_offline":
        setOnlineUsers((prev) => prev.filter((u) => u.userId !== msg.userId));
        if (selectedUserId === msg.userId) {
          setSelectedUserId(null);
          setChatMessages([]);
          toast.info("User went offline");
        }
        break;

      case "message":
        if (msg.sessionId) {
          setChatMessages((prev) => [
            ...prev,
            {
              senderId: msg.senderId,
              senderRole: msg.senderRole,
              message: msg.message,
              timestamp: new Date(msg.timestamp),
            },
          ]);
        }
        break;

      case "typing":
        if (msg.userId !== user?.id) {
          setTypingUserId(msg.userId);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUserId(null);
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
          callerName: msg.callerName || `User #${msg.callerId}`,
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

  // Load chat messages for selected session
  const { data: messagesData, isLoading: isLoadingMessages } = trpc.chat.getMessages.useQuery(
    { sessionId: sessionId || 0 },
    { enabled: !!sessionId }
  );

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

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    try {
      const userSession = adminSessions?.find((s: any) => s.userId === userId);
      if (userSession) {
        setSessionId(userSession.id);
      }
    } catch (error) {
      console.error("Error selecting user:", error);
      toast.error("Failed to select user");
    }
  };

  const handleTyping = () => {
    if (!selectedUserId || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: "typing",
        userId: user?.id,
        sessionId: sessionId,
      })
    );
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId || !wsRef.current || !sessionId) return;

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        userId: user?.id,
        sessionId: sessionId,
        message: messageInput,
        senderRole: "admin",
      })
    );

    setChatMessages((prev) => [
      ...prev,
      {
        senderId: user?.id || 0,
        senderRole: "admin",
        message: messageInput,
        timestamp: new Date(),
      },
    ]);

    setMessageInput("");

    try {
      await markAsReadMutation.mutateAsync({ sessionId });
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleExportTranscript = (sid: number) => {
    setTranscriptSessionId(sid);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

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
            senderRole: "admin",
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
              senderRole: "admin",
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const fileData = tryParseFileMessage(msg.message);
    if (fileData) {
      const isImage = fileData.mimeType.startsWith("image/");
      return (
        <a href={fileData.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
          {isImage ? (
            <div className="space-y-1">
              <img src={fileData.fileUrl} alt={fileData.fileName} className="max-w-[200px] rounded-lg" />
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
    return <p className="text-sm">{msg.message}</p>;
  };

  // Download transcript when data arrives
  useEffect(() => {
    if (transcriptData && transcriptSessionId) {
      const content = (transcriptData as any).transcript || JSON.stringify(transcriptData, null, 2);
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-transcript-session-${transcriptSessionId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Transcript downloaded");
      setTranscriptSessionId(null);
    }
  }, [transcriptData, transcriptSessionId]);

  const handleLogout = async () => {
    window.location.href = "/logout-confirmation";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <a href="/" className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Back to GigitekAI.com">
              <Home className="w-5 h-5 text-gray-400" />
            </a>
            <MessageCircle className="w-7 h-7 text-[#00D4FF]" />
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Admin Chat Center
            </h1>
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            ></div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin/helpdesk" className="text-sm text-gray-400 hover:text-[#00D4FF] transition-colors mr-2">
              Help Desk
            </a>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-[#0A0E1A] p-1 rounded-lg w-fit">
          {[
            { id: "chat" as Tab, label: "Live Chat", icon: MessageCircle },
            { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
            { id: "transcripts" as Tab, label: "Transcripts", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Online Users List */}
            <Card className="bg-[#141B2D] border-[#00D4FF]/30 p-6 h-fit">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#00D4FF]" />
                Online Users ({onlineUsers.length})
              </h2>
              {isChatRefreshing && (
                <div className="flex items-center justify-center gap-2 py-1 mb-2 text-[#00D4FF] text-xs border border-[#00D4FF]/20 rounded-lg">
                  <div className="w-3 h-3 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
                  Refreshing...
                </div>
              )}
              <div className="space-y-2" ref={chatListScrollRef} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {onlineUsers.length === 0 ? (
                  <p className="text-gray-400 text-sm">No users online</p>
                ) : (
                  onlineUsers.map((onlineUser) => (
                    <button
                      key={onlineUser.userId}
                      onClick={() => handleSelectUser(onlineUser.userId)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedUserId === onlineUser.userId
                          ? "bg-[#00D4FF]/20 border border-[#00D4FF] text-[#00D4FF]"
                          : "bg-[#0A0E1A] border border-[#00D4FF]/10 hover:border-[#00D4FF]/30"
                      }`}
                    >
                      <div className="font-semibold">User #{onlineUser.userId}</div>
                      {onlineUser.email && (
                        <div className="text-xs text-gray-400">{onlineUser.email}</div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Online
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedUserId ? (
                <Card className="bg-[#141B2D] border-[#00D4FF]/30 p-6 flex flex-col h-[500px]">
                  {/* Chat Header */}
                  <div className="border-b border-[#00D4FF]/20 pb-4 mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold">Chat with User #{selectedUserId}</h3>
                      <p className="text-sm text-gray-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sessionId && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCallType("audio");
                              setCallModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-xs border-green-500/40 text-green-400 hover:bg-green-500/10"
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCallType("video");
                              setCallModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                          >
                            <Video className="w-3 h-3" />
                            Video
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportTranscript(sessionId)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Download className="w-3 h-3" />
                            Export
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                    {isLoadingHistory ? (
                      <div className="text-center text-gray-400 py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF] mx-auto mb-2"></div>
                        <p>Loading chat history...</p>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${
                            msg.senderRole === "admin" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              msg.senderRole === "admin"
                                ? "bg-[#00D4FF]/20 border border-[#00D4FF]/50 text-white"
                                : "bg-[#0A0E1A] border border-[#00D4FF]/20 text-gray-200"
                            }`}
                          >
                            {renderMessage(msg)}
                            <div className="flex items-center gap-2 mt-1">
                              {msg.timestamp && (
                                <p className="text-xs text-gray-400">
                                  {msg.timestamp.toLocaleTimeString()}
                                </p>
                              )}
                              {msg.senderRole === "admin" && msg.isRead && (
                                <span className="text-xs text-[#00D4FF]">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {typingUserId && typingUserId !== user?.id && (
                      <div className="flex justify-start">
                        <div className="bg-[#0A0E1A] border border-[#00D4FF]/20 text-gray-200 px-4 py-2 rounded-lg">
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

                  {/* Message Input */}
                  <div className="flex items-center gap-2">
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
                      placeholder="Type your message..."
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
                      className="bg-[#0A0E1A] border-[#00D4FF]/30 text-white placeholder-gray-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black font-bold"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="bg-[#141B2D] border-[#00D4FF]/30 p-12 text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-[#00D4FF] opacity-50" />
                  <h3 className="text-xl font-bold mb-2">Select a User</h3>
                  <p className="text-gray-400">
                    Choose an online user from the list to start chatting
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Time Range:</span>
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setAnalyticsDays(d)}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    analyticsDays === d
                      ? "bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30"
                      : "text-gray-400 hover:text-white bg-[#0A0E1A] border border-transparent"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            {analyticsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4FF] mx-auto mb-3"></div>
                <p className="text-gray-400">Loading analytics...</p>
              </div>
            ) : analytics && analytics.totalSessions > 0 ? (
              <>
                {/* Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: "Total Sessions", value: analytics.totalSessions, icon: MessageCircle, color: "#00D4FF" },
                    { label: "Active Now", value: analytics.activeSessions, icon: Zap, color: "#22c55e" },
                    { label: "Total Messages", value: analytics.totalMessages, icon: Send, color: "#8b5cf6" },
                    { label: "Leads Captured", value: analytics.totalLeads, icon: Users, color: "#f59e0b" },
                    { label: "Escalated", value: analytics.escalatedChats, icon: TrendingUp, color: "#ef4444" },
                  ].map((metric) => (
                    <Card key={metric.label} className="bg-[#141B2D] border-[#00D4FF]/15 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                        <span className="text-xs text-gray-400">{metric.label}</span>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: metric.color }}>
                        {metric.value}
                      </p>
                    </Card>
                  ))}
                </div>

                {/* Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[#141B2D] border-[#00D4FF]/15 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-[#00D4FF]" />
                      Chat Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">AI Bot Sessions</span>
                        <span className="font-bold text-[#00D4FF]">{analytics.aiChatSessions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">AI Bot Messages</span>
                        <span className="font-bold text-[#00D4FF]">{analytics.aiChatMessages}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Live Chat Sessions</span>
                        <span className="font-bold text-[#00D4FF]">{analytics.totalSessions - analytics.aiChatSessions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Avg Messages/Session</span>
                        <span className="font-bold text-[#00D4FF]">{analytics.avgMessagesPerSession}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Closed Sessions</span>
                        <span className="font-bold text-gray-300">{analytics.closedSessions}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-[#141B2D] border-[#00D4FF]/15 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#00D4FF]" />
                      Recent Sessions
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analytics.recentSessions.length === 0 ? (
                        <p className="text-gray-400 text-sm">No recent sessions</p>
                      ) : (
                        analytics.recentSessions.map((s: any) => (
                          <div
                            key={s.id}
                            className="flex justify-between items-center p-2 rounded bg-[#0A0E1A] border border-[#00D4FF]/10"
                          >
                            <div>
                              <span className="text-sm font-medium">Session #{s.id}</span>
                              <span className="text-xs text-gray-400 ml-2">User #{s.userId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  s.status === "active"
                                    ? "bg-green-500/20 text-green-400"
                                    : s.status === "closed"
                                    ? "bg-gray-500/20 text-gray-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {s.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </>
            ) : analytics ? (
              <div className="text-center py-12 bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <p className="text-red-400 mb-2">Failed to load analytics</p>
                <p className="text-sm text-gray-400">The analytics query timed out. Please try again or refresh the page.</p>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No analytics data available</p>
            )}
          </div>
        )}

        {activeTab === "transcripts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00D4FF]" />
                Chat Transcripts
              </h2>
            </div>

            {!allSessions || allSessions.length === 0 ? (
              <Card className="bg-[#141B2D] border-[#00D4FF]/15 p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400">No chat sessions found</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {allSessions.map((session: any) => (
                  <Card
                    key={session.id}
                    className="bg-[#141B2D] border-[#00D4FF]/15 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-[#00D4FF]" />
                      </div>
                      <div>
                        <p className="font-medium">Session #{session.id}</p>
                        <p className="text-xs text-gray-400">
                          User #{session.userId} &middot;{" "}
                          {session.createdAt
                            ? new Date(session.createdAt).toLocaleDateString()
                            : "Unknown date"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          session.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : session.status === "closed"
                            ? "bg-gray-500/20 text-gray-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {session.status}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportTranscript(session.id)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Download className="w-3 h-3" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuickReplySessionId(session.id);
                          setQuickReplyEmail(session.visitorEmail || `user${session.userId}@example.com`);
                          setQuickReplyName(session.visitorName || `User #${session.userId}`);
                          setShowQuickReply(true);
                        }}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Reply Modal */}
      <QuickReplyModal
        isOpen={showQuickReply}
        onClose={() => setShowQuickReply(false)}
        linkedSessionId={quickReplySessionId}
        recipientEmail={quickReplyEmail}
        recipientName={quickReplyName}
        onSuccess={() => {
          // Optionally refetch sessions or show success toast
          toast.success("Email sent successfully!");
        }}
      />

      {/* Video/Audio Call Modal */}
      {callModalOpen && user && selectedUserId && sessionId && (
        <VideoCallModal
          isOpen={callModalOpen}
          callType={incomingCall ? incomingCall.callType : callType}
          callerName={incomingCall ? incomingCall.callerName : `User #${selectedUserId}`}
          isIncoming={!!incomingCall}
          ws={wsRef.current}
          myUserId={user.id}
          targetUserId={incomingCall ? incomingCall.callerId : selectedUserId}
          sessionId={sessionId}
          onClose={() => {
            setCallModalOpen(false);
            setIncomingCall(null);
          }}
        />
      )}
    </div>
  );
}
