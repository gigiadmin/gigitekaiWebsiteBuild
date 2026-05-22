import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import HelpdeskNav from "@/components/HelpdeskNav";
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  PlusCircle,
  ChevronRight,
  ArrowUpRight,
  CircleDot,
} from "lucide-react";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "critical";

export default function HelpdeskDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword");

  const { data: tickets, isLoading } = trpc.helpdesk.getMyTickets.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, navigate]);


  // Semantic search scoring
  const scoreSemanticMatch = (query: string, title: string, description: string) => {
    if (!query) return 1;
    const q = query.toLowerCase();
    const t = title.toLowerCase();
    const d = description.toLowerCase();
    
    let score = 0;
    // Exact phrase match (highest priority)
    if (t.includes(q) || d.includes(q)) score += 100;
    // Title word matches
    const titleWords = t.split(/\s+/);
    const queryWords = q.split(/\s+/);
    const titleMatches = queryWords.filter(w => titleWords.some(tw => tw.includes(w))).length;
    score += titleMatches * 30;
    // Description word matches
    const descWords = d.split(/\s+/);
    const descMatches = queryWords.filter(w => descWords.some(dw => dw.includes(w))).length;
    score += descMatches * 10;
    // Partial word matches
    const partialMatches = queryWords.filter(w => t.includes(w) || d.includes(w)).length;
    score += partialMatches * 5;
    
    return score;
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    let results = tickets.filter((t: any) => {
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });

    if (searchQuery !== "") {
      if (searchMode === "semantic") {
        // Semantic search: score and sort by relevance
        results = results
          .map((t: any) => ({
            ...t,
            score: scoreSemanticMatch(searchQuery, t.title, t.description),
          }))
          .filter((t: any) => t.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .map(({ score, ...t }: any) => t);
      } else {
        // Keyword search: simple substring matching
        results = results.filter((t: any) => {
          const matchesSearch =
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesSearch;
        });
      }
    }

    return results;
  }, [tickets, searchQuery, statusFilter, priorityFilter, searchMode]);

  // Stats
  const stats = useMemo(() => {
    if (!tickets) return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
    return {
      total: tickets.length,
      open: tickets.filter((t: any) => t.status === "open").length,
      inProgress: tickets.filter((t: any) => t.status === "in_progress").length,
      resolved: tickets.filter((t: any) => t.status === "resolved").length,
      closed: tickets.filter((t: any) => t.status === "closed").length,
    };
  }, [tickets]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
      open: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: <CircleDot className="w-3 h-3" />, label: "Open" },
      in_progress: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: <Loader2 className="w-3 h-3" />, label: "In Progress" },
      resolved: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: <CheckCircle2 className="w-3 h-3" />, label: "Resolved" },
      closed: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", icon: <CheckCircle2 className="w-3 h-3" />, label: "Closed" },
    };
    return configs[status] || configs.closed;
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { dot: string; text: string; label: string; border: string }> = {
      low: { dot: "bg-green-500", text: "text-green-400", label: "Low", border: "border-l-4 border-l-green-500" },
      medium: { dot: "bg-yellow-500", text: "text-yellow-400", label: "Medium", border: "border-l-4 border-l-yellow-500" },
      high: { dot: "bg-orange-500", text: "text-orange-400", label: "High", border: "border-l-4 border-l-orange-500" },
      critical: { dot: "bg-red-500", text: "text-red-400", label: "Critical", border: "border-l-4 border-l-red-500" },
    };
    return configs[priority] || configs.medium;
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      bug_report: "🐛 Bug Report",
      feature_request: "✨ Feature Request",
      general_support: "💬 General Support",
      billing: "💳 Billing",
    };
    return labels[category] || "General Support";
  };

  const getSLAStatus = (priority: string, createdAt: Date | string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    const slaHours: Record<string, number> = {
      critical: 1,
      high: 4,
      medium: 8,
      low: 24,
    };

    const slaLimit = slaHours[priority] || 8;
    const percentageUsed = (hoursElapsed / slaLimit) * 100;

    if (percentageUsed >= 100) {
      return { status: "breached", color: "text-red-400", icon: "⚠️" };
    } else if (percentageUsed >= 75) {
      return { status: "critical", color: "text-orange-400", icon: "⏰" };
    } else if (percentageUsed >= 50) {
      return { status: "warning", color: "text-yellow-400", icon: "⏳" };
    } else {
      return { status: "healthy", color: "text-green-400", icon: "✓" };
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]">
      <HelpdeskNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Welcome back, {user?.name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-gray-400 text-sm">Manage and track your support requests</p>
          </div>
          <Button
            onClick={() => navigate("/helpdesk/tickets/new")}
            className="bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold rounded-xl shadow-lg shadow-[#00D4FF]/15 hover:shadow-[#00D4FF]/30 transition-[opacity,transform]"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <StatCard label="Total" value={stats.total} icon={<Ticket className="w-5 h-5" />} color="text-white" bgColor="bg-white/5" borderColor="border-white/10" onClick={() => setStatusFilter("all")} active={statusFilter === "all"} />
          <StatCard label="Open" value={stats.open} icon={<CircleDot className="w-5 h-5" />} color="text-blue-400" bgColor="bg-blue-500/5" borderColor="border-blue-500/15" onClick={() => setStatusFilter("open")} active={statusFilter === "open"} />
          <StatCard label="In Progress" value={stats.inProgress} icon={<Clock className="w-5 h-5" />} color="text-amber-400" bgColor="bg-amber-500/5" borderColor="border-amber-500/15" onClick={() => setStatusFilter("in_progress")} active={statusFilter === "in_progress"} />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5" />} color="text-emerald-400" bgColor="bg-emerald-500/5" borderColor="border-emerald-500/15" onClick={() => setStatusFilter("resolved")} active={statusFilter === "resolved"} />
          <StatCard label="Closed" value={stats.closed} icon={<AlertCircle className="w-5 h-5" />} color="text-gray-400" bgColor="bg-gray-500/5" borderColor="border-gray-500/15" onClick={() => setStatusFilter("closed")} active={statusFilter === "closed"} />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={searchMode === "semantic" ? "Describe your issue (e.g., 'email not working on my computer')..." : "Search tickets by title or description..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141B2D] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-[opacity,transform]"
            />
          </div>
          <button
            onClick={() => setSearchMode(searchMode === "keyword" ? "semantic" : "keyword")}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-[opacity,transform] ${
              searchMode === "semantic"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "bg-gray-800/50 text-gray-400 border border-gray-700/50"
            }`}
            title={searchMode === "semantic" ? "Switch to keyword search" : "Switch to semantic search"}
          >
            {searchMode === "semantic" ? "🧠 Smart" : "🔍 Keyword"}
          </button>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:border-[#00D4FF]/50 focus:outline-none transition-[opacity,transform] min-w-[140px]"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your tickets...</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-3">
            {filteredTickets.map((ticket: any) => {
              const statusConfig = getStatusConfig(ticket.status);
              const priorityConfig = getPriorityConfig(ticket.priority);
              return (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/helpdesk/tickets/${ticket.id}`)}
                  className={`group bg-[#141B2D]/80 border border-gray-800/60 rounded-xl p-5 hover:border-[#00D4FF]/30 hover:bg-[#141B2D] transition-[opacity,transform] cursor-pointer border-l-4 ${getPriorityConfig(ticket.priority).border} ${
                    getSLAStatus(ticket.priority, ticket.createdAt).status === 'breached' ? 'border-l-red-500' :
                    getSLAStatus(ticket.priority, ticket.createdAt).status === 'critical' ? 'border-l-orange-500' :
                    getSLAStatus(ticket.priority, ticket.createdAt).status === 'warning' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-gray-500 text-xs font-mono">#{ticket.id}</span>
                        <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">{getCategoryLabel(ticket.category)}</span>
                        <span className={`text-xs font-semibold ${getSLAStatus(ticket.priority, ticket.createdAt).color}`}>
                          {getSLAStatus(ticket.priority, ticket.createdAt).icon} SLA
                        </span>
                        <h3 className="text-white font-semibold text-base group-hover:text-[#00D4FF] transition-colors truncate">
                          {ticket.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        {/* Priority indicator */}
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${priorityConfig.text}`}>
                          <span className={`w-2 h-2 rounded-full ${priorityConfig.dot}`}></span>
                          {priorityConfig.label}
                        </span>
                        {/* Category */}
                        <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded">
                          {ticket.category.replace(/_/g, " ")}
                        </span>
                        {/* Last Updated */}
                        <span className="text-xs text-gray-500">
                          Updated: {formatTimeAgo(ticket.updatedAt || ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#00D4FF] transition-colors flex-shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-12 text-center">
            <Search className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">No matching tickets</h3>
            <p className="text-gray-400 text-sm mb-4">Try adjusting your search or filters</p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); setPriorityFilter("all"); }}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-16 text-center">
            <div className="w-16 h-16 bg-[#00D4FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-8 h-8 text-[#00D4FF]" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              No tickets yet
            </h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Need help with something? Create your first support ticket and our team will get back to you promptly.
            </p>
            <Button
              onClick={() => navigate("/helpdesk/tickets/new")}
              className="bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold rounded-xl"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Your First Ticket
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, color, bgColor, borderColor, onClick, active
}: {
  label: string; value: number; icon: React.ReactNode; color: string; bgColor: string; borderColor: string; onClick: () => void; active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-[opacity,transform] ${
        active
          ? `${bgColor} ${borderColor} border-2 shadow-lg`
          : "bg-[#141B2D]/60 border-gray-800/40 hover:border-gray-700"
      }`}
    >
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </button>
  );
}
