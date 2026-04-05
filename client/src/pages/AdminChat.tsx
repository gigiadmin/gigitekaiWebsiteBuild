import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, LogOut, MessageCircle, User, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

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

interface ChatSession {
  id: number;
  userId: number;
  adminId?: number;
  status: "active" | "closed" | "archived";
  messages: ChatMessage[];
}

export default function AdminChat() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [typingUserId, setTypingUserId] = useState<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // tRPC queries
  const { data: adminSessions } = trpc.chat.getAdminSessions.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const markAsReadMutation = trpc.chat.markAsRead.useMutation();

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, user, navigate]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin" || !user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[AdminChat] WebSocket connected");
      setIsConnected(true);
      // Send join message
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

    ws.onerror = (error) => {
      console.error("[AdminChat] WebSocket error:", error);
      toast.error("Connection error");
    };

    ws.onclose = () => {
      console.log("[AdminChat] WebSocket disconnected");
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
          // Clear previous timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          // Clear typing indicator after 3 seconds
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
      // Find or create session for this user
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

    // Send message via WebSocket
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        userId: user?.id,
        sessionId: sessionId,
        message: messageInput,
        senderRole: "admin",
      })
    );

    // Add message to local state
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
    
    // Mark messages as read
    try {
      await markAsReadMutation.mutateAsync({ sessionId });
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/helpdesk");
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
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-[#00D4FF]" />
            <h1 className="text-3xl font-bold">Admin Chat</h1>
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Online Users List */}
          <Card className="bg-[#141B2D] border-[#00D4FF]/30 p-6 h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#00D4FF]" />
              Online Users ({onlineUsers.length})
            </h2>

            <div className="space-y-2">
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
              <Card className="bg-[#141B2D] border-[#00D4FF]/30 p-6 flex flex-col h-96">
                {/* Chat Header */}
                <div className="border-b border-[#00D4FF]/20 pb-4 mb-4">
                  <h3 className="text-lg font-bold">Chat with User #{selectedUserId}</h3>
                  <p className="text-sm text-gray-400">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date().toLocaleTimeString()}
                  </p>
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
                          <p className="text-sm">{msg.message}</p>
                          {msg.timestamp && (
                            <p className="text-xs text-gray-400 mt-1">
                              {msg.timestamp.toLocaleTimeString()}
                            </p>
                          )}
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
                <div className="flex gap-2">
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
      </div>
    </div>
  );
}
