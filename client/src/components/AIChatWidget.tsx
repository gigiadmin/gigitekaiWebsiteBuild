import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, X, ChevronDown, Phone, MessageSquare, AlertCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  message: string;
  timestamp: number;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: "", email: "", phone: "", company: "", preferredDate: "", preferredTime: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York", notes: "" });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [handoffComplete, setHandoffComplete] = useState(false);
  // Debounced query for proactive KB suggestions
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const initInProgressRef = useRef(false); // Prevent double-init race condition

  // tRPC hooks
  const getOrCreateSession = trpc.aibot.getOrCreateSession.useMutation({
    onError: (err: any) => {
      console.error("[Chat] Session init failed:", err);
    },
  });
  const sendMessageMutation = trpc.aibot.sendMessage.useMutation({
    onError: (err: any) => {
      console.error("[Chat] Message send failed:", err);
      toast.error("Failed to send message. Please try again.");
    },
    onSuccess: (data) => {
      console.log("[Chat] Message sent successfully");
    },
  });
  const escalate = trpc.aibot.escalateToHelpDesk.useMutation();
  const captureLead = trpc.aibot.captureLead.useMutation();
  const emailTranscriptMutation = trpc.aibot.emailTranscript.useMutation();
  const requestAgentTakeover = trpc.aibot.requestAgentTakeover.useMutation();
  const clearChatHistoryMutation = trpc.aibot.clearChatHistory.useMutation();
  const { data: historyData } = trpc.aibot.getHistory.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );
  const handoffMutation = trpc.chat.handoffFromBot.useMutation();
  const bookMeetingMutation = trpc.calendar.bookMeeting.useMutation({
    onSuccess: () => {
      setBookingSuccess(true);
    },
    onError: (err: any) => {
      toast.error(err.message || "Booking failed — please try again");
    },
  });
  const { user: authUser, isAuthenticated } = useAuth();

  // Proactive KB suggestions while user is typing
  const { data: kbSuggestionsData } = trpc.aibot.getProactiveKBSuggestions.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 10, staleTime: 5000 }
  );
  const kbSuggestions = kbSuggestionsData?.suggestions || [];

  // Search analytics tracking for Aria chat
  const recordAriaSearch = trpc.kbSearchAnalytics.recordSearch.useMutation();
  const recordAriaClick = trpc.kbSearchAnalytics.recordClick.useMutation();
  const lastAriaTrackedQuery = useRef("");

  // Track search when KB suggestions load
  useEffect(() => {
    if (debouncedQuery.length >= 10 && kbSuggestionsData) {
      const q = debouncedQuery.trim().toLowerCase();
      if (q !== lastAriaTrackedQuery.current) {
        lastAriaTrackedQuery.current = q;
        recordAriaSearch.mutate({
          query: q,
          resultsCount: kbSuggestions.length,
          source: "aria_chat",
        });
      }
    }
  }, [debouncedQuery, kbSuggestionsData]);

  // Generate Mon/Wed/Fri dates for the next 3 months
  const availableDates = useMemo(() => {
    const dates: Array<{ value: string; label: string }> = [];
    const now = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    const cur = new Date(now);
    cur.setDate(cur.getDate() + 1); // start tomorrow
    while (cur <= end) {
      const day = cur.getDay();
      if (day === 1 || day === 3 || day === 5) {
        const value = cur.toISOString().split("T")[0];
        const label = cur.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        dates.push({ value, label });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, []);

  const TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  ];

  // Initialize session with hard 5-second timeout to prevent infinite hang
  useEffect(() => {
    if (!isOpen || sessionId || initInProgressRef.current) return;

    const initSession = async () => {
      initInProgressRef.current = true;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        console.log("[Chat] Initializing session...");
        // Race between session init and 5-second timeout
        const result = await Promise.race([
          getOrCreateSession.mutateAsync({
            sessionId: localStorage.getItem("chatSessionId") || undefined,
          }),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error("Session init timeout")), 5000);
          }),
        ]);
        if (timeoutId) clearTimeout(timeoutId);
        console.log("[Chat] Session initialized:", result.sessionId);
        setSessionId(result.sessionId);
        localStorage.setItem("chatSessionId", result.sessionId);
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        if (error?.message === "Session init timeout") {
          // Generate a local fallback session ID so the chat is still usable
          const fallbackId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          console.warn("[Chat] Session init timed out, using fallback ID:", fallbackId);
          setSessionId(fallbackId);
          localStorage.setItem("chatSessionId", fallbackId);
        } else {
          console.error("Failed to initialize chat session:", error);
          // Still generate fallback so chat is usable
          const fallbackId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          setSessionId(fallbackId);
          localStorage.setItem("chatSessionId", fallbackId);
        }
      } finally {
        initInProgressRef.current = false;
      }
    };

    console.log("[Chat] Opening chat, initializing session...");
    initSession();
  }, [isOpen, sessionId]);

  // Debug: Log whenever sessionId changes
  useEffect(() => {
    console.log("[Chat] sessionId state updated to:", sessionId, "button should be", sessionId ? "enabled" : "disabled");
  }, [sessionId]);

  // Load history
  useEffect(() => {
    if (sessionId && historyData?.messages && historyData.messages.length > 0) {
      console.log("[Chat] Loading history:", historyData.messages.length, "messages");
      setMessages(historyData.messages as ChatMessage[]);
    }
  }, [historyData, sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) {
      console.log("[Chat] Chat opened and session ready, focusing input");
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, sessionId]);

  // Listen for openAIChat event from ChatTriggerManager
  useEffect(() => {
    const handleOpenChat = () => {
      console.log("[Chat] openAIChat event received");
      setIsOpen(true);
    };
    window.addEventListener('openAIChat', handleOpenChat);
    return () => window.removeEventListener('openAIChat', handleOpenChat);
  }, []);

  // Log when sessionId changes
  useEffect(() => {
    if (sessionId) {
      console.log("[Chat] SessionId is now set:", sessionId);
    }
  }, [sessionId]);

  // Scroll detection for "scroll down" button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollDown(!isNearBottom);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Message Handlers ────────────────────────────────────────────────────────

  const sendQuickMessage = async (quickMessage: string) => {
    setHasInteracted(true);
    setMessages((prev) => [...prev, { role: "user", message: quickMessage, timestamp: Date.now() }]);
    setIsLoading(true);

    // Ensure session exists (same pattern as handleSendMessage)
    let ensuredSessionId = sessionId;
    if (!ensuredSessionId) {
      console.log("[Chat] Quick message: session not ready, initializing...");
      try {
        const result = await getOrCreateSession.mutateAsync({});
        ensuredSessionId = result.sessionId;
        setSessionId(ensuredSessionId);
        localStorage.setItem("chatSessionId", ensuredSessionId);
      } catch (error) {
        console.error("[Chat] Quick message: failed to init session:", error);
        // Use fallback session so chat is still usable
        ensuredSessionId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setSessionId(ensuredSessionId);
        localStorage.setItem("chatSessionId", ensuredSessionId);
      }
    }

    try {
      const response = await sendMessageMutation.mutateAsync({ sessionId: ensuredSessionId, message: quickMessage });
      setMessages((prev) => [...prev, { role: "assistant", message: response.message, timestamp: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", message: "I'm having trouble connecting right now. Please try again in a moment, or reach us at support@gigitekai.com or call 609-676-4483.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    console.log("[Chat] handleSendMessage called, state:", { inputValue: inputValue.trim(), sessionId: !!sessionId, isLoading, sessionIdValue: sessionId });
    if (!inputValue.trim()) {
      return;
    }
    
    setIsLoading(true);
    
    // If sessionId is not set, initialize it first
    let ensuredSessionId = sessionId;
    if (!ensuredSessionId) {
      console.log("[Chat] Session not initialized, initializing now...");
      try {
        const result = await getOrCreateSession.mutateAsync({});
        ensuredSessionId = result.sessionId;
        setSessionId(ensuredSessionId);
        localStorage.setItem("chatSessionId", ensuredSessionId);
      } catch (error) {
        console.error("[Chat] Failed to initialize session:", error);
        toast.error("Failed to initialize chat session. Please try again.");
        setIsLoading(false);
        return;
      }
    }
    
    console.log("[Chat] Sending message:", inputValue);
    const userMessage = inputValue.trim();
    setInputValue("");
    setHasInteracted(true);
    setMessages((prev) => [...prev, { role: "user", message: userMessage, timestamp: Date.now() }]);

    try {
      console.log("[Chat] Calling sendMessage mutation with ensuredSessionId:", ensuredSessionId);
      const response = await sendMessageMutation.mutateAsync({ sessionId: ensuredSessionId, message: userMessage });
      console.log("[Chat] Got response:", response.message.substring(0, 50));
      setMessages((prev) => [...prev, { role: "assistant", message: response.message, timestamp: Date.now() }]);

      if (response.shouldEscalate && response.messageCount && response.messageCount > 2) {
        setTimeout(() => {
          toast.info("Our support team is ready", {
            description: "Would you like to speak with a specialist?",
            action: { label: "Yes, connect me", onClick: () => handleEscalate("User requested escalation") },
          });
        }, 1000);
      }
    } catch (error) {
      console.error("[Chat] Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async (reason: string) => {
    if (!sessionId) return;
    try {
      await escalate.mutateAsync({ sessionId, reason, priority: "medium" });

      // If user is authenticated, attempt live chat handoff
      if (isAuthenticated && authUser) {
        try {
          const handoffResult = await handoffMutation.mutateAsync({
            aiSessionId: sessionId,
            summary: `[Handoff] Reason: ${reason}. User ${authUser.name || authUser.email || ""} transferred from AI assistant.`,
          });
          setHandoffComplete(true);
          toast.success("Connected to live support", {
            description: "You've been transferred to our admin team.",
          });
          // Add system message to AI chat
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              message: "You have been connected to our support team. A specialist will be with you shortly.",
              timestamp: Date.now(),
            },
          ]);
        } catch (error) {
          console.error("Handoff failed:", error);
          toast.info("Escalated to support", {
            description: "Your request has been escalated. Our team will contact you soon.",
          });
        }
      }
    } catch (error) {
      console.error("Escalation failed:", error);
      toast.error("Failed to escalate. Please try again.");
    }
  };

  const handleEmailTranscript = async () => {
    if (!sessionId || !authUser?.email) return;
    try {
      await emailTranscriptMutation.mutateAsync({ sessionId, email: authUser.email });
      toast.success("Transcript sent to your email");
    } catch (error) {
      toast.error("Failed to send transcript");
    }
  };

  const handleClearHistory = async () => {
    if (!sessionId) return;
    try {
      await clearChatHistoryMutation.mutateAsync({ sessionId });
      setMessages([]);
      setHasInteracted(false);
      toast.success("Chat history cleared");
    } catch (error) {
      toast.error("Failed to clear history");
    }
  };

  const handleCaptureLead = async () => {
    if (!sessionId || !authUser?.email) return;
    try {
      await captureLead.mutateAsync({
        sessionId,
        name: authUser?.name || "",
        email: authUser.email,
        phone: "",
        company: "",
      });
      toast.success("Lead information captured");
    } catch (error) {
      toast.error("Failed to capture lead");
    }
  };

  const handleBookMeeting = async () => {
    if (!sessionId || !bookingForm.preferredDate || !bookingForm.preferredTime) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await bookMeetingMutation.mutateAsync({
        name: bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        company: bookingForm.company,
        preferredDate: bookingForm.preferredDate,
        preferredTime: bookingForm.preferredTime,
        timezone: bookingForm.timezone,
      });
      toast.success("Meeting booked successfully");
      setShowBookingModal(false);
      setBookingForm({ name: "", email: "", phone: "", company: "", preferredDate: "", preferredTime: "", timezone: bookingForm.timezone, notes: "" });
    } catch (error) {
      toast.error("Failed to book meeting");
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center text-white z-40"
          aria-label="Open chat"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full"></span>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg shadow-2xl flex flex-col z-50 border border-cyan-500/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-t-lg border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">GigitekAI Assistant</h3>
                <p className="text-xs text-cyan-400">AI-powered support • Always online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50"
          >
            {!hasInteracted && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-cyan-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Welcome to GigitekAI</h4>
                <p className="text-gray-400 text-sm mb-6">Your AI-powered technology partner. How can I help you today?</p>

                {/* Quick Action Buttons */}
                <div ref={actionsMenuRef} className="grid grid-cols-2 gap-2 w-full">
                  <button
                    onClick={() => sendQuickMessage("Tell me about your AI Assessment service")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-purple-600/30 to-purple-700/30 hover:from-purple-600/50 hover:to-purple-700/50 rounded-lg border border-purple-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">🧠</div>
                    AI Assessment
                  </button>
                  <button
                    onClick={() => sendQuickMessage("How can you help with cloud migration?")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-cyan-600/30 to-cyan-700/30 hover:from-cyan-600/50 hover:to-cyan-700/50 rounded-lg border border-cyan-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">☁️</div>
                    Cloud Migration
                  </button>
                  <button
                    onClick={() => sendQuickMessage("What automation services do you offer?")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-amber-600/30 to-amber-700/30 hover:from-amber-600/50 hover:to-amber-700/50 rounded-lg border border-amber-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">⚡</div>
                    Automation
                  </button>
                  <button
                    onClick={() => sendQuickMessage("Tell me about your security audit services")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-green-600/30 to-green-700/30 hover:from-green-600/50 hover:to-green-700/50 rounded-lg border border-green-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">🛡️</div>
                    Security Audit
                  </button>
                  <button
                    onClick={() => sendQuickMessage("I need to report a bug")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-red-600/30 to-red-700/30 hover:from-red-600/50 hover:to-red-700/50 rounded-lg border border-red-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">🐛</div>
                    Report a Bug
                  </button>
                  <button
                    onClick={() => sendQuickMessage("I want to submit a support ticket")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-blue-600/30 to-blue-700/30 hover:from-blue-600/50 hover:to-blue-700/50 rounded-lg border border-blue-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">📧</div>
                    Submit Ticket
                  </button>
                  <button
                    onClick={() => sendQuickMessage("I have a general question")}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-teal-600/30 to-teal-700/30 hover:from-teal-600/50 hover:to-teal-700/50 rounded-lg border border-teal-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">❓</div>
                    General Help
                  </button>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-br from-indigo-600/30 to-indigo-700/30 hover:from-indigo-600/50 hover:to-indigo-700/50 rounded-lg border border-indigo-500/30 text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <div className="text-lg mb-1">📞</div>
                    Talk to a specialist
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-cyan-600 text-white rounded-br-none"
                      : "bg-slate-700 text-gray-100 rounded-bl-none"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.message}</Streamdown>
                  ) : (
                    <p className="text-sm">{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll Down Button */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 right-6 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-2 shadow-lg transition-all"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-cyan-500/20 bg-slate-900">
            {/* Proactive KB Suggestions (shown while typing) */}
            {kbSuggestions.length > 0 && inputValue.length >= 10 && (
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <BookOpen className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-cyan-400/80">Suggested articles:</span>
                </div>
                <div className="flex flex-col gap-1">
                  {kbSuggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setInputValue(`Tell me about: ${s.title}`);
                        setDebouncedQuery("");
                        // Track KB suggestion click
                        recordAriaClick.mutate({
                          query: debouncedQuery || inputValue,
                          articleId: s.id,
                          source: "aria_chat",
                        });
                      }}
                      className="text-left text-xs bg-slate-800/80 border border-cyan-500/20 hover:border-cyan-500/50 rounded-md px-2 py-1.5 text-cyan-300 hover:text-cyan-200 transition-colors truncate"
                      title={s.excerpt}
                    >
                      <span className="font-medium">{s.title}</span>
                      <span className="text-gray-500 ml-1">· {s.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Debounce KB suggestion query
                  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                  debounceTimerRef.current = setTimeout(() => {
                    setDebouncedQuery(e.target.value);
                  }, 300);
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask anything about our services..."
                className="flex-1 bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {isLoading && (
              <div className="mt-2 flex items-center gap-2 text-cyan-400 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>AI is thinking...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Schedule a Meeting</DialogTitle>
            <DialogDescription className="text-gray-400">
              Connect with one of our specialists
            </DialogDescription>
          </DialogHeader>
          {bookingSuccess ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Meeting Booked!</h3>
              <p className="text-gray-400 text-sm">
                We'll send you a confirmation email shortly.
              </p>
              <Button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingSuccess(false);
                }}
                className="mt-4 bg-cyan-600 hover:bg-cyan-700"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={bookingForm.name}
                onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="email"
                placeholder="Your email"
                value={bookingForm.email}
                onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="tel"
                placeholder="Your phone"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Company"
                value={bookingForm.company}
                onChange={(e) => setBookingForm({ ...bookingForm, company: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <Select value={bookingForm.preferredDate} onValueChange={(value) => setBookingForm({ ...bookingForm, preferredDate: value })}>
                <SelectTrigger className="bg-slate-800 border-cyan-500/30 text-white">
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-cyan-500/30">
                  {availableDates.map((date) => (
                    <SelectItem key={date.value} value={date.value} className="text-white hover:bg-cyan-600">
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={bookingForm.preferredTime} onValueChange={(value) => setBookingForm({ ...bookingForm, preferredTime: value })}>
                <SelectTrigger className="bg-slate-800 border-cyan-500/30 text-white">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-cyan-500/30">
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time} className="text-white hover:bg-cyan-600">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Additional notes"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                className="w-full bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <Button
                onClick={handleBookMeeting}
                disabled={bookMeetingMutation.isPending}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {bookMeetingMutation.isPending ? "Booking..." : "Book Meeting"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
