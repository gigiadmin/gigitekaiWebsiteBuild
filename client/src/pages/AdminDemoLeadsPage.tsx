/**
 * AdminDemoLeadsPage — AI Demo form submission management
 * Displays all leads captured from the /ai-demo lead capture form.
 * Features: search/filter by scenario, CSV export, expandable rows.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bot,
  Search,
  Download,
  RefreshCw,
  Mail,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
} from "lucide-react";

type DemoLead = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  scenario: string | null;
  message: string | null;
  createdAt: Date;
};

const SCENARIO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Ticket Triage": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  "Knowledge Base Q&A": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
  "Teams Escalation": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  "M365 Monitoring": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Health Check": { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
};

function getScenarioStyle(scenario: string | null) {
  if (!scenario) return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" };
  return SCENARIO_COLORS[scenario] ?? { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" };
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportToCSV(leads: DemoLead[]) {
  const headers = ["ID", "Name", "Email", "Company", "Scenario", "Message", "Submitted At"];
  const rows = leads.map((l) => [
    l.id,
    `"${l.name.replace(/"/g, '""')}"`,
    l.email,
    `"${(l.company ?? "").replace(/"/g, '""')}"`,
    `"${(l.scenario ?? "").replace(/"/g, '""')}"`,
    `"${(l.message ?? "").replace(/"/g, '""')}"`,
    new Date(l.createdAt).toISOString(),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gigitekai-demo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported successfully");
}

export default function AdminDemoLeadsPage() {
  const [search, setSearch] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: leads = [], isLoading, refetch } = trpc.demo.listLeads.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  // Unique scenarios for filter dropdown
  const scenarios = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => { if (l.scenario) set.add(l.scenario); });
    return Array.from(set).sort();
  }, [leads]);

  // Filtered leads
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q) ||
        (l.scenario ?? "").toLowerCase().includes(q);
      const matchesScenario = scenarioFilter === "all" || l.scenario === scenarioFilter;
      return matchesSearch && matchesScenario;
    });
  }, [leads, search, scenarioFilter]);

  // Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = leads.filter((l) => new Date(l.createdAt) >= today).length;
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  const weekCount = leads.filter((l) => new Date(l.createdAt) >= thisWeek).length;

  return (
    <AdminLayout title="AI Demo Leads">
      <div className="space-y-6 p-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Bot size={18} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Demo Leads</h1>
              <p className="text-sm text-slate-400">Form submissions from the /ai-demo page</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => exportToCSV(filtered)}
              disabled={filtered.length === 0}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              <Download size={14} className="mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Leads", value: leads.length, icon: <Users size={16} />, color: "text-cyan-400" },
            { label: "Today", value: todayCount, icon: <Zap size={16} />, color: "text-emerald-400" },
            { label: "Last 7 Days", value: weekCount, icon: <Calendar size={16} />, color: "text-violet-400" },
            { label: "Scenarios", value: scenarios.length, icon: <Bot size={16} />, color: "text-amber-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-slate-900/60 border-slate-800">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={stat.color}>{stat.icon}</span>
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search name, email, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 h-9"
            />
          </div>
          <Select value={scenarioFilter} onValueChange={setScenarioFilter}>
            <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-slate-300 h-9">
              <SelectValue placeholder="All Scenarios" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Scenarios</SelectItem>
              {scenarios.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || scenarioFilter !== "all") && (
            <span className="text-xs text-slate-400">
              {filtered.length} of {leads.length} leads
            </span>
          )}
        </div>

        {/* ── Table ── */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <RefreshCw size={20} className="animate-spin mr-2" />
                Loading leads…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Bot size={36} className="text-slate-600" />
                <p className="text-sm">
                  {leads.length === 0 ? "No demo leads yet. They'll appear here when visitors submit the form on /ai-demo." : "No leads match your filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Scenario</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Submitted</th>
                      <th className="px-4 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead) => {
                      const style = getScenarioStyle(lead.scenario);
                      const isExpanded = expandedId === lead.id;
                      return (
                        <>
                          <tr
                            key={lead.id}
                            className={`border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition-colors ${isExpanded ? "bg-slate-800/20" : ""}`}
                            onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{lead.name}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail size={10} />
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="hover:text-cyan-400 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {lead.email}
                                </a>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              {lead.company ? (
                                <div className="flex items-center gap-1.5 text-slate-300">
                                  <Building2 size={12} className="text-slate-500" />
                                  {lead.company}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              {lead.scenario ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                                  {lead.scenario}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs">
                              {formatDate(lead.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${lead.id}-expanded`} className="bg-slate-800/20 border-b border-slate-800/60">
                              <td colSpan={5} className="px-4 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-500 text-xs w-20">Email</span>
                                      <a href={`mailto:${lead.email}`} className="text-cyan-400 hover:underline">{lead.email}</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-500 text-xs w-20">Company</span>
                                      <span className="text-slate-200">{lead.company || "—"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-500 text-xs w-20">Scenario</span>
                                      {lead.scenario ? (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getScenarioStyle(lead.scenario).bg} ${getScenarioStyle(lead.scenario).text} ${getScenarioStyle(lead.scenario).border}`}>
                                          {lead.scenario}
                                        </span>
                                      ) : <span className="text-slate-600">—</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-500 text-xs w-20">Submitted</span>
                                      <span className="text-slate-300">{formatDate(lead.createdAt)}</span>
                                    </div>
                                  </div>
                                  {lead.message && (
                                    <div>
                                      <div className="text-xs text-slate-500 mb-1">Message</div>
                                      <p className="text-slate-300 text-sm bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
                                        {lead.message}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`mailto:${lead.email}?subject=Following up on your GigitekAI Demo Request&body=Hi ${lead.name},%0A%0AThank you for your interest in GigitekAI! I'd love to schedule a personalized demo for you.%0A%0ABest regards,%0AHarry Henry-Santiago%0AGIGITEKAI LLC`, "_blank");
                                    }}
                                  >
                                    <Mail size={11} className="mr-1" />
                                    Send Follow-up Email
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
