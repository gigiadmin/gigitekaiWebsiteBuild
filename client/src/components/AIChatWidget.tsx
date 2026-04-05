import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  MessageSquare,
  Shield,
  Zap,
  Cloud,
  Brain,
  ChevronDown,
  Minimize2,
  Home,
  Bug,
  TicketCheck,
  HelpCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { HANDOFF_EVENT } from "@/App";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant";
  message: string;
  timestamp?: number;
}

interface ConsentPrefs {
  email: boolean;
  phone: boolean;
  text: boolean;
}

// ─── Quick Action Cards ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    icon: Brain,
    label: "AI Assessment",
    message: "I'd like to learn about your AI readiness assessment and how AI can benefit my business.",
    color: "from-purple-500/20 to-purple-600/20",
    border: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    icon: Cloud,
    label: "Cloud Migration",
    message: "Tell me about your cloud migration services and how you help businesses move to the cloud.",
    color: "from-cyan-500/20 to-blue-600/20",
    border: "border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    icon: Zap,
    label: "Automation",
    message: "I'm interested in business process automation and modernization solutions.",
    color: "from-amber-500/20 to-orange-600/20",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
  },
  {
    icon: Shield,
    label: "Security Audit",
    message: "I need information about your cybersecurity assessment and enterprise security solutions.",
    color: "from-emerald-500/20 to-green-600/20",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  {
    icon: Bug,
    label: "Report a Bug",
    message: "I'd like to report a bug or technical issue I'm experiencing.",
    color: "from-red-500/20 to-rose-600/20",
    border: "border-red-500/30",
    iconColor: "text-red-400",
  },
  {
    icon: TicketCheck,
    label: "Submit Ticket",
    message: "I need to submit a support ticket for an issue that needs attention.",
    color: "from-blue-500/20 to-indigo-600/20",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    icon: HelpCircle,
    label: "General Help",
    message: "I have a general question about your services and need some guidance.",
    color: "from-teal-500/20 to-cyan-600/20",
    border: "border-teal-500/30",
    iconColor: "text-teal-400",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState({ name: "", email: "", company: "", phone: "" });
  const [consent, setConsent] = useState<ConsentPrefs>({ email: false, phone: false, text: false });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // tRPC hooks
  const getOrCreateSession = trpc.aibot.getOrCreateSession.useMutation();
  const sendMessageMutation = trpc.aibot.sendMessage.useMutation();
  const escalate = trpc.aibot.escalateToHelpDesk.useMutation();
  const captureLead = trpc.aibot.captureLead.useMutation();
  const { data: historyData } = trpc.aibot.getHistory.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );
  const handoffMutation = trpc.chat.handoffFromBot.useMutation();
  const { user: authUser, isAuthenticated } = useAuth();
  const [handoffComplete, setHandoffComplete] = useState(false);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const result = await getOrCreateSession.mutateAsync({
          sessionId: localStorage.getItem("chatSessionId") || undefined,
        });
        setSessionId(result.sessionId);
        localStorage.setItem("chatSessionId", result.sessionId);
      } catch (error) {
        console.error("Failed to initialize chat session:", error);
      }
    };
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen, sessionId]);

  // Load history
  useEffect(() => {
    if (historyData?.messages && historyData.messages.length > 0) {
      setMessages(historyData.messages as ChatMessage[]);
      setHasInteracted(true);
    }
  }, [historyData]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

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
    if (!sessionId) return;
    setHasInteracted(true);
    setMessages((prev) => [...prev, { role: "user", message: quickMessage, timestamp: Date.now() }]);
    setIsLoading(true);
    try {
      const response = await sendMessageMutation.mutateAsync({ sessionId, message: quickMessage });
      setMessages((prev) => [...prev, { role: "assistant", message: response.message, timestamp: Date.now() }]);
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return;
    const userMessage = inputValue.trim();
    setInputValue("");
    setHasInteracted(true);
    setMessages((prev) => [...prev, { role: "user", message: userMessage, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({ sessionId, message: userMessage });
      setMessages((prev) => [...prev, { role: "assistant", message: response.message, timestamp: Date.now() }]);

      if (response.shouldEscalate && response.messageCount && response.messageCount > 2) {
        setTimeout(() => {
          toast.info("Our support team is ready", {
            description: "Would you like to speak with a specialist?",
            action: { label: "Yes, connect me", onClick: () => handleEscalate("User requested escalation") },
          });
        }, 1000);
      }
    } catch {
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
              role: "assistant",
              message: "You've been connected to our live support team. The **Live Chat** will open automatically. Our admin team has your conversation context.",
              timestamp: Date.now(),
            },
          ]);

          // Dispatch handoff event to auto-open UserChatWidget
          window.dispatchEvent(
            new CustomEvent(HANDOFF_EVENT, {
              detail: { sessionId: handoffResult.realtimeSessionId },
            })
          );

          // Auto-close AI chat after a brief delay
          setTimeout(() => {
            setIsOpen(false);
          }, 2000);
          return;
        } catch (handoffErr) {
          console.error("Handoff failed, falling back to lead form:", handoffErr);
        }
      }

      toast.success("Escalated to support team", { description: "A specialist will contact you shortly." });
      setShowLeadForm(true);
    } catch {
      toast.error("Failed to escalate. Please try again.");
    }
  };

  const handleCaptureLead = async () => {
    if (!visitorInfo.name || !visitorInfo.email || !sessionId) {
      toast.error("Please fill in your name and email");
      return;
    }
    if (!consent.email && !consent.phone && !consent.text) {
      toast.error("Please select at least one contact preference");
      return;
    }

    try {
      await captureLead.mutateAsync({
        sessionId,
        name: visitorInfo.name,
        email: visitorInfo.email,
        phone: visitorInfo.phone || undefined,
        company: visitorInfo.company || undefined,
        consentEmail: consent.email,
        consentPhone: consent.phone,
        consentText: consent.text,
      });

      toast.success("Thank you!", { description: "We'll follow up with you shortly via your preferred method." });
      setShowLeadForm(false);
      setVisitorInfo({ name: "", email: "", company: "", phone: "" });
      setConsent({ email: false, phone: false, text: false });
    } catch {
      toast.error("Failed to save information. Please try again.");
    }
  };

  const handleBackToMenu = () => {
    setShowMenu(true);
    setShowLeadForm(false);
    // Scroll to top of messages area
    setTimeout(() => {
      messagesContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowLeadForm(false);
    setShowMenu(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating Action Button ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 group transition-all duration-300 ${
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        }`}
        title="Chat with GigitekAI"
        aria-label="Open AI chat"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#00D4FF]/30 animate-ping" />
        {/* Button */}
        <span className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#0088AA] shadow-lg shadow-[#00D4FF]/40 group-hover:shadow-xl group-hover:shadow-[#00D4FF]/60 transition-shadow">
          <MessageCircle size={26} className="text-[#0A0E1A]" />
        </span>
        {/* Badge */}
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold shadow-md">
          AI
        </span>
      </button>

      {/* ── Chat Window ────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col
            inset-0
            md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:max-h-[680px] md:h-[680px]
            md:rounded-2xl md:border md:border-[rgba(0,212,255,0.15)]
            bg-[#0B1120] shadow-2xl shadow-black/60
            transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1120] via-[#0F1A30] to-[#0B1120] border-b border-[rgba(0,212,255,0.15)] px-4 py-3 md:rounded-t-2xl flex-shrink-0">
            {/* Animated gradient line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent animate-pulse" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* AI Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF]/20 to-purple-500/20 border border-[rgba(0,212,255,0.3)] flex items-center justify-center">
                    <Bot size={22} className="text-[#00D4FF]" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0B1120]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm flex items-center gap-1.5">
                    GigitekAI Assistant
                    <Sparkles size={14} className="text-[#00D4FF]" />
                  </h3>
                  <p className="text-[11px] text-gray-400">AI-powered support &bull; Always online</p>
                </div>
              </div>

              {/* Close / Minimize Buttons */}
              <div className="flex items-center gap-1">
                {/* Minimize - desktop only */}
                <button
                  onClick={handleClose}
                  className="hidden md:flex p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Minimize"
                  aria-label="Minimize chat"
                >
                  <Minimize2 size={18} className="text-gray-400" />
                </button>
                {/* Close - always visible, extra large on mobile */}
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-12 h-12 md:w-9 md:h-9 bg-white/10 md:bg-transparent hover:bg-red-500/20 rounded-xl md:rounded-lg transition-all"
                  title="Close chat"
                  aria-label="Close chat"
                >
                  <X size={28} className="text-white md:hidden" />
                  <X size={18} className="text-gray-400 hidden md:block" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Messages Area ──────────────────────────────────────────────── */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
          >
            {/* Welcome / Menu Screen */}
            {((!hasInteracted && messages.length === 0) || showMenu) && (
              <div className="flex flex-col items-center text-center pt-4 pb-2">
                {/* AI Logo */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4FF]/20 to-purple-500/20 border border-[rgba(0,212,255,0.2)] flex items-center justify-center mb-4">
                  <Bot size={32} className="text-[#00D4FF]" />
                </div>
                <h4 className="text-white font-semibold text-lg mb-1">Welcome to GigitekAI</h4>
                <p className="text-gray-400 text-sm mb-6 max-w-[280px]">
                  Your AI-powered technology partner. How can I help you today?
                </p>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => { setShowMenu(false); sendQuickMessage(action.message); }}
                      className={`group flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${action.color} border ${action.border} hover:scale-[1.03] active:scale-[0.98] transition-all duration-200`}
                    >
                      <action.icon size={20} className={action.iconColor} />
                      <span className="text-xs text-gray-300 font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>

                {/* Talk to human */}
                <button
                  onClick={() => { setShowMenu(false); handleEscalate("User wants to talk to support"); }}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-gray-400 hover:text-[#00D4FF] hover:bg-[#00D4FF]/5 transition-colors"
                >
                  <ArrowRight size={14} />
                  Talk to a specialist instead
                </button>

                {/* Back to conversation button - only show when returning to menu */}
                {showMenu && messages.length > 0 && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                    }}
                    className="mt-1 flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-colors font-medium"
                  >
                    <ChevronDown size={14} />
                    Back to conversation
                  </button>
                )}
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mt-0.5">
                  {msg.role === "assistant" ? (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-purple-500/20 border border-[rgba(0,212,255,0.2)] flex items-center justify-center">
                      <Bot size={14} className="text-[#00D4FF]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
                      <User size={14} className="text-cyan-400" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[#00D4FF] to-[#0099CC] text-[#0A0E1A] rounded-tr-md"
                      : "bg-[#151D30] text-gray-200 rounded-tl-md border border-[rgba(0,212,255,0.08)]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.message}</Streamdown>
                  ) : (
                    msg.message
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-purple-500/20 border border-[rgba(0,212,255,0.2)] flex items-center justify-center">
                    <Bot size={14} className="text-[#00D4FF]" />
                  </div>
                </div>
                <div className="bg-[#151D30] border border-[rgba(0,212,255,0.08)] px-4 py-3 rounded-2xl rounded-tl-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] text-gray-500 ml-1">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/30 flex items-center justify-center hover:bg-[#00D4FF]/30 transition-colors animate-bounce"
            >
              <ChevronDown size={16} className="text-[#00D4FF]" />
            </button>
          )}

          {/* ── Lead Form with Consent ─────────────────────────────────────── */}
          {showLeadForm && (
            <div className="border-t border-[rgba(0,212,255,0.15)] p-4 space-y-3 bg-[#0D1525] flex-shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-[#00D4FF]" />
                <p className="text-sm text-white font-medium">Connect with our team</p>
              </div>
              <p className="text-xs text-gray-400">Share your details so a specialist can reach you.</p>

              {/* Honeypot fields - hidden from real users, bots fill them */}
              <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
                <input type="text" name="fax_number" tabIndex={-1} autoComplete="off" />
                <input type="text" name="middle_name" tabIndex={-1} autoComplete="off" />
              </div>

              {/* Name */}
              <input
                type="text"
                placeholder="Your name *"
                value={visitorInfo.name}
                onChange={(e) => setVisitorInfo((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-[#151D30] border border-[rgba(0,212,255,0.15)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]/30 transition-all"
              />
              {/* Email */}
              <input
                type="email"
                placeholder="Email address *"
                value={visitorInfo.email}
                onChange={(e) => setVisitorInfo((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 bg-[#151D30] border border-[rgba(0,212,255,0.15)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]/30 transition-all"
              />
              {/* Phone */}
              <input
                type="tel"
                placeholder="Phone number"
                value={visitorInfo.phone}
                onChange={(e) => setVisitorInfo((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 bg-[#151D30] border border-[rgba(0,212,255,0.15)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]/30 transition-all"
              />
              {/* Company */}
              <input
                type="text"
                placeholder="Company name"
                value={visitorInfo.company}
                onChange={(e) => setVisitorInfo((prev) => ({ ...prev, company: e.target.value }))}
                className="w-full px-3 py-2 bg-[#151D30] border border-[rgba(0,212,255,0.15)] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]/30 transition-all"
              />

              {/* ── Consent Checkboxes ─────────────────────────────────────── */}
              <div className="space-y-2 pt-1">
                <p className="text-xs text-gray-400 font-medium">How may we contact you? *</p>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consent.email}
                    onChange={(e) => setConsent((prev) => ({ ...prev, email: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-600 bg-[#151D30] text-[#00D4FF] focus:ring-[#00D4FF]/30 focus:ring-offset-0 cursor-pointer accent-[#00D4FF]"
                  />
                  <Mail size={14} className="text-gray-400 group-hover:text-[#00D4FF] transition-colors" />
                  <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                    Email me
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consent.phone}
                    onChange={(e) => setConsent((prev) => ({ ...prev, phone: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-600 bg-[#151D30] text-[#00D4FF] focus:ring-[#00D4FF]/30 focus:ring-offset-0 cursor-pointer accent-[#00D4FF]"
                  />
                  <Phone size={14} className="text-gray-400 group-hover:text-[#00D4FF] transition-colors" />
                  <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                    Call me
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consent.text}
                    onChange={(e) => setConsent((prev) => ({ ...prev, text: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-600 bg-[#151D30] text-[#00D4FF] focus:ring-[#00D4FF]/30 focus:ring-offset-0 cursor-pointer accent-[#00D4FF]"
                  />
                  <MessageSquare size={14} className="text-gray-400 group-hover:text-[#00D4FF] transition-colors" />
                  <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                    Text / SMS me
                  </span>
                </label>
              </div>

              <p className="text-[10px] text-gray-500 leading-relaxed">
                By submitting, you agree to be contacted via your selected methods regarding your inquiry.
                We respect your privacy and will not share your information.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 border border-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCaptureLead}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#0A0E1A] rounded-lg text-xs font-semibold hover:shadow-lg hover:shadow-[#00D4FF]/20 transition-all"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {/* ── Input Area ─────────────────────────────────────────────────── */}
          {!showLeadForm && (
            <div className="border-t border-[rgba(0,212,255,0.1)] p-3 bg-[#0D1525] md:rounded-b-2xl flex-shrink-0">
              {/* Back to Menu - prominent standalone button */}
              {hasInteracted && messages.length > 0 && !isLoading && !showMenu && (
                <div className="mb-2 space-y-2">
                  {/* Large Menu Button */}
                  <button
                    onClick={handleBackToMenu}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF]/15 to-purple-500/15 border border-[#00D4FF]/30 hover:border-[#00D4FF]/60 hover:from-[#00D4FF]/25 hover:to-purple-500/25 active:scale-[0.98] transition-all duration-200"
                    title="Back to main menu"
                  >
                    <Home size={16} className="text-[#00D4FF]" />
                    <span className="text-sm font-semibold text-[#00D4FF]">Back to Menu</span>
                  </button>

                  {/* Quick reply chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                      onClick={() => sendQuickMessage("Tell me about your pricing")}
                      className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-[#151D30] text-gray-400 border border-[rgba(0,212,255,0.1)] hover:border-[#00D4FF]/30 hover:text-[#00D4FF] transition-colors"
                    >
                      Pricing
                    </button>
                    <button
                      onClick={() => sendQuickMessage("I'd like to schedule a consultation")}
                      className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-[#151D30] text-gray-400 border border-[rgba(0,212,255,0.1)] hover:border-[#00D4FF]/30 hover:text-[#00D4FF] transition-colors"
                    >
                      Schedule Call
                    </button>
                    <button
                      onClick={() => handleEscalate("User wants to talk to support")}
                      className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-[#151D30] text-gray-400 border border-[rgba(0,212,255,0.1)] hover:border-[#00D4FF]/30 hover:text-[#00D4FF] transition-colors"
                    >
                      Talk to Human
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask anything about our services..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-[#151D30] border border-[rgba(0,212,255,0.12)] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]/40 focus:ring-1 focus:ring-[#00D4FF]/20 disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#0A0E1A] hover:shadow-lg hover:shadow-[#00D4FF]/30 disabled:opacity-30 disabled:shadow-none transition-all"
                >
                  <Send size={16} />
                </button>
              </div>

              {/* Powered by badge */}
              <div className="flex items-center justify-start gap-1 mt-2">
                <span className="text-[10px] text-gray-600">Powered by</span>
                <span className="text-[10px] text-gray-500 font-semibold">GigitekAI</span>
                <Sparkles size={10} className="text-gray-600" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
