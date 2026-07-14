/**
 * Client Management Hub — GigitekAI Admin Portal
 * 
 * Features:
 * - Client Directory with search, filters, and status badges
 * - Client Detail slide-over panel with timeline
 * - Multi-step onboarding wizard
 * - Status management and quick actions
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle, CheckCircle2, Loader2, Search, Plus, Building2, Users,
  DollarSign, Clock, ArrowRight, X, ChevronRight, Filter, Globe,
  Phone, Mail, Calendar, Activity, TrendingUp, UserPlus, Eye
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type ClientStatus = "pending" | "onboarding" | "active" | "paused" | "churned";
type OnboardingStep = "submitted" | "kickoff_scheduled" | "discovery" | "implementation" | "training" | "completed";
type ViewMode = "directory" | "onboard";

interface Client {
  id: number;
  companyName: string;
  companyDomain: string;
  serviceType: string;
  annualContractValue: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  status: ClientStatus;
  onboardingStep: OnboardingStep;
  notes: string | null;
  kickoffMeetingDate: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400" },
  onboarding: { label: "Onboarding", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", dot: "bg-blue-400" },
  active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400" },
  paused: { label: "Paused", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", dot: "bg-slate-400" },
  churned: { label: "Churned", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", dot: "bg-red-400" },
};

const STEP_CONFIG: Record<OnboardingStep, { label: string; order: number }> = {
  submitted: { label: "Submitted", order: 1 },
  kickoff_scheduled: { label: "Kickoff Scheduled", order: 2 },
  discovery: { label: "Discovery", order: 3 },
  implementation: { label: "Implementation", order: 4 },
  training: { label: "Training", order: 5 },
  completed: { label: "Completed", order: 6 },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminClientOnboarding() {
  const [view, setView] = useState<ViewMode>("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Fetch clients
  const { data: clientList, isLoading, refetch } = trpc.clientOnboarding.listClients.useQuery();

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!clientList) return [];
    return clientList.filter((c: Client) => {
      const matchesSearch = !searchQuery ||
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.companyDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactFirstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactLastName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clientList, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!clientList) return { total: 0, active: 0, onboarding: 0, revenue: 0 };
    return {
      total: clientList.length,
      active: clientList.filter((c: Client) => c.status === "active").length,
      onboarding: clientList.filter((c: Client) => c.status === "onboarding" || c.status === "pending").length,
      revenue: clientList
        .filter((c: Client) => c.status === "active")
        .reduce((sum: number, c: Client) => sum + parseFloat(c.annualContractValue || "0"), 0),
    };
  }, [clientList]);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Header with view toggle */}
      <div className="border-b border-white/5 bg-slate-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 size={22} className="text-cyan-400" />
              Client Management
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {view === "directory" ? "View and manage all clients" : "Onboard a new client"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-white/5">
              <button
                onClick={() => setView("directory")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === "directory"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users size={14} className="inline mr-1.5" />
                Directory
              </button>
              <button
                onClick={() => setView("onboard")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === "onboard"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UserPlus size={14} className="inline mr-1.5" />
                New Client
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === "directory" ? (
        <ClientDirectory
          clients={filteredClients}
          stats={stats}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onSelectClient={(c) => { setSelectedClient(c); setShowDetail(true); }}
          onNewClient={() => setView("onboard")}
        />
      ) : (
        <OnboardingWizard
          onSuccess={() => { setView("directory"); refetch(); }}
          onCancel={() => setView("directory")}
        />
      )}

      {/* Client Detail Slide-over */}
      {showDetail && selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          onClose={() => { setShowDetail(false); setSelectedClient(null); }}
          onUpdate={() => refetch()}
        />
      )}
    </div>
  );
}

// ─── Client Directory ─────────────────────────────────────────────────────────
function ClientDirectory({
  clients, stats, isLoading, searchQuery, setSearchQuery,
  statusFilter, setStatusFilter, onSelectClient, onNewClient,
}: {
  clients: Client[];
  stats: { total: number; active: number; onboarding: number; revenue: number };
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: ClientStatus | "all";
  setStatusFilter: (s: ClientStatus | "all") => void;
  onSelectClient: (c: Client) => void;
  onNewClient: () => void;
}) {
  return (
    <div className="p-6 space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: "Total Clients", value: stats.total.toString(), color: "cyan" },
          { icon: CheckCircle2, label: "Active", value: stats.active.toString(), color: "emerald" },
          { icon: Clock, label: "Onboarding", value: stats.onboarding.toString(), color: "blue" },
          { icon: DollarSign, label: "Annual Revenue", value: `$${(stats.revenue / 1000).toFixed(0)}K`, color: "purple" },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
            emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
            purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
          };
          return (
            <div key={stat.label} className={`rounded-xl border p-4 ${colorMap[stat.color]}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} />
                <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by company, contact, domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Filter size={14} className="text-slate-400" />
          {(["all", "active", "onboarding", "pending", "paused", "churned"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                statusFilter === s
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Client Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-cyan-400" size={32} />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
          <Building2 size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No clients found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            {searchQuery || statusFilter !== "all" ? "Try adjusting your filters" : "Get started by onboarding your first client"}
          </p>
          <Button onClick={onNewClient} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus size={14} className="mr-1.5" /> Add New Client
          </Button>
        </div>
      ) : (
        <div className="border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50 border-b border-white/5">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Service</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Value</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clients.map((client: Client) => {
                const statusCfg = STATUS_CONFIG[client.status];
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    onClick={() => onSelectClient(client)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-sm">
                          {client.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{client.companyName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Globe size={10} /> {client.companyDomain}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-slate-300">{client.contactFirstName} {client.contactLastName}</p>
                      <p className="text-xs text-slate-500">{client.contactEmail}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">
                        {client.serviceType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <span className={statusCfg.color}>{statusCfg.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-semibold text-white">
                        ${parseFloat(client.annualContractValue || "0").toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500">/yr</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-all opacity-0 group-hover:opacity-100">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Client Detail Panel ──────────────────────────────────────────────────────
function ClientDetailPanel({ client, onClose, onUpdate }: { client: Client; onClose: () => void; onUpdate: () => void }) {
  const { data: clientDetail } = trpc.clientOnboarding.getClient.useQuery({ id: client.id });
  const updateMutation = trpc.clientOnboarding.updateStatus.useMutation({
    onSuccess: () => { toast.success("Client updated"); onUpdate(); },
    onError: (e) => toast.error(e.message),
  });

  const timeline = (clientDetail as any)?.timeline || [];
  const stepOrder = STEP_CONFIG[client.onboardingStep]?.order || 1;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-[#0D1117] border-l border-white/10 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold">
              {client.companyName.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-white">{client.companyName}</h2>
              <p className="text-xs text-slate-400">{client.companyDomain}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status + Quick Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${STATUS_CONFIG[client.status].bg}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[client.status].dot}`} />
              <span className={STATUS_CONFIG[client.status].color}>{STATUS_CONFIG[client.status].label}</span>
            </span>
            {client.status === "pending" && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs h-7"
                onClick={() => updateMutation.mutate({ id: client.id, status: "onboarding", onboardingStep: "kickoff_scheduled" })}
              >
                Start Onboarding
              </Button>
            )}
            {client.status === "onboarding" && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7"
                onClick={() => updateMutation.mutate({ id: client.id, status: "active", onboardingStep: "completed" })}
              >
                Mark Active
              </Button>
            )}
            {client.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={() => updateMutation.mutate({ id: client.id, status: "paused" })}
              >
                Pause
              </Button>
            )}
          </div>

          {/* Onboarding Progress */}
          {client.status !== "active" && client.status !== "churned" && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Onboarding Progress</h3>
              <div className="flex items-center gap-1">
                {Object.entries(STEP_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full h-1.5 rounded-full ${cfg.order <= stepOrder ? "bg-cyan-500" : "bg-slate-700"}`} />
                    <span className={`text-[9px] ${cfg.order <= stepOrder ? "text-cyan-400" : "text-slate-600"}`}>
                      {cfg.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Primary Contact</h3>
            <div className="bg-slate-800/50 rounded-xl border border-white/5 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Users size={14} className="text-slate-500" />
                <span className="text-white">{client.contactFirstName} {client.contactLastName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-slate-500" />
                <a href={`mailto:${client.contactEmail}`} className="text-cyan-400 hover:underline">{client.contactEmail}</a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-slate-500" />
                <span className="text-slate-300">{client.contactPhone}</span>
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contract Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-xl border border-white/5 p-3">
                <p className="text-[10px] text-slate-500 uppercase">Service Type</p>
                <p className="text-sm font-medium text-white mt-0.5">{client.serviceType}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl border border-white/5 p-3">
                <p className="text-[10px] text-slate-500 uppercase">Annual Value</p>
                <p className="text-sm font-medium text-emerald-400 mt-0.5">${parseFloat(client.annualContractValue || "0").toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl border border-white/5 p-3">
                <p className="text-[10px] text-slate-500 uppercase">Client Since</p>
                <p className="text-sm font-medium text-white mt-0.5">{new Date(client.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl border border-white/5 p-3">
                <p className="text-[10px] text-slate-500 uppercase">Last Updated</p>
                <p className="text-sm font-medium text-white mt-0.5">{new Date(client.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Activity Timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {timeline.slice(0, 10).map((entry: any) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5" />
                      <div className="w-px flex-1 bg-slate-700" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm text-white font-medium">{entry.event.replace(/_/g, " ")}</p>
                      {entry.description && <p className="text-xs text-slate-400 mt-0.5">{entry.description}</p>}
                      <p className="text-[10px] text-slate-600 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Wizard ────────────────────────────────────────────────────────
function OnboardingWizard({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    serviceType: "",
    annualValue: 0,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const mutation = trpc.clientOnboarding.startOnboarding.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message || "Client onboarding started successfully!");
      toast.success("Client onboarded successfully!");
      setTimeout(() => onSuccess(), 2000);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message);
      toast.error(error.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "annualValue" ? parseFloat(value) || 0 : value,
    }));
  };

  const canAdvance = () => {
    if (step === 1) return formData.companyName && formData.companyEmail && formData.serviceType;
    if (step === 2) return formData.contactFirstName && formData.contactLastName && formData.contactEmail && formData.contactPhone;
    return true;
  };

  const handleSubmit = () => {
    setStatus("loading");
    mutation.mutate(formData);
  };

  const SERVICE_TYPES = [
    "M365 Management",
    "Full Managed IT",
    "Security Services",
    "Backup & Recovery",
    "Cloud Infrastructure",
    "Helpdesk Only",
    "AI Automation",
    "Custom Package",
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: "Company Info" },
          { num: 2, label: "Primary Contact" },
          { num: 3, label: "Review & Launch" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                step >= s.num
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                  : "bg-slate-800 border-slate-600 text-slate-500"
              }`}>
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${step >= s.num ? "text-cyan-300" : "text-slate-500"}`}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className={`flex-1 h-0.5 mx-3 rounded-full ${step > s.num ? "bg-cyan-500" : "bg-slate-700"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="bg-slate-900/50 border-white/5">
        <CardContent className="p-6">
          {status === "success" ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Client Onboarded!</h3>
              <p className="text-slate-400">{message}</p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Company Information</h3>
                    <p className="text-sm text-slate-400">Enter the client's company details to begin onboarding.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300 text-xs">Company Name *</Label>
                      <Input
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Acme Corp"
                        className="mt-1 bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Company Domain *</Label>
                      <Input
                        name="companyEmail"
                        value={formData.companyEmail}
                        onChange={handleChange}
                        placeholder="acme.com"
                        className="mt-1 bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Service Type *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {SERVICE_TYPES.map((svc) => (
                        <button
                          key={svc}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, serviceType: svc }))}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                            formData.serviceType === svc
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                              : "bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:border-white/20"
                          }`}
                        >
                          {svc}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Annual Contract Value ($)</Label>
                    <Input
                      name="annualValue"
                      type="number"
                      value={formData.annualValue || ""}
                      onChange={handleChange}
                      placeholder="50000"
                      className="mt-1 bg-slate-800/50 border-white/10 text-white max-w-xs"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Primary Contact</h3>
                    <p className="text-sm text-slate-400">Who is the main point of contact at {formData.companyName || "this company"}?</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300 text-xs">First Name *</Label>
                      <Input
                        name="contactFirstName"
                        value={formData.contactFirstName}
                        onChange={handleChange}
                        placeholder="John"
                        className="mt-1 bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Last Name *</Label>
                      <Input
                        name="contactLastName"
                        value={formData.contactLastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="mt-1 bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Email *</Label>
                      <Input
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="john@acme.com"
                        className="mt-1 bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Phone *</Label>
                      <Input
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                        className="mt-1 bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Review & Launch</h3>
                    <p className="text-sm text-slate-400">Confirm the details below and start the automated onboarding workflow.</p>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl border border-white/5 p-4">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Company</p>
                      <p className="text-sm font-medium text-white">{formData.companyName}</p>
                      <p className="text-xs text-slate-400">{formData.companyEmail}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl border border-white/5 p-4">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Contact</p>
                      <p className="text-sm font-medium text-white">{formData.contactFirstName} {formData.contactLastName}</p>
                      <p className="text-xs text-slate-400">{formData.contactEmail}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl border border-white/5 p-4">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Service</p>
                      <p className="text-sm font-medium text-white">{formData.serviceType}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl border border-white/5 p-4">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Annual Value</p>
                      <p className="text-sm font-medium text-emerald-400">${formData.annualValue.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Automation Checklist */}
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                      <Zap size={14} /> What Gets Automated
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Dynamics 365 account creation",
                        "Outlook kickoff meeting (2 days)",
                        "Welcome email to contact",
                        "Teams notification to team",
                        "Owner notification in Manus",
                        "Client record in database",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 size={12} className="text-cyan-400 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                <Button
                  variant="outline"
                  onClick={step === 1 ? onCancel : () => setStep(step - 1)}
                  className="border-white/10 text-slate-300 hover:text-white"
                >
                  {step === 1 ? "Cancel" : "Back"}
                </Button>
                {step < 3 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    disabled={!canAdvance()}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    Continue <ChevronRight size={14} className="ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={status === "loading"}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {status === "loading" ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning...</>
                    ) : (
                      <><CheckCircle2 size={14} className="mr-1.5" /> Launch Onboarding</>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Missing icon used in wizard
function Zap(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
  );
}
