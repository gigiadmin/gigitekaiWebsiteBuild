import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, X, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm Aria, GigitekAI's AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const initInProgress = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getOrCreateSession = trpc.aibot.getOrCreateSession.useMutation();
  const sendMessage = trpc.aibot.sendMessage.useMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Initialize a real DB session when the chat opens
  useEffect(() => {
    if (!isOpen || sessionReady || initInProgress.current) return;
    initInProgress.current = true;
    const init = async () => {
      try {
        const storedId = localStorage.getItem("copilotSessionId") || undefined;
        const result = await Promise.race([
          getOrCreateSession.mutateAsync({ sessionId: storedId }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
        ]);
        setSessionId(result.sessionId);
        localStorage.setItem("copilotSessionId", result.sessionId);
        setSessionReady(true);
      } catch {
        // Retry without stored ID
        try {
          const result = await getOrCreateSession.mutateAsync({});
          setSessionId(result.sessionId);
          localStorage.setItem("copilotSessionId", result.sessionId);
          setSessionReady(true);
        } catch (error) {
          console.error("[CopilotChat] Session init failed:", error);
          // Keep sessionReady as false to show error state
        }
      } finally {
        initInProgress.current = false;
      }
    };
    init();
  }, [isOpen, sessionReady]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // If session is not ready, try to initialize it first
    if (!sessionId) {
      try {
        const result = await getOrCreateSession.mutateAsync({});
        setSessionId(result.sessionId);
        localStorage.setItem("copilotSessionId", result.sessionId);
      } catch (error) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: "Unable to establish a session. Please try again or contact support@gigitekai.com.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (!sessionId) throw new Error("Session not ready");
      const response = await sendMessage.mutateAsync({
        sessionId,
        message: userMessage.content,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message || "I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment, or reach us at support@gigitekai.com.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-[opacity,transform] z-40 flex items-center justify-center"
        aria-label="Open Copilot chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-2xl z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold leading-tight">Aria - AI Assistant</h3>
            <p className="text-xs text-cyan-100 leading-tight">{sessionReady && sessionId ? "Online" : sessionReady ? "Ready" : "Connecting..."}</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-cyan-700 p-1 rounded transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 h-80">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-cyan-600 text-white rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Aria is thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 rounded-b-lg bg-muted/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            aria-label="Send message"
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
