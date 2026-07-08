/**
 * AriaWidget — Contextual Aria mini-chat widget for admin pages
 * Embeds a floating Aria assistant on any admin page with page-specific context
 */

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Brain, X, Send, Minimize2, Maximize2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AriaWidgetProps {
  /** Page context hint — tells Aria which page you're on */
  pageContext?: string;
  /** Pre-filled starter question */
  starterQuestion?: string;
  /** Position on screen */
  position?: "bottom-right" | "bottom-left";
}

interface Message {
  id: string;
  role: "user" | "aria";
  text: string;
  timestamp: Date;
}

export default function AriaWidget({
  pageContext = "admin",
  starterQuestion,
  position = "bottom-right",
}: AriaWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const askMutation = trpc.aria.askQuestion.useMutation({
    onSuccess: (data) => {
      const ariaMsg: Message = {
        id: Date.now().toString(),
        role: "aria",
        text: data.response || "I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, ariaMsg]);
      if (!isOpen || isMinimized) setHasUnread(true);
    },
    onError: () => {
      const errMsg: Message = {
        id: Date.now().toString(),
        role: "aria",
        text: "I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Auto-greet with page context on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = starterQuestion
        ? starterQuestion
        : `I'm on the ${pageContext} page. Give me a quick status summary relevant to this section.`;
      handleSend(greeting);
    }
  }, [isOpen]);

  const handleSend = (text?: string) => {
    const question = text || input.trim();
    if (!question) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Prepend page context to question
    const contextualQuestion = text
      ? question
      : `[Context: I am on the ${pageContext} admin page] ${question}`;

    askMutation.mutate({
      question: contextualQuestion,
    });
  };

  const positionClass = position === "bottom-right"
    ? "right-4 bottom-4"
    : "left-4 bottom-4";

  return (
    <div className={`fixed ${positionClass} z-50 flex flex-col items-end gap-2`}>
      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <div className="w-80 sm:w-96 bg-[#0A0E1A] border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-xs font-semibold text-cyan-300">Aria</span>
              <span className="text-xs text-slate-500">· {pageContext}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-72 min-h-32">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 text-xs py-4">
                Loading context...
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-500/20 text-cyan-100 rounded-br-sm"
                      : "bg-slate-800/80 text-slate-200 rounded-bl-sm border border-slate-700/50"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[10px] opacity-40 mt-1 block">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
            {askMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 border border-slate-700/50 px-3 py-2 rounded-lg rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-cyan-500/20 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask Aria..."
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || askMutation.isPending}
              className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Minimized bar */}
      {isOpen && isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 bg-[#0A0E1A] border border-cyan-500/30 rounded-xl cursor-pointer hover:border-cyan-500/60 transition-colors shadow-lg"
        >
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-cyan-300 font-medium">Aria</span>
          {hasUnread && (
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          )}
        </div>
      )}

      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:scale-105 transition-transform"
          title="Ask Aria"
        >
          <Brain className="w-5 h-5 text-white" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0A0E1A]" />
          )}
        </button>
      )}
    </div>
  );
}
