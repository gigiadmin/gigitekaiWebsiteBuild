/**
 * AdminLeadsPage — Lead pipeline management
 * Shows all leads from multi-step forms, security assessments, and exit-intent popups.
 * Allows status updates and notes per lead.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  Search,
  TrendingUp,
  Flame,
  Thermometer,
  Snowflake,
  Mail,
  Phone,
  Building2,
  Calendar,
  ChevronDown,
  StickyNote,
  RefreshCw,
} from "lucide-react";

type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "rejected";

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; border: string }> = {
  new: { label: "New", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  contacted: { label: "Contacted", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  qualified: { label: "Qualified", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  converted: { label: "Converted", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  rejected: { label: "Rejected", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

const QUALITY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  hot: { label: "Hot", icon: <Flame size={12} />, color: "text-red-400" },
  warm: { label: "Warm", icon: <Thermometer size={12} />, color: "text-amber-400" },
  cold: { label: "Cold", icon: <Snowflake size={12} />, color: "text-blue-400" },
};

const TYPE_LABELS: Record<string, string> = {
  form: "Multi-Step Form",
  assessment: "Security Assessment",
  popup: "Exit Intent",
};

interface Lead {
  id: number;
  type: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  employeeCount?: string;
  leadQuality?: string;
  status?: string;
  notes?: string;
  needsCybersecurity?: boolean;
  needsCloud?: boolean;
  needsHelpdesk?: boolean;
  needsAI?: boolean;
  createdAt: Date | string;
}

export default function AdminLeadsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editStatus, setEditStatus] = useState<LeadStatus>("new");
  const [editNotes, setEditNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: leads = [], isLoading, refetch } = trpc.leadgen.getRecentLeads.useQuery(
    { limit: 100, type: "all" },
    { refetchInterval: 60_000 }
  );

  const updateStatus = trpc.leadgen.updateLeadStatus.useMutation({
    onSuccess: () => {
      toast.success("Lead status updated");
      refetch();
      setEditLead(null);
    },
    onError: (err) => toast.error(err.message || "Failed to update lead"),
  });

  const typedLeads = leads as Lead[];

  const filtered = typedLeads.filter((lead) => {
    const name = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.toLowerCase();
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.companyName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchType = filterType === "all" || lead.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  // KPI counts
  const total = typedLeads.length;
  const hotCount = typedLeads.filter((l) => l.leadQuality === "hot").length;
  const newCount = typedLeads.filter((l) => !l.status || l.status === "new").length;
  const convertedCount = typedLeads.filter((l) => l.status === "converted").length;

  function openEdit(lead: Lead) {
    setEditLead(lead);
    setEditStatus((lead.status as LeadStatus) || "new");
    setEditNotes(lead.notes ?? "");
  }

  async function handleSave() {
    if (!editLead) return;
    setIsSaving(true);
    try {
      await updateStatus.mutateAsync({
        leadId: editLead.id,
        status: editStatus,
        notes: editNotes,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminLayout title="Leads">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="text-cyan-400" size={22} />
              Lead Pipeline
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage inbound leads from all capture sources</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            <RefreshCw size={14} className="mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Leads", value: total, icon: <Users size={16} />, color: "text-cyan-400" },
            { label: "Hot Leads", value: hotCount, icon: <Flame size={16} />, color: "text-red-400" },
            { label: "New / Uncontacted", value: newCount, icon: <TrendingUp size={16} />, color: "text-amber-400" },
            { label: "Converted", value: convertedCount, icon: <TrendingUp size={16} />, color: "text-emerald-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#141B2D] border border-gray-800 rounded-xl p-4">
              <div className={`flex items-center gap-2 text-sm font-medium ${kpi.color} mb-1`}>
                {kpi.icon}
                {kpi.label}
              </div>
              <div className="text-2xl font-bold text-white">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#141B2D] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] bg-[#141B2D] border-gray-700 text-gray-300">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] bg-[#141B2D] border-gray-700 text-gray-300">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="form">Multi-Step Form</SelectItem>
              <SelectItem value="assessment">Security Assessment</SelectItem>
              <SelectItem value="popup">Exit Intent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lead Table */}
        <div className="bg-[#141B2D] border border-gray-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading leads...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p>No leads found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Lead</th>
                    <th className="text-left px-4 py-3">Company</th>
                    <th className="text-left px-4 py-3">Source</th>
                    <th className="text-left px-4 py-3">Quality</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Needs</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => {
                    const status = (lead.status as LeadStatus) || "new";
                    const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
                    const qualityCfg = lead.leadQuality ? QUALITY_CONFIG[lead.leadQuality] : null;
                    const needs = [
                      lead.needsCybersecurity && "Cybersecurity",
                      lead.needsCloud && "Cloud",
                      lead.needsHelpdesk && "Helpdesk",
                      lead.needsAI && "AI",
                    ].filter(Boolean) as string[];

                    return (
                      <tr
                        key={`${lead.type}-${lead.id}`}
                        className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">
                            {lead.firstName && lead.lastName
                              ? `${lead.firstName} ${lead.lastName}`
                              : lead.email}
                          </div>
                          <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                            <Mail size={10} />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                              <Phone size={10} />
                              {lead.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.companyName ? (
                            <div className="flex items-center gap-1.5 text-gray-300">
                              <Building2 size={12} className="text-gray-500" />
                              {lead.companyName}
                            </div>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                          {lead.employeeCount && (
                            <div className="text-gray-500 text-xs mt-0.5">{lead.employeeCount} employees</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-md bg-gray-800 text-gray-400">
                            {TYPE_LABELS[lead.type] ?? lead.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {qualityCfg ? (
                            <span className={`flex items-center gap-1 text-xs font-semibold ${qualityCfg.color}`}>
                              {qualityCfg.icon}
                              {qualityCfg.label}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {needs.length > 0
                              ? needs.map((n) => (
                                  <span key={n} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    {n}
                                  </span>
                                ))
                              : <span className="text-gray-600 text-xs">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <Calendar size={10} />
                            {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(lead)}
                            className="border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 text-xs h-7 px-2"
                          >
                            <ChevronDown size={12} className="mr-1" />
                            Update
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={!!editLead} onOpenChange={() => setEditLead(null)}>
        <DialogContent className="max-w-md bg-[#141B2D] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <StickyNote size={16} className="text-cyan-400" />
              Update Lead
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editLead?.firstName} {editLead?.lastName} — {editLead?.companyName ?? editLead?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Status</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as LeadStatus)}>
                <SelectTrigger className="bg-[#0A0E1A] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                rows={4}
                className="bg-[#0A0E1A] border-gray-700 text-white placeholder:text-gray-600 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setEditLead(null)} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
