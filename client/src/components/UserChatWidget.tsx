import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, X, MessageCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ChatMessage {
  id?: number;
  senderId: number;
  senderRole: "user" | "admin";
  message: string;
  timestamp?: Date;
  isRead?: boolean;
}

export default function UserChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [typingAdminId, setTypingAdminId] = useState<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // tRPC queries
  const { data: userSessions } = trpc.chat.getUserSessions.useQuery(undefined, {
    enabled: isAuthenticated && user?.role !== "admin",
  });

  // Only show for authenticated users (not admins)
  if (!isAuthenticated || user?.role === "admin") {
    return null;
  }

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[UserChat] WebSocket connected");
      setIsConnected(true);
      // Send join message
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

    ws.onerror = (error) => {
      console.error("[UserChat] WebSocket error:", error);
      toast.error("Connection error");
    };

    ws.onclose = () => {
      console.log("[UserChat] WebSocket disconnected");
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isAuthenticated, user]);

  const handleWebSocketMessage = (msg: any) => {
    switch (msg.type) {
      case "message":
        if (msg.senderRole === "admin") {
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
          // Clear previous timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          // Clear typing indicator after 3 seconds
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

    // Send message via WebSocket
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        userId: user?.id,
        sessionId: sessionId,
        message: messageInput,
        senderRole: "user",
      })
    );

    // Add message to local state
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

  const handleOpenChat = async () => {
    setIsOpen(true);
    setUnreadCount(0);
    
    // Load message history if session exists
    if (userSessions && userSessions.length > 0 && !sessionId) {
      const activeSession = userSessions[0];
      setSessionId(activeSession.id);
      setIsLoadingHistory(true);
      
      try {
        const { data: messages } = await trpc.chat.getMessages.useQuery({ sessionId: activeSession.id });
        if (messages) {
          setChatMessages(
            messages.map((m: any) => ({
              senderId: m.senderId,
              senderRole: m.senderRole,
              message: m.message,
              timestamp: new Date(m.createdAt),
              isRead: m.isRead,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    }
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
        <Card className="fixed bottom-6 right-6 z-50 w-96 bg-[#141B2D] border-[#00D4FF]/30 flex flex-col h-96 shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-[#00D4FF]/20">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#00D4FF]" />
              <h3 className="font-bold text-white">Admin Support</h3>
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
              chatMessages.length > 0 && chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.senderRole === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.senderRole === "user"
                        ? "bg-[#00D4FF]/20 border border-[#00D4FF]/50 text-white"
                        : "bg-[#0A0E1A] border border-[#00D4FF]/20 text-gray-200"
                    }`}
                  >
                    <p>{msg.message}</p>
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
          <div className="flex gap-2 p-4 border-t border-[#00D4FF]/20">
            <Input
              type="text"
              placeholder="Type message..."
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              className="bg-[#0A0E1A] border-[#00D4FF]/30 text-white placeholder-gray-500 text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !isConnected}
              className="bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black font-bold p-2"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
