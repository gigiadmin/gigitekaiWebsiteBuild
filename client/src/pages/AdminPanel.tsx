import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "sonner";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Eye,
  Filter,
  Loader2,
  PauseCircle,
  RotateCcw,
  Search,
  Ticket,
  TrendingUp,
  Users,
  Zap,
  ShieldCheck,
  ShieldX,
  UserCheck,
  UserX,
  Download,
  Mail,
  StickyNote,
  History,
  XCircle,
  PlayCircle,
  UserPlus,
  BellOff,
  Video,
  Cloud,
  Star,
  Plus,
  Sparkles,
  X,
  Trash2,
} from "lucide-react";
import { exportTicketsToCSV, exportUsersToCSV } from "@/lib/exportUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

import { InviteCustomerModal } from "@/components/InviteCustomerModal";
import QuickReplyModal from "@/components/QuickReplyModal";
import { BulkTicketActions } from "@/components/BulkTicketActions";
import { TicketTemplateManager } from "@/components/TicketTemplateManager";
import { SLATimer } from "@/components/SLATimer";
import { AgentAssignmentModal } from "@/components/AgentAssignmentModal";
import CloseTicketDialog from "@/components/CloseTicketDialog";
import EscalateToMeetingDialog from "@/components/EscalateToMeetingDialog";
import { SurveyAnalyticsDashboard } from "@/components/SurveyAnalyticsDashboard";
import { AgentWorkloadOptimizer } from "@/components/AgentWorkloadOptimizer";
import AdminM365Health from "./AdminM365Health";
import AdminServiceHealthMonitoring from "./AdminServiceHealthMonitoring";
import CreateTicketModal from "@/components/CreateTicketModal";

type AdminTab = "tickets" | "users";

export default function AdminPanel() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<AdminTab>("tickets");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [quickReplyTicketId, setQuickReplyTicketId] = useState<number | undefined>();
  const [quickReplyEmail, setQuickReplyEmail] = useState("");
  const [quickReplyName, setQuickReplyName] = useState("");
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
  const [customerEmailFilter, setCustomerEmailFilter] = useState<string>("");
  const [filterPresets, setFilterPresets] = useState<Array<{ name: string; filters: any }>>([]);
  const [presetName, setPresetName] = useState<string>("");
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTicketId, setAssignTicketId] = useState<number | null>(null);
  const [assignAgentId, setAssignAgentId] = useState<string>("");
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentModalTicketId, setAssignmentModalTicketId] = useState<number | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeDialogTicket, setCloseDialogTicket] = useState<{ id: number; title: string; status: string } | null>(null);
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [escalateTicket, setEscalateTicket] = useState<{ id: number; title: string } | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState<number | null>(null);
  const [expandedTicketIds, setExpandedTicketIds] = useState<Set<number>>(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const ticketScrollRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef(0);

  function toggleTicketExpanded(id: number) {
    const next = new Set(expandedTicketIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedTicketIds(next);
  }

  const { data: allTickets, isLoading, refetch } = trpc.helpdesk.getAllTickets.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: allUsers, isLoading: usersLoading, refetch: refetchUsers } = trpc.users.getAll.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === "users",
  });

  // All admin/tech users for assign modal (always loaded for tickets tab)
  const { data: allAdminUsers } = trpc.users.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Agent workload for smart suggestion in assign modal
  const { data: agentWorkloads } = trpc.helpdesk.getAgentWorkload.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const approveMutation = trpc.users.approve.useMutation({
    onSuccess: () => {
      toast.success("User approved! They can now access the Support Center.");
      refetchUsers();
    },
    onError: (error: any) => toast.error(error.message || "Failed to approve user"),
  });

  const revokeMutation = trpc.users.revoke.useMutation({
    onSuccess: () => {
      toast.success("User access revoked.");
      refetchUsers();
    },
    onError: (error: any) => toast.error(error.message || "Failed to revoke user"),
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated!");
      refetchUsers();
    },
    onError: (error: any) => toast.error(error.message || "Failed to update user role"),
  });

  const bulkApproveMutation = trpc.users.bulkApprove.useMutation({
    onSuccess: () => {
      toast.success("Users approved!");
      setSelectedUserIds(new Set());
      refetchUsers();
    },
    onError: (error: any) => toast.error(error.message || "Failed to approve users"),
  });

  const bulkRevokeMutation = trpc.users.bulkRevoke.useMutation({
    onSuccess: () => {
      toast.success("Users revoked!");
      setSelectedUserIds(new Set());
      refetchUsers();
    },
    onError: (error: any) => toast.error(error.message || "Failed to revoke users"),
  });

  const bulkDeleteMutation = trpc.userAccountMgmt.bulkDeleteUsers.useMutation({
    onSuccess: () => {
      toast.success("Users deleted!");
      setSelectedUserIds(new Set());
      refetchUsers();
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete users"),
  });

  // adminCreateTicket is now handled by CreateTicketModal

  const snoozeSlaBreachMutation = trpc.helpdesk.snoozeSlaBreach.useMutation({
    onSuccess: (data) => {
      const until = new Date(data.snoozedUntil).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      toast.success(`SLA alert snoozed until ${until}`);
      setShowSnoozeMenu(null);
    },
    onError: (error: any) => toast.error(error.message || "Failed to snooze SLA alert"),
  });

  const assignTicketMutation = trpc.helpdesk.assignTicket.useMutation({
    onSuccess: (data) => {
      toast.success(`Ticket assigned successfully!`);
      refetch();
      setShowAssignModal(false);
      setAssignTicketId(null);
      setAssignAgentId("");
    },
    onError: (error: any) => toast.error(error.message || "Failed to assign ticket"),
  });

  const updateStatusMutation = trpc.helpdesk.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Ticket status updated!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    const saved = localStorage.getItem("ticket-filter-presets");
    if (saved) {
      try {
        setFilterPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load filter presets", e);
      }
    }
  }, []);

  const saveFilterPreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    const newPreset = {
      name: presetName,
      filters: {
        searchQuery,
        statusFilter,
        priorityFilter,
        dateRangeStart,
        dateRangeEnd,
        customerEmailFilter,
      },
    };
    const updated = [...filterPresets, newPreset];
    setFilterPresets(updated);
    localStorage.setItem("ticket-filter-presets", JSON.stringify(updated));
    setPresetName("");
    setShowPresetModal(false);
    toast.success(`Filter preset '${presetName}' saved!`);
  };

  const loadFilterPreset = (preset: any) => {
    setSearchQuery(preset.filters.searchQuery);
    setStatusFilter(preset.filters.statusFilter);
    setPriorityFilter(preset.filters.priorityFilter);
    setDateRangeStart(preset.filters.dateRangeStart);
    setDateRangeEnd(preset.filters.dateRangeEnd);
    setCustomerEmailFilter(preset.filters.customerEmailFilter);
    toast.success(`Loaded preset '${preset.name}'`);
  };

  const deleteFilterPreset = (name: string) => {
    const updated = filterPresets.filter((p) => p.name !== name);
    setFilterPresets(updated);
    localStorage.setItem("ticket-filter-presets", JSON.stringify(updated));
    toast.success(`Preset '${name}' deleted`);
  };

  // Pull-to-refresh for mobile tickets table
  useEffect(() => {
    const container = ticketScrollRef.current;
    if (!container) return;
    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) touchStartYRef.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (container.scrollTop === 0 && touchStartYRef.current > 0) {
        const diff = e.touches[0].clientY - touchStartYRef.current;
        if (diff > 80 && !isRefreshing) {
          setIsRefreshing(true);
          refetch().finally(() => { setIsRefreshing(false); touchStartYRef.current = 0; });
        }
      }
    };
    const handleTouchEnd = () => { touchStartYRef.current = 0; };
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);
    container.addEventListener("touchend", handleTouchEnd);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isRefreshing, refetch]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    if (!allTickets) return [];
    return allTickets.filter((t: any) => {
      const matchesSearch = searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `#${t.id}`.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      
      let matchesDateRange = true;
      if (dateRangeStart || dateRangeEnd) {
        const ticketDate = new Date(t.createdAt).getTime();
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart).getTime();
          if (ticketDate < startDate) matchesDateRange = false;
        }
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd).getTime() + 86400000;
          if (ticketDate > endDate) matchesDateRange = false;
        }
      }
      
      const matchesEmail = customerEmailFilter === "" ||
        t.customerEmail.toLowerCase().includes(customerEmailFilter.toLowerCase());
      
      return matchesSearch && matchesStatus && matchesPriority && matchesDateRange && matchesEmail;
    });
  }, [allTickets, searchQuery, statusFilter, priorityFilter, dateRangeStart, dateRangeEnd, customerEmailFilter]);

  // Select All logic
  const allTicketsSelected = filteredTickets && selectedTicketIds.length === filteredTickets.length && filteredTickets.length > 0;
  const someTicketsSelected = selectedTicketIds.length > 0 && selectedTicketIds.length < (filteredTickets?.length ?? 0);

  const toggleSelectAllTickets = () => {
    if (allTicketsSelected) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTickets?.map((t: any) => t.id) ?? []);
    }
  };

  // Stats
  const stats = useMemo(() => {
    if (!allTickets) return { total: 0, open: 0, inProgress: 0, onHold: 0, resolved: 0, closed: 0, critical: 0 };
    return {
      total: allTickets.length,
      open: allTickets.filter((t: any) => t.status === "open").length,
      inProgress: allTickets.filter((t: any) => t.status === "in_progress").length,
      onHold: allTickets.filter((t: any) => t.status === "on_hold").length,
      resolved: allTickets.filter((t: any) => t.status === "resolved").length,
      closed: allTickets.filter((t: any) => t.status === "closed").length,
      critical: allTickets.filter((t: any) => t.priority === "critical" && t.status !== "closed").length,
    };
  }, [allTickets]);

  const handleUpdateStatus = (ticketId: number, status: string) => {
    updateStatusMutation.mutate({ ticketId, status: status as any });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
      open: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: <CircleDot className="w-3 h-3" />, label: "Open" },
      in_progress: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: <Loader2 className="w-3 h-3" />, label: "In Progress" },
      on_hold: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", icon: <Clock className="w-3 h-3" />, label: "On Hold" },
      resolved: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: <CheckCircle2 className="w-3 h-3" />, label: "Resolved" },
      closed: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", icon: <CheckCircle2 className="w-3 h-3" />, label: "Closed" },
    };
    return configs[status] || configs.closed;
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { dot: string; text: string; label: string }> = {
      low: { dot: "bg-green-500", text: "text-green-400", label: "Low" },
      medium: { dot: "bg-yellow-500", text: "text-yellow-400", label: "Medium" },
      high: { dot: "bg-orange-500", text: "text-orange-400", label: "High" },
      critical: { dot: "bg-red-500", text: "text-red-400", label: "Critical" },
    };
    return configs[priority] || configs.medium;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Support Administration
            </h1>
            <p className="text-gray-400 text-sm">Manage all customer support tickets and user access</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400 hidden sm:block">
              <span className="text-[#00D4FF]">{user?.email}</span>
            </div>
            <button
              onClick={() => setShowCreateTicket(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00D4FF] hover:bg-[#00B8E0] text-black font-semibold text-sm rounded-xl transition-[opacity,transform] shadow-lg shadow-[#00D4FF]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ticket</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-[opacity,transform] ${
              activeTab === "tickets"
                ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Ticket className="w-4 h-4" />
            Tickets
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-[opacity,transform] ${
              activeTab === "users"
                ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            User Access
            {allUsers && allUsers.filter((u: any) => !u.approved && u.role !== "admin").length > 0 && (
              <span className="bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                {allUsers.filter((u: any) => !u.approved && u.role !== "admin").length}
              </span>
            )}
          </button>

        </div>

        {activeTab === "tickets" && (
        <>
        {/* Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          <MetricCard label="Total" value={stats.total} icon={<Ticket className="w-5 h-5" />} color="text-white" onClick={() => setStatusFilter("all")} active={statusFilter === "all"} />
          <MetricCard label="Open" value={stats.open} icon={<CircleDot className="w-5 h-5" />} color="text-blue-400" onClick={() => setStatusFilter("open")} active={statusFilter === "open"} />
          <MetricCard label="In Progress" value={stats.inProgress} icon={<Clock className="w-5 h-5" />} color="text-amber-400" onClick={() => setStatusFilter("in_progress")} active={statusFilter === "in_progress"} />
          <MetricCard label="On Hold" value={stats.onHold} icon={<PauseCircle className="w-5 h-5" />} color="text-purple-400" onClick={() => setStatusFilter("on_hold")} active={statusFilter === "on_hold"} />
          <MetricCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5" />} color="text-emerald-400" onClick={() => setStatusFilter("resolved")} active={statusFilter === "resolved"} />
          <MetricCard label="Closed" value={stats.closed} icon={<AlertCircle className="w-5 h-5" />} color="text-gray-400" onClick={() => setStatusFilter("closed")} active={statusFilter === "closed"} />
          <MetricCard label="Critical" value={stats.critical} icon={<Zap className="w-5 h-5" />} color="text-red-400" highlight onClick={() => { setStatusFilter("all"); setPriorityFilter("critical"); }} active={priorityFilter === "critical"} />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by ticket ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141B2D] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-[opacity,transform]"
              />
            </div>
            <input
              type="email"
              placeholder="Filter by customer email..."
              value={customerEmailFilter}
              onChange={(e) => setCustomerEmailFilter(e.target.value)}
              className="bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-[opacity,transform] min-w-[180px]"
            />
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
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              placeholder="Start date..."
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-[opacity,transform] min-w-[140px]"
            />
            <input
              type="date"
              placeholder="End date..."
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-[opacity,transform] min-w-[140px]"
            />
            <TicketTemplateManager />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPresetModal(true)}
              className="border-gray-700 text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 whitespace-nowrap"
            >
              💾 Save Filter
            </Button>
            {filterPresets.length > 0 && (
              <select
                onChange={(e) => {
                  const preset = filterPresets.find((p) => p.name === e.target.value);
                  if (preset) loadFilterPreset(preset);
                  e.target.value = "";
                }}
                className="bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:border-[#00D4FF]/50 focus:outline-none transition-[opacity,transform] min-w-[140px]"
              >
                <option value="">Load Preset...</option>
                {filterPresets.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {allTickets && allTickets.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportTicketsToCSV(allTickets)}
                className="border-gray-700 text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 whitespace-nowrap"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        <BulkTicketActions
          selectedTicketIds={selectedTicketIds}
          onSelectionChange={setSelectedTicketIds}
          onActionComplete={() => {
            refetch();
            setSelectedTicketIds([]);
          }}
        />

        {/* Tickets Table */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading tickets...</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl w-full overflow-x-auto">
            {/* Pull-to-refresh indicator */}
            {isRefreshing && (
              <div className="flex items-center justify-center gap-2 py-2 text-[#00D4FF] text-xs border-b border-gray-800/40">
                <Loader2 className="w-3 h-3 animate-spin" />
                Refreshing tickets...
              </div>
            )}
            {/* Table Wrapper with Horizontal Scroll */}
            <div className="w-full" ref={ticketScrollRef} style={{ maxHeight: "calc(100vh - 420px)", overflowY: "auto", overflowX: "auto" }}>
              {/* Table Header */}
              <div className="hidden lg:grid gap-2 px-4 py-3 border-b border-gray-800/60 text-xs text-gray-500 font-semibold uppercase tracking-wider w-full sticky top-0 bg-[#141B2D]/80 z-10" style={{ gridTemplateColumns: 'auto 60px 1fr 100px 100px 100px 100px 100px auto' }}>
                <input
                  type="checkbox"
                  checked={allTicketsSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someTicketsSelected;
                  }}
                  onChange={toggleSelectAllTickets}
                  className="w-4 h-4 cursor-pointer"
                  title="Select all tickets"
                />
                <span>ID</span>
                <span>Title</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Category</span>
                <span>Created</span>
                <span>Agent</span>
                <span>Actions</span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-800/40 w-full">
                {filteredTickets.map((ticket: any) => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const priorityConfig = getPriorityConfig(ticket.priority);
                  return (
                    <div key={ticket.id} className={`w-full border-b border-gray-800/40 hover:bg-white/[0.02] transition-colors overflow-hidden relative ${selectedTicketIds.includes(ticket.id) ? 'bg-blue-900/20' : ''}`}>
                    {/* ===== MOBILE CARD LAYOUT (hidden on lg+) ===== */}
                    <div className="lg:hidden px-4 py-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedTicketIds.includes(ticket.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTicketIds([...selectedTicketIds, ticket.id]);
                              } else {
                                setSelectedTicketIds(selectedTicketIds.filter(id => id !== ticket.id));
                              }
                            }}
                            className="w-4 h-4 cursor-pointer flex-shrink-0"
                          />
                          <span className="text-gray-500 text-xs font-mono flex-shrink-0">#{ticket.id}</span>
                          <p className="text-white text-sm font-medium truncate">{ticket.title}</p>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          {statusConfig.icon}{statusConfig.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className={`inline-flex items-center gap-1 font-medium ${priorityConfig.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`}></span>
                          {priorityConfig.label}
                        </span>
                        <span className="text-gray-500 capitalize">{ticket.category.replace(/_/g, ' ')}</span>
                        <span className="text-gray-600">{new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          onClick={() => navigate(`/admin/helpdesk/${ticket.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 rounded-lg text-xs font-medium"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button
                          onClick={() => { setQuickReplyTicketId(ticket.id); setQuickReplyEmail(ticket.customerEmail); setQuickReplyName(ticket.customerName); setShowQuickReply(true); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg text-xs font-medium"
                        >
                          <Mail className="w-3 h-3" /> Reply
                        </button>
                        <button
                          onClick={() => { setAssignmentModalTicketId(ticket.id); setIsAssignmentModalOpen(true); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-medium"
                        >
                          <UserPlus className="w-3 h-3" /> Assign
                        </button>
                        {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                          <button
                            onClick={() => { setCloseDialogTicket({ id: ticket.id, title: ticket.title, status: ticket.status }); setCloseDialogOpen(true); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium"
                          >
                            <XCircle className="w-3 h-3" /> Close
                          </button>
                        )}
                        {(ticket.status === 'closed' || ticket.status === 'resolved') && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'open')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium"
                          >
                            <RotateCcw className="w-3 h-3" /> Reopen
                          </button>
                        )}
                      </div>
                    </div>
                    {/* ===== DESKTOP TABLE ROW (hidden on mobile/tablet) ===== */}
                    <div className="group hidden lg:grid gap-2 px-4 py-3 items-center w-full" style={{ gridTemplateColumns: 'auto 60px 1fr 100px 100px 100px 100px 100px auto' }}>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedTicketIds.includes(ticket.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTicketIds([...selectedTicketIds, ticket.id]);
                        } else {
                          setSelectedTicketIds(selectedTicketIds.filter(id => id !== ticket.id));
                        }
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    {/* ID */}
                    <span className="text-gray-500 text-sm font-mono">#{ticket.id}</span>

                    {/* Title */}
                    <div className="min-w-0 my-2 md:my-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-[#00D4FF] transition-colors">
                        {ticket.title}
                      </p>
                    </div>

                    {/* Status */}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border w-fit ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>

                    {/* Priority */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${priorityConfig.text}`}>
                      <span className={`w-2 h-2 rounded-full ${priorityConfig.dot}`}></span>
                      {priorityConfig.label}
                    </span>

                    {/* Category + AI Badge */}
                    <div className="min-w-0">
                      <span className="text-xs text-gray-500 capitalize block">
                        {ticket.category.replace(/_/g, " ")}
                      </span>
                      {ticket.aiCategory && (
                        <span
                          title={`AI: ${ticket.aiPriority} · ${ticket.aiCategory} (${Math.round(Number(ticket.aiConfidence) * 100)}% confidence)${ticket.aiReasoning ? `\n${ticket.aiReasoning}` : ""}`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 cursor-help mt-1"
                        >
                          🤖 {ticket.aiCategory}
                        </span>
                      )}
                    </div>

                    {/* Created */}
                    <span className="text-xs text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>

                    {/* Agent */}
                    <span className="text-xs">
                      {ticket.agentName ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {ticket.agentName}
                        </span>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </span>

                    {/* Actions - compact icon buttons + more dropdown */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/admin/helpdesk/${ticket.id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-colors"
                        title="View ticket"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setQuickReplyTicketId(ticket.id);
                          setQuickReplyEmail(ticket.customerEmail);
                          setQuickReplyName(ticket.customerName);
                          setShowQuickReply(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-colors"
                        title="Quick reply"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setAssignmentModalTicketId(ticket.id);
                          setIsAssignmentModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                        title="Assign to agent"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      {/* Context-aware status buttons - icon only */}
                      {(ticket.status === "closed" || ticket.status === "resolved") && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, "open")}
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Reopen ticket"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {(ticket.status === "open" || ticket.status === "in_progress") && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, "on_hold")}
                            className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors"
                            title="Put on hold"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCloseDialogTicket({ id: ticket.id, title: ticket.title, status: ticket.status });
                              setCloseDialogOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Close ticket"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEscalateTicket({ id: ticket.id, title: ticket.title });
                              setEscalateDialogOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            title="Escalate to Teams meeting"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {ticket.status === "on_hold" && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, "in_progress")}
                          className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"
                          title="Resume ticket"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    </div>{/* end main row */}

                    {/* Expandable detail panel — visible when expanded */}
                    {expandedTicketIds.has(ticket.id) && (
                      <div className="bg-gray-900/40 border-t border-gray-800/40 md:ml-[100px] px-5 py-3 space-y-2 text-xs relative z-0">
                        <div className="flex justify-between py-1 border-b border-gray-800/20">
                          <span className="text-gray-500">Priority</span>
                          <span className={`font-medium ${priorityConfig.text}`}>{priorityConfig.label}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-800/20">
                          <span className="text-gray-500">Category</span>
                          <span className="text-gray-300 capitalize">{ticket.category.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-800/20">
                          <span className="text-gray-500">Customer</span>
                          <span className="text-gray-300">{ticket.customerName || ticket.customerEmail}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-800/20">
                          <span className="text-gray-500">Created</span>
                          <span className="text-gray-300">{new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="pt-1">
                          <SLATimer priority={ticket.priority} createdAt={ticket.createdAt} status={ticket.status} />
                        </div>
                        {/* Mobile action buttons in the expanded panel */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            onClick={() => navigate(`/admin/helpdesk/${ticket.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 rounded-lg text-xs font-medium"
                          >
                            <Eye className="w-3 h-3" /> View Full Ticket
                          </button>
                          <button
                            onClick={() => { setQuickReplyTicketId(ticket.id); setQuickReplyEmail(ticket.customerEmail); setQuickReplyName(ticket.customerName); setShowQuickReply(true); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg text-xs font-medium"
                          >
                            <Mail className="w-3 h-3" /> Reply
                          </button>
                          {(ticket.status === "resolved" || ticket.status === "closed") && (
                            <button
                              onClick={() => navigate(`/admin/kb-generation?ticketId=${ticket.id}`)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 rounded-lg text-xs font-medium"
                            >
                              <Sparkles className="w-3 h-3" /> Generate KB
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table Footer */}
            <div className="px-5 py-3 border-t border-gray-800/60 flex items-center justify-between w-full">
              <span className="text-xs text-gray-500">
                Showing {filteredTickets.length} of {allTickets?.length || 0} tickets
              </span>
              {(searchQuery || statusFilter !== "all" || priorityFilter !== "all") && (
                <button
                  onClick={() => { setSearchQuery(""); setStatusFilter("all"); setPriorityFilter("all"); }}
                  className="text-xs text-[#00D4FF] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : allTickets && allTickets.length > 0 ? (
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-12 text-center">
            <Search className="w-10 h-10 text-gray-600 mx-auto mb-4" />
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
            <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              No tickets yet
            </h3>
            <p className="text-gray-400 text-sm">Tickets will appear here once users submit support requests.</p>
          </div>
        )}
        </>
        )}

        {activeTab === "users" && (
          <div>
            {/* Bulk Actions Toolbar */}
            {selectedUserIds.size > 0 && (
              <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-between">
                <span className="text-white font-medium">{selectedUserIds.size} user(s) selected</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const userIds = Array.from(selectedUserIds);
                      bulkDeleteMutation.mutate({ userIds });
                    }}
                    disabled={bulkDeleteMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const userIds = Array.from(selectedUserIds);
                      bulkApproveMutation.mutate({ userIds });
                    }}
                    disabled={bulkApproveMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const userIds = Array.from(selectedUserIds);
                      bulkRevokeMutation.mutate({ userIds });
                    }}
                    disabled={bulkRevokeMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Revoke All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUserIds(new Set())}
                    className="border-gray-700 text-gray-400 hover:text-[#00D4FF]"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mb-4 flex gap-3">
              <Button
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
              >
                <Mail className="w-4 h-4 mr-2" />
                Invite Customer
              </Button>
              {!usersLoading && allUsers && allUsers.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportUsersToCSV(allUsers)}
                  className="border-gray-700 text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Users
                </Button>
              )}
            </div>
            {usersLoading ? (
              <div className="text-center py-16">
                <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading users...</p>
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="space-y-4">
                {/* Pending Users */}
                {allUsers.filter((u: any) => !u.approved && u.role !== "admin").length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Pending Approval ({allUsers.filter((u: any) => !u.approved && u.role !== "admin").length})
                      {allUsers.filter((u: any) => !u.approved && u.role !== "admin").length > 0 && (
                        <label className="ml-auto flex items-center gap-2 cursor-pointer text-sm font-normal">
                          <input
                            type="checkbox"
                            checked={allUsers.filter((u: any) => !u.approved && u.role !== "admin").every((u: any) => selectedUserIds.has(u.id))}
                            onChange={(e) => {
                              const pendingUsers = allUsers.filter((u: any) => !u.approved && u.role !== "admin");
                              if (e.target.checked) {
                                pendingUsers.forEach((u: any) => selectedUserIds.add(u.id));
                              } else {
                                pendingUsers.forEach((u: any) => selectedUserIds.delete(u.id));
                              }
                              setSelectedUserIds(new Set(selectedUserIds));
                            }}
                            className="w-4 h-4"
                          />
                          Select All
                        </label>
                      )}
                    </h3>
                    <div className="space-y-2">
                      {allUsers.filter((u: any) => !u.approved && u.role !== "admin").map((u: any) => (
                        <div key={u.id} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(u.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  selectedUserIds.add(u.id);
                                } else {
                                  selectedUserIds.delete(u.id);
                                }
                                setSelectedUserIds(new Set(selectedUserIds));
                              }}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">{u.name || "Unknown"}</p>
                              <p className="text-gray-400 text-sm truncate">{u.email || "No email"}</p>
                              <p className="text-gray-500 text-xs">Signed up: {new Date(u.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate({ userId: u.id })}
                              disabled={approveMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved Users */}
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Approved Users ({allUsers.filter((u: any) => u.approved && u.role !== "admin").length})
                    {allUsers.filter((u: any) => u.approved && u.role !== "admin").length > 0 && (
                      <label className="ml-auto flex items-center gap-2 cursor-pointer text-sm font-normal">
                        <input
                          type="checkbox"
                          checked={allUsers.filter((u: any) => u.approved && u.role !== "admin").every((u: any) => selectedUserIds.has(u.id))}
                          onChange={(e) => {
                            const approvedUsers = allUsers.filter((u: any) => u.approved && u.role !== "admin");
                            if (e.target.checked) {
                              approvedUsers.forEach((u: any) => selectedUserIds.add(u.id));
                            } else {
                              approvedUsers.forEach((u: any) => selectedUserIds.delete(u.id));
                            }
                            setSelectedUserIds(new Set(selectedUserIds));
                          }}
                          className="w-4 h-4"
                        />
                        Select All
                      </label>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {allUsers.filter((u: any) => u.approved && u.role !== "admin").map((u: any) => (
                      <div key={u.id} className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                selectedUserIds.add(u.id);
                              } else {
                                selectedUserIds.delete(u.id);
                              }
                              setSelectedUserIds(new Set(selectedUserIds));
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                            {u.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{u.name || "Unknown"}</p>
                            <p className="text-gray-400 text-sm truncate">{u.email || "No email"}</p>
                            <p className="text-gray-500 text-xs">Approved | Last sign-in: {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "Never"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <select
                            value={u.role}
                            onChange={(e) => updateRoleMutation.mutate({ userId: u.id, role: e.target.value as any })}
                            disabled={updateRoleMutation.isPending}
                            className="bg-[#0A0E1A] border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-[#00D4FF]/50 focus:outline-none h-9 min-w-[120px]"
                          >
                            <option value="user">User</option>
                            <option value="technician">Technician</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokeMutation.mutate({ userId: u.id })}
                            disabled={revokeMutation.isPending}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))}
                    {allUsers.filter((u: any) => u.approved && u.role !== "admin").length === 0 && (
                      <p className="text-gray-500 text-sm py-4 text-center">No approved users yet.</p>
                    )}
                  </div>
                </div>

                {/* Admin Users */}
                <div>
                  <h3 className="text-lg font-semibold text-[#00D4FF] mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Administrators ({allUsers.filter((u: any) => u.role === "admin").length})
                  </h3>
                  <div className="space-y-2">
                    {allUsers.filter((u: any) => u.role === "admin").map((u: any) => (
                      <div key={u.id} className="bg-[#141B2D]/60 border border-[#00D4FF]/10 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] font-bold text-sm shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{u.name || "Unknown"} <span className="text-xs text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded-full ml-2">ADMIN</span></p>
                          <p className="text-gray-400 text-sm truncate">{u.email || "No email"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-16 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">No users yet</h3>
                <p className="text-gray-400 text-sm">Users will appear here once they sign in to the Support Center.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        mode="admin"
        open={showCreateTicket}
        onClose={() => setShowCreateTicket(false)}
        onSuccess={() => {
          setShowCreateTicket(false);
          refetch();
        }}
      />

      {/* Agent Assignment Modal */}
      {assignmentModalTicketId && (
        <AgentAssignmentModal
          ticketId={assignmentModalTicketId}
          isOpen={isAssignmentModalOpen}
          onClose={() => {
            setIsAssignmentModalOpen(false);
            setAssignmentModalTicketId(null);
          }}
          onAssignmentSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

function MetricCard({
  label, value, icon, color, onClick, active, highlight = false
}: {
  label: string; value: number; icon: React.ReactNode; color: string; onClick: () => void; active: boolean; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-[opacity,transform] ${
        active
          ? `bg-[#141B2D] border-[#00D4FF]/30 shadow-lg shadow-[#00D4FF]/5`
          : highlight && value > 0
            ? "bg-red-500/5 border-red-500/15 hover:border-red-500/30"
            : "bg-[#141B2D]/40 border-gray-800/40 hover:border-gray-700"
      }`}
    >
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </button>
  );
}
