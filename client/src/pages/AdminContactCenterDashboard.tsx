/**
 * AdminContactCenterDashboard — Contact Center Real-Time Monitoring
 * Enhanced with: live agent status, queue metrics, SLA monitor,
 * active sessions, and individual service refresh.
 * Route: /admin/contact-center, /admin/contact-center-dashboard
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  PhoneIncoming,
  MessageSquare,
  Bot,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Users,
  Zap,
  BarChart3,
  Headphones,
  Shield,
  Globe,
  Server,
  TrendingUp,
  TrendingDown,
  Minus,
  PhoneCall,
  Wifi,
  WifiOff,
  Timer,
  UserCheck,
  UserX,
  Coffee,
  Loader2,
  Target,
} from "lucide-react";

// ── Status helpers ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "healthy" | "degraded" | "error" | "unknown" | string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    healthy: { label: "Healthy", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 size={11} /> },
    degraded: { label: "Degraded", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <AlertTriangle size={11} /> },
    error: { label: "Error", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle size={11} /> },
    unknown: { label: "Unknown", className: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: <Minus size={11} /> },
  };
  const s = map[status] ?? map.unknown;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${s.className}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function AgentStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: "bg-emerald-400",
    busy: "bg-red-400",
    offline: "bg-slate-500",
    "on-break": "bg-yellow-400",
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || colors.offline}`} />;
}

function MetricCard({
  title,
  value,
  sub,
  icon,
  trend,
  color = "cyan",
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "flat";
  color?: "cyan" | "emerald" | "orange" | "red" | "violet";
}) {
  const colorMap = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{title}</span>
        <span className="opacity-70">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {trend && <TrendIcon size={11} className="opacity-60" />}
          <span className="text-xs text-slate-400">{sub}</span>
        </div>
      )}
    </div>
  );
}

function IntegrationStatusRow({
  icon,
  label,
  status,
  detail,
  configured,
  onRefresh,
  refreshing,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  detail?: string;
  configured?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          {detail && <div className="text-xs text-slate-400 mt-0.5">{detail}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {configured === false && (
          <span className="text-xs text-slate-500 italic">Not configured</span>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
            title={`Refresh ${label}`}
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          </button>
        )}
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminContactCenterDashboard() {
  const [refreshingService, setRefreshingService] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const utils = trpc.useUtils();

  // Auto-refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return 15;
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: d365Status, isLoading: d365Loading } = trpc.dynamicsIntegration.checkConnection.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: copilotStatus, isLoading: copilotLoading } = trpc.copilotStudio.getAgentStatus.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: teamsWebhook, isLoading: teamsLoading } = trpc.teamsChannels.getWebhookHealth.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: queueMetrics, isLoading: queueLoading } = trpc.helpdeskDashboardMetrics.getQueueMetrics.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const { data: overallMetrics, isLoading: metricsLoading } = trpc.helpdeskDashboardMetrics.getOverallMetrics.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const { data: callStats, isLoading: callsLoading } = trpc.calls.getStats.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const { data: agentMetrics, isLoading: agentsLoading } = trpc.helpdeskDashboardMetrics.getAgentMetrics.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: acsPhoneNumbers, isLoading: acsPhoneLoading } = trpc.acs.getPhoneNumbers.useQuery(undefined, {
    refetchInterval: 60000,
  });
  const { data: acsStatus } = trpc.acs.getStatus.useQuery(undefined, {
    refetchInterval: 60000,
  });

  // ── NEW: Real-time monitoring data ────────────────────────────────────────
  const { data: agentRealTime, isLoading: agentRealTimeLoading } = trpc.contactCenter.getAgentRealTimeStatus.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const { data: liveQueue } = trpc.contactCenter.getLiveQueueMetrics.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const { data: activeSessions } = trpc.contactCenter.getActiveSessions.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const { data: slaData } = trpc.contactCenter.getSlaMonitor.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const isLoading = d365Loading || copilotLoading || teamsLoading || queueLoading || metricsLoading || callsLoading;

  // ── Individual service refresh ────────────────────────────────────────────
  const refreshServiceQuery = trpc.contactCenter.refreshService.useQuery(
    { service: refreshingService as any },
    { enabled: !!refreshingService }
  );

  useEffect(() => {
    if (refreshServiceQuery.data && refreshingService) {
      // Invalidate the relevant queries after refresh
      utils.copilotStudio.getAgentStatus.invalidate();
      utils.dynamicsIntegration.checkConnection.invalidate();
      utils.teamsChannels.getWebhookHealth.invalidate();
      utils.acs.getStatus.invalidate();
      setTimeout(() => setRefreshingService(null), 500);
    }
  }, [refreshServiceQuery.data]);

  const handleRefreshService = (service: string) => {
    setRefreshingService(service);
  };

  const refreshAll = () => {
    utils.contactCenter.getAgentRealTimeStatus.invalidate();
    utils.contactCenter.getLiveQueueMetrics.invalidate();
    utils.contactCenter.getActiveSessions.invalidate();
    utils.contactCenter.getSlaMonitor.invalidate();
    utils.copilotStudio.getAgentStatus.invalidate();
    utils.dynamicsIntegration.checkConnection.invalidate();
    utils.teamsChannels.getWebhookHealth.invalidate();
    utils.acs.getStatus.invalidate();
    utils.helpdeskDashboardMetrics.getOverallMetrics.invalidate();
    utils.calls.getStats.invalidate();
  };

  // ── Derived status values ─────────────────────────────────────────────────
  const d365StatusValue = d365Status?.status ?? "unknown";
  const teamsWebhookStatus = teamsWebhook?.health?.healthy === true ? "healthy" : teamsWebhook?.health?.configured === false ? "error" : "unknown";
  const copilotConfigured = copilotStatus?.tenantId === "configured" && copilotStatus?.environmentId === "configured";

  return (
    <AdminLayout title="Contact Center Dashboard">
      <div className="space-y-6">
        {/* ── Header with refresh ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Headphones size={20} className="text-cyan-400" />
              Contact Center Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time monitoring — Teams · D365 · Copilot Studio · ACS
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auto-refresh in {countdown}s</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 gap-2"
              onClick={refreshAll}
            >
              <RefreshCw size={13} />
              Refresh All
            </Button>
          </div>
        </div>

        {/* ── Real-Time Agent Status Panel ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Users size={14} />
            Live Agent Status
            {agentRealTime?.stats && (
              <span className="text-xs font-normal text-slate-500 ml-2">
                {agentRealTime.stats.available} available · {agentRealTime.stats.busy} busy · {agentRealTime.stats.total} total
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <UserCheck size={14} className="text-emerald-400" />
              <span className="text-sm text-emerald-400 font-semibold">{agentRealTime?.stats?.available ?? 0}</span>
              <span className="text-xs text-slate-400">Available</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <Phone size={14} className="text-red-400" />
              <span className="text-sm text-red-400 font-semibold">{agentRealTime?.stats?.busy ?? 0}</span>
              <span className="text-xs text-slate-400">Busy</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Coffee size={14} className="text-yellow-400" />
              <span className="text-sm text-yellow-400 font-semibold">{agentRealTime?.stats?.onBreak ?? 0}</span>
              <span className="text-xs text-slate-400">On Break</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-500/10 border border-slate-500/20">
              <UserX size={14} className="text-slate-400" />
              <span className="text-sm text-slate-400 font-semibold">{agentRealTime?.stats?.offline ?? 0}</span>
              <span className="text-xs text-slate-400">Offline</span>
            </div>
          </div>
          {agentRealTimeLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
              <Loader2 size={14} className="animate-spin" /> Loading agent status...
            </div>
          ) : agentRealTime?.agents && agentRealTime.agents.length > 0 ? (
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Agent</th>
                        <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Status</th>
                        <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Specialization</th>
                        <th className="text-right text-xs text-slate-400 font-medium pb-2 pr-4">Load</th>
                        <th className="text-right text-xs text-slate-400 font-medium pb-2 pr-4">Resolved</th>
                        <th className="text-right text-xs text-slate-400 font-medium pb-2 pr-4">CSAT</th>
                        <th className="text-right text-xs text-slate-400 font-medium pb-2">Last Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentRealTime.agents.map((agent: any) => (
                        <tr key={agent.id} className="border-b border-slate-800/40 last:border-0">
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <AgentStatusDot status={agent.status} />
                              <span className="text-white font-medium">{agent.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={`text-xs font-medium capitalize ${
                              agent.status === "available" ? "text-emerald-400" :
                              agent.status === "busy" ? "text-red-400" :
                              agent.status === "on-break" ? "text-yellow-400" :
                              "text-slate-400"
                            }`}>
                              {agent.status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-slate-400 text-xs">{agent.specialization}</td>
                          <td className="py-2.5 pr-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    agent.loadPercent >= 80 ? "bg-red-400" :
                                    agent.loadPercent >= 50 ? "bg-yellow-400" :
                                    "bg-emerald-400"
                                  }`}
                                  style={{ width: `${Math.min(agent.loadPercent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{agent.currentLoad}/{agent.maxLoad}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-right text-emerald-400 text-sm">{agent.totalResolved}</td>
                          <td className="py-2.5 pr-4 text-right text-slate-300 text-sm">{agent.csat}</td>
                          <td className="py-2.5 text-right text-xs text-slate-500">
                            {agent.lastStatusChange ? new Date(agent.lastStatusChange).toLocaleTimeString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-sm text-slate-500 py-4">No agents configured. Add agents in the Agents management page.</div>
          )}
        </div>

        {/* ── SLA & Queue Metrics Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* SLA Monitor */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Target size={14} className="text-cyan-400" />
                SLA Compliance (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <div className="text-xs text-slate-400 mb-1">Response Time</div>
                  <div className="text-lg font-bold text-white">
                    {slaData?.sla?.currentResponseAvg ?? 0}<span className="text-xs text-slate-400 ml-1">min</span>
                  </div>
                  <div className="text-xs text-slate-500">Target: {slaData?.sla?.responseTarget ?? 15} min</div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (slaData?.sla?.currentResponseAvg ?? 0) <= (slaData?.sla?.responseTarget ?? 15) ? "bg-emerald-400" : "bg-red-400"
                      }`}
                      style={{ width: `${Math.min(((slaData?.sla?.currentResponseAvg ?? 0) / (slaData?.sla?.responseTarget ?? 15)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <div className="text-xs text-slate-400 mb-1">Resolution Time</div>
                  <div className="text-lg font-bold text-white">
                    {slaData?.sla?.currentResolutionAvg ?? 0}<span className="text-xs text-slate-400 ml-1">min</span>
                  </div>
                  <div className="text-xs text-slate-500">Target: {slaData?.sla?.resolutionTarget ?? 240} min</div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (slaData?.sla?.currentResolutionAvg ?? 0) <= (slaData?.sla?.resolutionTarget ?? 240) ? "bg-emerald-400" : "bg-red-400"
                      }`}
                      style={{ width: `${Math.min(((slaData?.sla?.currentResolutionAvg ?? 0) / (slaData?.sla?.resolutionTarget ?? 240)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <div className="text-xs text-slate-400 mb-1">Compliance Rate</div>
                  <div className={`text-lg font-bold ${(slaData?.sla?.compliance ?? 100) >= 95 ? "text-emerald-400" : (slaData?.sla?.compliance ?? 100) >= 80 ? "text-yellow-400" : "text-red-400"}`}>
                    {slaData?.sla?.compliance ?? 100}%
                  </div>
                  <div className="text-xs text-slate-500">{slaData?.sla?.totalTickets24h ?? 0} tickets in 24h</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <div className="text-xs text-slate-400 mb-1">SLA Breaches</div>
                  <div className={`text-lg font-bold ${(slaData?.sla?.breaches ?? 0) === 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {slaData?.sla?.breaches ?? 0}
                  </div>
                  <div className="text-xs text-slate-500">Response &gt; 15 min</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Queue */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Activity size={14} className="text-orange-400" />
                Live Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-xl font-bold text-orange-400">{liveQueue?.summary?.totalWaiting ?? 0}</div>
                  <div className="text-xs text-slate-400">Waiting</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-xl font-bold text-cyan-400">{liveQueue?.summary?.totalInProgress ?? 0}</div>
                  <div className="text-xs text-slate-400">In Progress</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xl font-bold text-emerald-400">{liveQueue?.summary?.serviceLevel ?? 100}%</div>
                  <div className="text-xs text-slate-400">Service Level</div>
                </div>
              </div>
              <div className="text-xs text-slate-400 mb-2">
                Avg Wait: <span className="text-white font-medium">{liveQueue?.summary?.avgWaitMin ?? 0} min</span>
                {" · "}Today Total: <span className="text-white font-medium">{liveQueue?.summary?.todayTotal ?? 0}</span>
              </div>
              {liveQueue?.queues && liveQueue.queues.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">By Category</div>
                  {liveQueue.queues.map((q: any) => (
                    <div key={q.name} className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800/40">
                      <span className="text-xs text-slate-300">{q.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-orange-400">{q.waiting} waiting</span>
                        <span className="text-xs text-cyan-400">{q.inProgress} active</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Active Sessions ── */}
        {activeSessions && activeSessions.sessions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Timer size={14} />
              Active Sessions ({activeSessions.count})
            </h2>
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {activeSessions.sessions.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                          {(s.agentName || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium">{s.agentName}</div>
                          <div className="text-xs text-slate-400">Ticket #{s.ticketId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          <Clock size={10} className="inline mr-1" />
                          {s.durationMin} min
                        </span>
                        <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Integration Status (with individual refresh) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Microsoft Integration Status */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Globe size={14} className="text-cyan-400" />
                Microsoft Integration Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <IntegrationStatusRow
                icon={<Phone size={14} />}
                label="Dynamics 365 Contact Center"
                status={d365StatusValue}
                detail={d365Status?.message ?? "Checking connection..."}
                onRefresh={() => handleRefreshService("d365")}
                refreshing={refreshingService === "d365"}
              />
              <IntegrationStatusRow
                icon={<MessageSquare size={14} />}
                label="Teams Webhook"
                status={teamsWebhookStatus}
                detail={teamsWebhook?.health?.configured ? `Webhook configured · Last check: ${teamsWebhook?.health?.lastCheckedAt ? new Date(teamsWebhook.health.lastCheckedAt).toLocaleTimeString() : 'never'}` : 'Webhook not configured'}
                onRefresh={() => handleRefreshService("teams")}
                refreshing={refreshingService === "teams"}
              />
              <IntegrationStatusRow
                icon={<Bot size={14} />}
                label="Copilot Studio Voice Agent"
                status={copilotConfigured ? "healthy" : "degraded"}
                detail={copilotConfigured ? "Tenant + Environment configured" : "Missing tenant or environment ID"}
                configured={copilotConfigured}
                onRefresh={() => handleRefreshService("copilot")}
                refreshing={refreshingService === "copilot"}
              />
              <IntegrationStatusRow
                icon={<Server size={14} />}
                label="Azure Communication Services"
                status={acsStatus?.healthy ? "healthy" : acsStatus?.configured === false ? "error" : "unknown"}
                detail={acsStatus?.message ?? "ACS telephony channel"}
                onRefresh={() => handleRefreshService("acs")}
                refreshing={refreshingService === "acs"}
              />
            </CardContent>
          </Card>
          {/* Copilot Studio Agents */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Bot size={14} className="text-violet-400" />
                Copilot Studio Agents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <IntegrationStatusRow
                icon={<Zap size={14} />}
                label="Ticket Classifier Agent"
                status={copilotStatus?.ticketClassifierConfigured ? "healthy" : "error"}
                detail={copilotStatus?.ticketClassifierConfigured ? "Agent ID configured" : "Agent ID not configured"}
                onRefresh={() => handleRefreshService("ticketClassifier")}
                refreshing={refreshingService === "ticketClassifier"}
              />
              <IntegrationStatusRow
                icon={<MessageSquare size={14} />}
                label="KB Q&A Agent"
                status={copilotStatus?.kbQAConfigured ? "healthy" : "error"}
                detail={copilotStatus?.kbQAConfigured ? "Agent ID configured" : "Agent ID not configured"}
                onRefresh={() => handleRefreshService("kbQA")}
                refreshing={refreshingService === "kbQA"}
              />
              <IntegrationStatusRow
                icon={<Shield size={14} />}
                label="Tenant Configuration"
                status={copilotStatus?.tenantId === "configured" ? "healthy" : "error"}
                detail={`Tenant: ${copilotStatus?.tenantId ?? "unknown"} · Env: ${copilotStatus?.environmentId ?? "unknown"}`}
                onRefresh={() => handleRefreshService("copilot")}
                refreshing={refreshingService === "copilot"}
              />
              <IntegrationStatusRow
                icon={<Activity size={14} />}
                label="Voice Routing (IVR)"
                status={copilotConfigured ? "healthy" : "degraded"}
                detail="Copilot Studio → Teams Call Queue routing"
                onRefresh={() => handleRefreshService("voiceAgent")}
                refreshing={refreshingService === "voiceAgent"}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Call Metrics Row ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Call Metrics (Today)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard
              title="Total Calls"
              value={callStats?.todayCalls ?? 0}
              sub="Today"
              icon={<PhoneCall size={16} />}
              color="cyan"
            />
            <MetricCard
              title="Pending Review"
              value={callStats?.pending ?? 0}
              sub="Draft tickets"
              icon={<Clock size={16} />}
              color="orange"
            />
            <MetricCard
              title="Approved"
              value={callStats?.approved ?? 0}
              sub="Tickets created"
              icon={<CheckCircle2 size={16} />}
              color="emerald"
            />
            <MetricCard
              title="Rejected"
              value={callStats?.rejected ?? 0}
              sub="Not ticketed"
              icon={<XCircle size={16} />}
              color="red"
            />
            <MetricCard
              title="Total Logged"
              value={callStats?.total ?? 0}
              sub="All time"
              icon={<BarChart3 size={16} />}
              color="violet"
            />
          </div>
        </div>

        {/* ── Helpdesk Performance ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Helpdesk Performance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard
              title="Total Tickets"
              value={overallMetrics?.totalTickets ?? 0}
              sub="All time"
              icon={<Phone size={16} />}
              color="cyan"
            />
            <MetricCard
              title="Open"
              value={overallMetrics?.status?.open ?? 0}
              sub="Needs attention"
              icon={<AlertTriangle size={16} />}
              color="orange"
            />
            <MetricCard
              title="Resolved"
              value={overallMetrics?.status?.resolved ?? 0}
              sub={`${overallMetrics?.metrics?.resolutionRate?.toFixed(0) ?? 0}% resolution rate`}
              icon={<CheckCircle2 size={16} />}
              color="emerald"
              trend="up"
            />
            <MetricCard
              title="SLA Compliance"
              value={`${overallMetrics?.metrics?.slaComplianceRate?.toFixed(0) ?? 0}%`}
              sub="Last 30 days"
              icon={<Shield size={16} />}
              color="violet"
            />
          </div>
        </div>

        {/* ── Agent Performance Table ── */}
        {agentMetrics && agentMetrics.agents && agentMetrics.agents.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Agent Performance</h2>
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4">Agent</th>
                        <th className="text-right text-xs text-slate-400 font-medium pb-2 pr-4">Assigned</th>
                        <th className="text-right text-xs text-slate-400 font-medium pb-2 pr-4">Resolved</th>
                        <th className="text-right text-xs text-slate-400 font-medium pb-2 pr-4">Resolution Rate</th>
                        <th className="text-right text-xs text-slate-400 font-medium pb-2">Avg Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentMetrics.agents.map((agent: any) => (
                        <tr key={agent.agentId} className="border-b border-slate-800/40 last:border-0">
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                                {(agent.agentName || "?")[0].toUpperCase()}
                              </div>
                              <span className="text-white font-medium">{agent.agentName || `Agent #${agent.agentId}`}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-right text-slate-300">{agent.assignedTickets}</td>
                          <td className="py-2.5 pr-4 text-right text-emerald-400">{agent.resolvedTickets}</td>
                          <td className="py-2.5 pr-4 text-right">
                            <span className={`font-medium ${agent.resolutionRate >= 80 ? "text-emerald-400" : agent.resolutionRate >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                              {agent.resolutionRate?.toFixed(0) ?? 0}%
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-slate-400">
                            {agent.avgResponseTimeHours ? `${agent.avgResponseTimeHours.toFixed(1)}h` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Phone Numbers ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Assigned Phone Numbers</h2>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="pt-4">
              <div className="space-y-3">
                {/* Teams Direct Routing number — always shown as static */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Phone size={14} className="text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-white font-mono font-medium text-sm">(727) 382-5776</div>
                      <div className="text-xs text-slate-400">Teams Direct Routing · Primary Support Line</div>
                    </div>
                  </div>
                  <StatusBadge status="healthy" />
                </div>
                {/* ACS Phone Numbers from API */}
                {acsPhoneLoading && (
                  <div className="text-xs text-slate-500 px-3 py-2">Loading ACS phone numbers...</div>
                )}
                {!acsPhoneLoading && acsPhoneNumbers?.configured === false && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                      <Server size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-400 text-sm font-medium">ACS Phone Numbers</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Add <code className="bg-slate-700 px-1 rounded text-cyan-400">ACS_CONNECTION_STRING</code> in project secrets to show live status
                      </div>
                    </div>
                    <StatusBadge status="unknown" />
                  </div>
                )}
                {!acsPhoneLoading && acsPhoneNumbers?.configured && acsPhoneNumbers.numbers.length === 0 && (
                  <div className="text-xs text-slate-500 px-3 py-2">No ACS phone numbers found in this resource.</div>
                )}
                {!acsPhoneLoading && acsPhoneNumbers?.configured && acsPhoneNumbers.numbers.map((line: any) => (
                  <div key={line.phoneNumber} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                        <PhoneIncoming size={14} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-white font-mono font-medium text-sm">{line.phoneNumber}</div>
                        <div className="text-xs text-slate-400">
                          {line.type === "tollFree" ? "Toll-Free" : line.type} · Azure Communication Services
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Calling: {line.callingCapability} · SMS: {line.smsCapability}
                          {line.purchaseDate && ` · Acquired ${new Date(line.purchaseDate).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={line.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 gap-2"
              onClick={() => window.open("https://admin.teams.microsoft.com/call-queues", "_blank")}
            >
              <Phone size={13} />
              Teams Call Queues
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 gap-2"
              onClick={() => window.open("https://portal.azure.com/#view/Microsoft_Azure_CommunicationServices", "_blank")}
            >
              <Server size={13} />
              ACS Portal
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 gap-2"
              onClick={() => window.open("https://copilotstudio.microsoft.com", "_blank")}
            >
              <Bot size={13} />
              Copilot Studio
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 gap-2"
              onClick={() => window.open("https://dynamics.microsoft.com/en-us/contact-center/", "_blank")}
            >
              <Globe size={13} />
              D365 Contact Center
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50 gap-2"
              onClick={() => window.location.href = "/admin/call-review"}
            >
              <Activity size={13} />
              Call Review
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
