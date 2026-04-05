import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; message: string }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState({ name: "", email: "", company: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session
  const getOrCreateSession = trpc.aibot.getOrCreateSession.useMutation();
  const sendMessage = trpc.aibot.sendMessage.useMutation();
  const escalate = trpc.aibot.escalateToHelpDesk.useMutation();
  const captureLead = trpc.aibot.captureLead.useMutation();
  const { data: historyData } = trpc.aibot.getHistory.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

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
  }, [isOpen, sessionId, getOrCreateSession]);

  useEffect(() => {
    if (historyData?.messages) {
      setMessages(historyData.messages);
    }
  }, [historyData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuickMessage = async (quickMessage: string) => {
    if (!sessionId) return;
    setMessages(prev => [...prev, { role: "user", message: quickMessage }]);
    setIsLoading(true);
    try {
      const response = await sendMessage.mutateAsync({
        sessionId,
        message: quickMessage,
      });
      setMessages(prev => [...prev, { role: "assistant", message: response.message }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const userMessage = inputValue;
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", message: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendMessage.mutateAsync({
        sessionId,
        message: userMessage,
      });

      setMessages(prev => [...prev, { role: "assistant", message: response.message }]);

      // Check if escalation is needed
      if (response.shouldEscalate && response.messageCount && response.messageCount > 2) {
        setTimeout(() => {
          toast.info("Our support team is ready", {
            description: "Would you like to speak with a specialist?",
            action: {
              label: "Yes, escalate",
              onClick: () => handleEscalate("User requested escalation"),
            },
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async (reason: string) => {
    if (!sessionId) return;

    try {
      await escalate.mutateAsync({
        sessionId,
        reason,
        priority: "medium",
      });

      toast.success("Escalated to support team", {
        description: "A specialist will contact you shortly.",
      });

      setShowLeadForm(true);
    } catch (error) {
      console.error("Failed to escalate:", error);
      toast.error("Failed to escalate. Please try again.");
    }
  };

  const handleCaptureLead = async () => {
    if (!visitorInfo.name || !visitorInfo.email || !sessionId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await captureLead.mutateAsync({
        sessionId,
        name: visitorInfo.name,
        email: visitorInfo.email,
        company: visitorInfo.company,
        interest: "Support escalation",
      });

      toast.success("Thank you!", {
        description: "We'll follow up with you shortly.",
      });

      setShowLeadForm(false);
      setVisitorInfo({ name: "", email: "", company: "" });
    } catch (error) {
      console.error("Failed to capture lead:", error);
      toast.error("Failed to save information. Please try again.");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowLeadForm(false);
  };

  return (
    <>
      {/* Chat Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#00D4FF] text-[#0A0E1A] rounded-full shadow-lg shadow-[#00D4FF]/30 hover:shadow-xl hover:shadow-[#00D4FF]/50 transition-all flex items-center justify-center hover:scale-110"
        title="Chat with GigitekAI Support"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window - Mobile Responsive */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:inset-auto md:bottom-24 md:right-6 md:w-96 bg-[#0F1629] md:border md:border-[rgba(0,212,255,0.2)] md:rounded-lg shadow-2xl shadow-black/50 flex flex-col md:max-h-[600px] h-full md:h-auto">
          {/* Header with Close Button */}
          <div className="bg-gradient-to-r from-[#00D4FF]/20 to-[#00D4FF]/10 border-b border-[rgba(0,212,255,0.2)] p-4 md:rounded-t-lg flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00D4FF] rounded-full animate-pulse flex-shrink-0" />
                GigitekAI Support
              </h3>
              <p className="text-xs text-gray-400 mt-1">Ask about Microsoft 365, cloud services, or pricing</p>
            </div>
            {/* Close Button - Large and prominent on mobile */}
            <button
              onClick={handleClose}
              className="ml-3 p-2.5 md:p-1.5 bg-white/10 hover:bg-white/20 md:bg-transparent md:hover:bg-[rgba(0,212,255,0.1)] rounded-xl md:rounded-lg transition-colors flex-shrink-0"
              title="Close chat"
              aria-label="Close chat"
            >
              <X size={24} className="text-white md:w-5 md:h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-4">
                <p className="mb-3">👋 Hi! How can we help you today?</p>
                <div className="space-y-2">
                  <button
                    onClick={() => sendQuickMessage("Tell me about Microsoft 365")}
                    className="w-full px-3 py-2 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[rgba(0,212,255,0.2)] rounded text-xs text-[#00D4FF] transition-colors"
                  >
                    Microsoft 365 Info
                  </button>
                  <button
                    onClick={() => sendQuickMessage("What pricing do you offer?")}
                    className="w-full px-3 py-2 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[rgba(0,212,255,0.2)] rounded text-xs text-[#00D4FF] transition-colors"
                  >
                    Pricing & Plans
                  </button>
                  <button
                    onClick={() => handleEscalate("User wants to talk to support")}
                    className="w-full px-3 py-2 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[rgba(0,212,255,0.2)] rounded text-xs text-[#00D4FF] transition-colors"
                  >
                    Talk to Support
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-[#00D4FF] text-[#0A0E1A] rounded-br-none"
                      : "bg-[#1A2A3A] text-gray-200 rounded-bl-none border border-[rgba(0,212,255,0.1)]"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1A2A3A] text-gray-200 px-3 py-2 rounded-lg rounded-bl-none border border-[rgba(0,212,255,0.1)]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Lead Form */}
          {showLeadForm && (
            <div className="border-t border-[rgba(0,212,255,0.2)] p-3 space-y-2">
              <p className="text-xs text-gray-300">Before we connect you with a specialist:</p>
              <input
                type="text"
                placeholder="Your name"
                value={visitorInfo.name}
                onChange={(e) => setVisitorInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-2 py-1 bg-[#1A2A3A] border border-[rgba(0,212,255,0.2)] rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
              />
              <input
                type="email"
                placeholder="Your email"
                value={visitorInfo.email}
                onChange={(e) => setVisitorInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-2 py-1 bg-[#1A2A3A] border border-[rgba(0,212,255,0.2)] rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
              />
              <input
                type="text"
                placeholder="Company (optional)"
                value={visitorInfo.company}
                onChange={(e) => setVisitorInfo(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-2 py-1 bg-[#1A2A3A] border border-[rgba(0,212,255,0.2)] rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
              />
              <button
                onClick={handleCaptureLead}
                className="w-full px-2 py-1 bg-[#00D4FF] text-[#0A0E1A] rounded text-xs font-semibold hover:bg-[#00D4FF]/90 transition-colors"
              >
                Connect with Support
              </button>
            </div>
          )}

          {/* Input */}
          {!showLeadForm && (
            <div className="border-t border-[rgba(0,212,255,0.2)] p-3 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-[#1A2A3A] border border-[rgba(0,212,255,0.2)] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-3 py-2 bg-[#00D4FF] text-[#0A0E1A] rounded hover:bg-[#00D4FF]/90 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
