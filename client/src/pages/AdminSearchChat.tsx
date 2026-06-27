/**
 * ARIA Command Intelligence — Master AI Operations Brain
 * Premium redesign with live stats, suggested queries, and full-width chat
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Trash2, Download, Zap, Activity, Ticket, BookOpen, Users, Phone, Globe, FileText, ChevronRight, Bot, User, RefreshCw } from "lucide-react";
import { Streamdown } from "@/components/GigitekMarkdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  timestamp: Date;
  stats?: Record<string, any>;
}

const SUGGESTED_QUERIES = [
  { icon: "🎫", label: "Open tickets", query: "How many open tickets do we have right now? Show me a breakdown by priority." },
  { icon: "📊", label: "System status", query: "Give me a full system status report including website uptime and ticket summary." },
  { icon: "📬", label: "New leads", query: "How many new leads and contact submissions came in this week?" },
  { icon: "🔴", label: "Critical issues", query: "Show me all critical and high priority open tickets." },
  { icon: "📚", label: "KB articles", query: "How many knowledge base articles do we have? What are the most recent ones?" },
  { icon: "📈", label: "Resolution rate", query: "What is our current ticket resolution rate and overall helpdesk performance?" },
  { icon: "🏢", label: "Client list", query: "Show me our current client roster and their service tiers." },
  { icon: "📞", label: "Call logs", query: "How many calls have we handled in the last 30 days?" },
];

const SCOPE_OPTIONS = [
  { key: "tickets", label: "Tickets", icon: Ticket, color: "text-cyan-400" },
  { key: "kb", label: "Knowledge Base", icon: BookOpen, color: "text-blue-400" },
  { key: "leads", label: "Leads", icon: Users, color: "text-green-400" },
  { key: "system", label: "Uptime", icon: Globe, color: "text-yellow-400" },
  { key: "customers", label: "Clients", icon: Users, color: "text-purple-400" },
  { key: "calls", label: "Calls", icon: Phone, color: "text-orange-400" },
  { key: "blog", label: "Blog", icon: FileText, color: "text-pink-400" },
];

export default function AdminSearchChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<"claude" | "manus" | "gemini">("claude");
  const [scope, setScope] = useState({
    kb: true,
    tickets: true,
    system: true,
    docs: false,
    customers: true,
    leads: true,
    calls: false,
    blog: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const searchMutation = trpc.adminSearch.search.useMutation();
  const modelsQuery = trpc.adminSearch.getModels.useQuery();
  const quickStatsQuery = trpc.adminSearch.getQuickStats.useQuery(undefined, {
    refetchInterval: 60000, // refresh every minute
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingPhase]);

  // Cycle through loading phases for smooth animation
  useEffect(() => {
    if (isLoading) {
      setLoadingPhase(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % 4);
      }, 1800);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      setLoadingPhase(0);
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [isLoading]);

  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery ?? query;
    if (!q.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const result = await searchMutation.mutateAsync({
        query: q,
        model: selectedModel,
        scope,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: typeof result.answer === "string" ? result.answer : JSON.stringify(result.answer),
        model: selectedModel,
        timestamp: new Date(),
        stats: result.stats,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ **Error:** ${error instanceof Error ? error.message : "Request failed. Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = () => setMessages([]);

  const handleSaveChat = () => {
    const chatContent = messages.map((m) => `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`).join("\n\n---\n\n");
    const element = document.createElement("a");
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(chatContent)}`);
    element.setAttribute("download", `aria-session-${new Date().toISOString().split("T")[0]}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const stats = quickStatsQuery.data;

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ARIA Command Intelligence</h1>
              <p className="text-xs text-cyan-400/80">Master AI Operations Brain · Live Data Access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => quickStatsQuery.refetch()} className="text-white/50 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Live Stats Bar ── */}
      {stats && (
        <div className="border-b border-white/5 bg-[#0d1220]/60 px-6 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Open Tickets", value: stats.openTickets, color: "text-cyan-400", icon: "🎫" },
              { label: "Critical", value: stats.criticalTickets, color: "text-red-400", icon: "🔴" },
              { label: "Total Tickets", value: stats.totalTickets, color: "text-blue-400", icon: "📋" },
              { label: "Resolution Rate", value: `${stats.resolutionRate}%`, color: "text-green-400", icon: "✅" },
              { label: "KB Articles", value: stats.kbArticles, color: "text-purple-400", icon: "📚" },
              { label: "New Leads (7d)", value: stats.newLeads, color: "text-yellow-400", icon: "📬" },
              { label: "Resolved", value: stats.resolvedTickets, color: "text-emerald-400", icon: "🏆" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                <span className="text-xs text-white/40 mb-0.5">{stat.label}</span>
                <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 lg:px-6 py-4 lg:gap-4 gap-0" style={{ minHeight: 0 }}>
        {/* ── Left Sidebar ── */}
        <div className="w-full lg:w-64 lg:flex-shrink-0 flex flex-col gap-4 mb-4 lg:mb-0">
          {/* Model Selection */}
          <div className="bg-[#0d1220] border border-white/10 rounded-xl p-4">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 block">AI Model</label>
            <div className="space-y-1.5">
              {(modelsQuery.data ?? [{ id: "claude", name: "Claude" }, { id: "manus", name: "Manus LLM" }, { id: "gemini", name: "Gemini" }]).map((model: any) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedModel === model.id
                      ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                      : "text-white/60 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedModel === model.id ? "bg-cyan-400" : "bg-white/20"}`} />
                    {model.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Data Scope */}
          <div className="bg-[#0d1220] border border-white/10 rounded-xl p-4">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 block">Data Scope</label>
            <div className="space-y-1.5">
              {SCOPE_OPTIONS.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setScope((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    scope[key as keyof typeof scope]
                      ? "bg-white/8 border border-white/15 text-white"
                      : "text-white/30 border border-transparent hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${scope[key as keyof typeof scope] ? color : "text-white/20"}`} />
                  {label}
                  {scope[key as keyof typeof scope] && (
                    <div className={`ml-auto w-1.5 h-1.5 rounded-full ${color.replace("text-", "bg-")}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-[#0d1220] border border-white/10 rounded-xl p-4 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveChat}
              disabled={messages.length === 0}
              className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5 text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Export Session
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="w-full justify-start text-white/50 hover:text-red-400 hover:bg-red-500/5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Clear Chat
            </Button>
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className="flex-1 flex flex-col min-h-0 h-full lg:min-h-screen bg-[#0d1220] border border-white/10 rounded-xl overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                {/* Welcome state */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">ARIA is ready</h2>
                <p className="text-white/40 text-sm mb-8 text-center max-w-sm">
                  Ask anything about your helpdesk, clients, leads, uptime, or knowledge base. I have live access to all your systems.
                </p>
                {/* Suggested queries */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-2xl">
                  {SUGGESTED_QUERIES.map((sq) => (
                    <button
                      key={sq.label}
                      onClick={() => handleSearch(sq.query)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left group"
                    >
                      <span className="text-lg">{sq.icon}</span>
                      <span className="text-sm text-white/70 group-hover:text-white transition-colors">{sq.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 ml-auto group-hover:text-cyan-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-cyan-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-cyan-500/20 border border-cyan-500/30 text-white rounded-tr-sm"
                          : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                        <span className="text-xs text-white/25">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {message.model && (
                          <span className="text-xs text-cyan-400/50 ml-auto">via {message.model}</span>
                        )}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-4 min-w-[280px]">
                      {/* Typing dots */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm text-white/50 font-medium">ARIA is thinking</span>
                      </div>
                      {/* Progress steps */}
                      <div className="space-y-1.5">
                        {[
                          { label: "Connecting to live systems", icon: "🔌" },
                          { label: "Querying databases", icon: "🗄️" },
                          { label: "Analyzing data", icon: "📊" },
                          { label: "Composing response", icon: "✍️" },
                        ].map((step, idx) => (
                          <div
                            key={step.label}
                            className={`flex items-center gap-2 text-xs transition-all duration-500 ${
                              idx < loadingPhase
                                ? "text-green-400/80"
                                : idx === loadingPhase
                                ? "text-cyan-400"
                                : "text-white/20"
                            }`}
                          >
                            <span className="w-4 text-center">
                              {idx < loadingPhase ? "✓" : idx === loadingPhase ? step.icon : "○"}
                            </span>
                            <span>{step.label}</span>
                            {idx === loadingPhase && (
                              <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Bar */}
          <div className="flex-shrink-0 border-t border-white/10 p-3 lg:p-4 bg-[#080c14]/50">
            {/* Quick suggestions (when chat is active) */}
            {messages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {SUGGESTED_QUERIES.slice(0, 4).map((sq) => (
                  <button
                    key={sq.label}
                    onClick={() => handleSearch(sq.query)}
                    disabled={isLoading}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-xs text-white/50 hover:text-white"
                  >
                    <span>{sq.icon}</span>
                    {sq.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask ARIA anything — tickets, uptime, clients, leads..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                disabled={isLoading}
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all"
              />
              <Button
                onClick={() => handleSearch()}
                disabled={isLoading || !query.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 rounded-xl px-4 shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
