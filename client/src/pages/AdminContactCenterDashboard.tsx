/**
 * AdminContactCenterDashboard — Contact Center Monitoring Dashboard
 * Real-time status for: Teams call queue, D365 Contact Center, Copilot Studio,
 * Azure Communication Services, queue metrics, and agent performance.
 * Route: /admin/contact-center-dashboard
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, RefreshCw,
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

  // ── PDF Export ────────────────────────────────────────────────────────────
  const exportToPdf = async () => {
    const timestamp = new Date().toLocaleString();
    const content = `
GIGITEKAI CONTACT CENTER DASHBOARD
Generated: ${timestamp}

D365 STATUS: ${d365Status?.connected ? 'Connected' : 'Disconnected'}
Teams Webhook: ${teamsWebhook?.health?.healthy ? 'Healthy' : 'Unhealthy'}
Copilot Studio: ${copilotStatus?.ticketClassifierConfigured ? 'Configured' : 'Not Configured'}
ACS Status: ${acsStatus?.healthy ? 'Healthy' : 'Unhealthy'}

QUEUE METRICS:
- Queue Depth: ${queueMetrics?.queueDepth || 0}
- Avg Wait Time: ${queueMetrics?.avgWaitTimeMinutes || 'N/A'}
- Resolution Time: ${queueMetrics?.estimatedWaitTime || 'N/A'}

CALL STATISTICS:
- Today's Calls: ${callStats?.todayCalls || 0}
- Pending Tickets: ${callStats?.pending || 0}

AGENT PERFORMANCE:
- Active Agents: ${agentMetrics?.agents?.length || 0}
- Total Agents: ${agentMetrics?.agents?.length || 0}
- Total Assigned Tickets: ${agentMetrics?.totalAssignedTickets || 0}

ACS PHONE NUMBERS:
${acsPhoneNumbers?.numbers?.map((n: any) => `- ${n.phoneNumber}: ${n.status}`).join('\n') || 'No numbers configured'}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── System Health Alerts ──────────────────────────────────────────────────
  const checkSystemHealth = async () => {
    const now = Date.now();
    const alertThreshold = 120000; // 2 minutes
    
    const systemStatus = {
      d365: d365Status?.connected ? 'healthy' : 'degraded',
      teams: teamsWebhook?.health?.healthy ? 'healthy' : 'degraded',
      copilot: copilotStatus?.ticketClassifierConfigured ? 'healthy' : 'degraded',
      acs: acsStatus?.healthy ? 'healthy' : 'degraded',
    };
    
    for (const [system, status] of Object.entries(systemStatus)) {
      if (status === 'degraded') {
        const lastAlert = lastAlertTime[system] || 0;
        if (now - lastAlert > alertThreshold) {
          // Trigger Teams notification
          await trpc.system.notifyOwner.mutate({
            title: `⚠️ Contact Center Alert: ${system.toUpperCase()} Degraded`,
            content: `System: ${system}\nStatus: ${status}\nTime: ${new Date().toLocaleString()}\nDashboard: /admin/contact-center-dashboard`,
          });
          setLastAlertTime(prev => ({ ...prev, [system]: now }));
        }
      }
    }
  };

  // Check health every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [d365Status, teamsWebhook, copilotStatus, acsStatus]);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${s.className}`}>
      {s.icon}
      {s.label}
    </span>
  );
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

  // ── PDF Export ────────────────────────────────────────────────────────────
  const exportToPdf = async () => {
    const timestamp = new Date().toLocaleString();
    const content = `
GIGITEKAI CONTACT CENTER DASHBOARD
Generated: ${timestamp}

D365 STATUS: ${d365Status?.connected ? 'Connected' : 'Disconnected'}
Teams Webhook: ${teamsWebhook?.health?.healthy ? 'Healthy' : 'Unhealthy'}
Copilot Studio: ${copilotStatus?.ticketClassifierConfigured ? 'Configured' : 'Not Configured'}
ACS Status: ${acsStatus?.healthy ? 'Healthy' : 'Unhealthy'}

QUEUE METRICS:
- Queue Depth: ${queueMetrics?.queueDepth || 0}
- Avg Wait Time: ${queueMetrics?.avgWaitTimeMinutes || 'N/A'}
- Resolution Time: ${queueMetrics?.estimatedWaitTime || 'N/A'}

CALL STATISTICS:
- Today's Calls: ${callStats?.todayCalls || 0}
- Pending Tickets: ${callStats?.pending || 0}

AGENT PERFORMANCE:
- Active Agents: ${agentMetrics?.agents?.length || 0}
- Total Agents: ${agentMetrics?.agents?.length || 0}
- Total Assigned Tickets: ${agentMetrics?.totalAssignedTickets || 0}

ACS PHONE NUMBERS:
${acsPhoneNumbers?.numbers?.map((n: any) => `- ${n.phoneNumber}: ${n.status}`).join('\n') || 'No numbers configured'}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── System Health Alerts ──────────────────────────────────────────────────
  const checkSystemHealth = async () => {
    const now = Date.now();
    const alertThreshold = 120000; // 2 minutes
    
    const systemStatus = {
      d365: d365Status?.connected ? 'healthy' : 'degraded',
      teams: teamsWebhook?.health?.healthy ? 'healthy' : 'degraded',
      copilot: copilotStatus?.ticketClassifierConfigured ? 'healthy' : 'degraded',
      acs: acsStatus?.healthy ? 'healthy' : 'degraded',
    };
    
    for (const [system, status] of Object.entries(systemStatus)) {
      if (status === 'degraded') {
        const lastAlert = lastAlertTime[system] || 0;
        if (now - lastAlert > alertThreshold) {
          // Trigger Teams notification
          await trpc.system.notifyOwner.mutate({
            title: `⚠️ Contact Center Alert: ${system.toUpperCase()} Degraded`,
            content: `System: ${system}\nStatus: ${status}\nTime: ${new Date().toLocaleString()}\nDashboard: /admin/contact-center-dashboard`,
          });
          setLastAlertTime(prev => ({ ...prev, [system]: now }));
        }
      }
    }
  };

  // Check health every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [d365Status, teamsWebhook, copilotStatus, acsStatus]);

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
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  detail?: string;
  configured?: boolean;
}) {

  // ── PDF Export ────────────────────────────────────────────────────────────
  const exportToPdf = async () => {
    const timestamp = new Date().toLocaleString();
    const content = `
GIGITEKAI CONTACT CENTER DASHBOARD
Generated: ${timestamp}

D365 STATUS: ${d365Status?.connected ? 'Connected' : 'Disconnected'}
Teams Webhook: ${teamsWebhook?.health?.healthy ? 'Healthy' : 'Unhealthy'}
Copilot Studio: ${copilotStatus?.ticketClassifierConfigured ? 'Configured' : 'Not Configured'}
ACS Status: ${acsStatus?.healthy ? 'Healthy' : 'Unhealthy'}

QUEUE METRICS:
- Queue Depth: ${queueMetrics?.queueDepth || 0}
- Avg Wait Time: ${queueMetrics?.avgWaitTimeMinutes || 'N/A'}
- Resolution Time: ${queueMetrics?.estimatedWaitTime || 'N/A'}

CALL STATISTICS:
- Today's Calls: ${callStats?.todayCalls || 0}
- Pending Tickets: ${callStats?.pending || 0}

AGENT PERFORMANCE:
- Active Agents: ${agentMetrics?.agents?.length || 0}
- Total Agents: ${agentMetrics?.agents?.length || 0}
- Total Assigned Tickets: ${agentMetrics?.totalAssignedTickets || 0}

ACS PHONE NUMBERS:
${acsPhoneNumbers?.numbers?.map((n: any) => `- ${n.phoneNumber}: ${n.status}`).join('\n') || 'No numbers configured'}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── System Health Alerts ──────────────────────────────────────────────────
  const checkSystemHealth = async () => {
    const now = Date.now();
    const alertThreshold = 120000; // 2 minutes
    
    const systemStatus = {
      d365: d365Status?.connected ? 'healthy' : 'degraded',
      teams: teamsWebhook?.health?.healthy ? 'healthy' : 'degraded',
      copilot: copilotStatus?.ticketClassifierConfigured ? 'healthy' : 'degraded',
      acs: acsStatus?.healthy ? 'healthy' : 'degraded',
    };
    
    for (const [system, status] of Object.entries(systemStatus)) {
      if (status === 'degraded') {
        const lastAlert = lastAlertTime[system] || 0;
        if (now - lastAlert > alertThreshold) {
          // Trigger Teams notification
          await trpc.system.notifyOwner.mutate({
            title: `⚠️ Contact Center Alert: ${system.toUpperCase()} Degraded`,
            content: `System: ${system}\nStatus: ${status}\nTime: ${new Date().toLocaleString()}\nDashboard: /admin/contact-center-dashboard`,
          });
          setLastAlertTime(prev => ({ ...prev, [system]: now }));
        }
      }
    }
  };

  // Check health every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [d365Status, teamsWebhook, copilotStatus, acsStatus]);

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
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminContactCenterDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState<30000 | 60000 | null>(30000);
  const [lastAlertTime, setLastAlertTime] = useState<Record<string, number>>({});

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: d365Status, isLoading: d365Loading } = trpc.dynamicsIntegration.checkConnection.useQuery(undefined, {
    refetchInterval: refreshInterval || undefined,
  });

  const { data: copilotStatus, isLoading: copilotLoading } = trpc.copilotStudio.getAgentStatus.useQuery(undefined, {
    refetchInterval: refreshInterval || undefined,
  });

  const { data: teamsWebhook, isLoading: teamsLoading } = trpc.teamsChannels.getWebhookHealth.useQuery(undefined, {
    refetchInterval: refreshInterval || undefined,
  });

  const { data: queueMetrics, isLoading: queueLoading } = trpc.helpdeskDashboardMetrics.getQueueMetrics.useQuery(undefined, {
    refetchInterval: refreshInterval || undefined,
  });

  const { data: overallMetrics, isLoading: metricsLoading } = trpc.helpdeskDashboardMetrics.getOverallMetrics.useQuery(undefined, {
    refetchInterval: refreshInterval || undefined,
  });

  const { data: callStats, isLoading: callsLoading } = trpc.calls.getStats.useQuery(undefined, {
    refetchInterval: refreshInterval || undefined,
  });

  const { data: agentMetrics, isLoading: agentsLoading } = trpc.helpdeskDashboardMetrics.getAgentMetrics.useQuery(undefined, {
    refetchInterval: refreshInterval || undefined,
  });
  const { data: acsPhoneNumbers, isLoading: acsPhoneLoading } = trpc.acs.getPhoneNumbers.useQuery(undefined, {
    refetchInterval: refreshInterval || undefined,
  });
  const { data: acsStatus } = trpc.acs.getStatus.useQuery(undefined, {
    refetchInterval: refreshInterval || undefined,
  });

  const isLoading = d365Loading || copilotLoading || teamsLoading || queueLoading || metricsLoading || callsLoading;

  const refresh = () => setRefreshKey((k) => k + 1);

  // ── Derived status values ─────────────────────────────────────────────────
  const d365StatusValue = d365Status?.status ?? "unknown";
  const teamsWebhookStatus = teamsWebhook?.health?.healthy === true ? "healthy" : teamsWebhook?.health?.configured === false ? "error" : "unknown";
  const copilotConfigured = copilotStatus?.tenantId === "configured" && copilotStatus?.environmentId === "configured";


  // ── PDF Export ────────────────────────────────────────────────────────────
  const exportToPdf = async () => {
    const timestamp = new Date().toLocaleString();
    const content = `
GIGITEKAI CONTACT CENTER DASHBOARD
Generated: ${timestamp}

D365 STATUS: ${d365Status?.connected ? 'Connected' : 'Disconnected'}
Teams Webhook: ${teamsWebhook?.health?.healthy ? 'Healthy' : 'Unhealthy'}
Copilot Studio: ${copilotStatus?.ticketClassifierConfigured ? 'Configured' : 'Not Configured'}
ACS Status: ${acsStatus?.healthy ? 'Healthy' : 'Unhealthy'}

QUEUE METRICS:
- Queue Depth: ${queueMetrics?.queueDepth || 0}
- Avg Wait Time: ${queueMetrics?.avgWaitTimeMinutes || 'N/A'}
- Resolution Time: ${queueMetrics?.estimatedWaitTime || 'N/A'}

CALL STATISTICS:
- Today's Calls: ${callStats?.todayCalls || 0}
- Pending Tickets: ${callStats?.pending || 0}

AGENT PERFORMANCE:
- Active Agents: ${agentMetrics?.agents?.length || 0}
- Total Agents: ${agentMetrics?.agents?.length || 0}
- Total Assigned Tickets: ${agentMetrics?.totalAssignedTickets || 0}

ACS PHONE NUMBERS:
${acsPhoneNumbers?.numbers?.map((n: any) => `- ${n.phoneNumber}: ${n.status}`).join('\n') || 'No numbers configured'}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── System Health Alerts ──────────────────────────────────────────────────
  const checkSystemHealth = async () => {
    const now = Date.now();
    const alertThreshold = 120000; // 2 minutes
    
    const systemStatus = {
      d365: d365Status?.connected ? 'healthy' : 'degraded',
      teams: teamsWebhook?.health?.healthy ? 'healthy' : 'degraded',
      copilot: copilotStatus?.ticketClassifierConfigured ? 'healthy' : 'degraded',
      acs: acsStatus?.healthy ? 'healthy' : 'degraded',
    };
    
    for (const [system, status] of Object.entries(systemStatus)) {
      if (status === 'degraded') {
        const lastAlert = lastAlertTime[system] || 0;
        if (now - lastAlert > alertThreshold) {
          // Trigger Teams notification
          await trpc.system.notifyOwner.mutate({
            title: `⚠️ Contact Center Alert: ${system.toUpperCase()} Degraded`,
            content: `System: ${system}\nStatus: ${status}\nTime: ${new Date().toLocaleString()}\nDashboard: /admin/contact-center-dashboard`,
          });
          setLastAlertTime(prev => ({ ...prev, [system]: now }));
        }
      }
    }
  };

  // Check health every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [d365Status, teamsWebhook, copilotStatus, acsStatus]);

  return (
    <AdminLayout title="Contact Center Dashboard">
      
        <div className="flex items-center gap-2">
          <select
            value={refreshInterval === 30000 ? '30' : refreshInterval === 60000 ? '60' : 'manual'}
            onChange={(e) => {
              const val = e.target.value;
              setRefreshInterval(val === '30' ? 30000 : val === '60' ? 60000 : null);
            }}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 hover:border-slate-600"
          >
            <option value="30">Refresh: 30s</option>
            <option value="60">Refresh: 60s</option>
            <option value="manual">Manual</option>
          </select>
          <Button
            onClick={exportToPdf}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <BarChart3 size={16} />
            Export PDF
          </Button>
          <Button
            onClick={() => setRefreshKey(k => k + 1)}
            variant="outline"
            size="sm"
          >
            <RefreshCw size={16} />
          </Button>
        </div>

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Headphones size={20} className="text-cyan-400" />
              Contact Center Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Real-time monitoring — Teams · D365 · Copilot Studio · ACS
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-slate-400 hover:text-white gap-2 text-xs"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* ── Integration Status Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* D365 + Teams */}
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
              />
              <IntegrationStatusRow
                icon={<MessageSquare size={14} />}
                label="Teams Webhook"
                status={teamsWebhookStatus}
                detail={teamsWebhook?.health?.configured ? `Webhook configured · Last check: ${teamsWebhook?.health?.lastCheckedAt ? new Date(teamsWebhook.health.lastCheckedAt).toLocaleTimeString() : 'never'}` : 'Webhook not configured'}
              />
              <IntegrationStatusRow
                icon={<Bot size={14} />}
                label="Copilot Studio Voice Agent"
                status={copilotConfigured ? "healthy" : "degraded"}
                detail={copilotConfigured ? "Tenant + Environment configured" : "Missing tenant or environment ID"}
                configured={copilotConfigured}
              />
              <IntegrationStatusRow
                icon={<Server size={14} />}
                label="Azure Communication Services"
                status={acsStatus?.healthy ? "healthy" : acsStatus?.configured === false ? "error" : "unknown"}
                detail={acsStatus?.message ?? "ACS telephony channel"}
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
              />
              <IntegrationStatusRow
                icon={<MessageSquare size={14} />}
                label="KB Q&A Agent"
                status={copilotStatus?.kbQAConfigured ? "healthy" : "error"}
                detail={copilotStatus?.kbQAConfigured ? "Agent ID configured" : "Agent ID not configured"}
              />
              <IntegrationStatusRow
                icon={<Shield size={14} />}
                label="Tenant Configuration"
                status={copilotStatus?.tenantId === "configured" ? "healthy" : "error"}
                detail={`Tenant: ${copilotStatus?.tenantId ?? "unknown"} · Env: ${copilotStatus?.environmentId ?? "unknown"}`}
              />
              <IntegrationStatusRow
                icon={<Activity size={14} />}
                label="Voice Routing (IVR)"
                status={copilotConfigured ? "healthy" : "degraded"}
                detail="Copilot Studio → Teams Call Queue routing"
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

        {/* ── Queue Metrics ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Support Queue Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard
              title="Unassigned"
              value={queueMetrics?.queueDepth?.unassigned ?? 0}
              sub="Need assignment"
              icon={<Users size={16} />}
              color="orange"
            />
            <MetricCard
              title="Waiting Response"
              value={queueMetrics?.queueDepth?.waitingForResponse ?? 0}
              sub="Open tickets"
              icon={<Clock size={16} />}
              color="cyan"
            />
            <MetricCard
              title="In Progress"
              value={queueMetrics?.queueDepth?.inProgress ?? 0}
              sub="Being worked"
              icon={<Activity size={16} />}
              color="emerald"
            />
            <MetricCard
              title="Avg Wait"
              value={queueMetrics?.estimatedWaitTime ?? "—"}
              sub={`${queueMetrics?.urgentTickets ?? 0} critical tickets`}
              icon={<Zap size={16} />}
              color={queueMetrics?.urgentTickets && queueMetrics.urgentTickets > 0 ? "red" : "emerald"}
            />
          </div>
        </div>

        {/* ── Ticket Metrics ── */}
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

        {/* ── Agent Performance ── */}
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
                {/* Teams Direct Routing number — always shown as static (not in ACS) */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                      <PhoneIncoming size={14} className="text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-white font-mono font-medium text-sm">+1 813-467-9582</div>
                      <div className="text-xs text-slate-400">GigitekAI Support Queue · Teams Direct Routing</div>
                      <div className="text-xs text-slate-500 mt-0.5">Round-robin · 3 agents · Voicemail fallback</div>
                    </div>
                  </div>
                  <StatusBadge status="healthy" />
                </div>
                {/* ACS-acquired numbers — live from API */}
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
                        Add <code className="bg-slate-700 px-1 rounded text-cyan-400">ACS_CONNECTION_STRING</code> in project secrets to show live status for 844-421-2441 and 866-683-1117
                      </div>
                    </div>
                    <StatusBadge status="unknown" />
                  </div>
                )}
                {!acsPhoneLoading && acsPhoneNumbers?.configured && acsPhoneNumbers.numbers.length === 0 && (
                  <div className="text-xs text-slate-500 px-3 py-2">No ACS phone numbers found in this resource.</div>
                )}
                {!acsPhoneLoading && acsPhoneNumbers?.configured && acsPhoneNumbers.numbers.map((line) => (
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
