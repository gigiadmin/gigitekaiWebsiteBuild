import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Fetch metrics
  const overallMetrics = trpc.helpdeskDashboardMetrics.getOverallMetrics.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const agentMetrics = trpc.helpdeskDashboardMetrics.getAgentMetrics.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const queueMetrics = trpc.helpdeskDashboardMetrics.getQueueMetrics.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const slaBreaches = trpc.helpdeskDashboardMetrics.getSlaBreaches.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const snapshot = trpc.helpdeskDashboardMetrics.getDashboardSnapshot.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const isLoading = overallMetrics.isLoading || agentMetrics.isLoading || queueMetrics.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const metrics = overallMetrics.data;
  const agents = agentMetrics.data;
  const queue = queueMetrics.data;
  const snap = snapshot.data;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Helpdesk Dashboard</h1>
          <p className="text-slate-400">Real-time monitoring of helpdesk metrics and agent performance</p>
        </div>

        {/* System Health */}
        {snap && (
          <div className={`mb-8 p-4 rounded-lg border-2 ${snap.snapshot.systemHealth === "Healthy" ? "border-green-500 bg-green-500/10" : snap.snapshot.systemHealth === "Warning" ? "border-yellow-500 bg-yellow-500/10" : "border-red-500 bg-red-500/10"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">System Health: {snap.snapshot.systemHealth}</h2>
                <p className="text-slate-400 text-sm">Last updated: {new Date(snap.timestamp).toLocaleTimeString()}</p>
              </div>
              {snap && snap.snapshot.slaBreach > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{snap.snapshot.slaBreach} SLA breaches</span>
                </div>
              )}           </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Tickets */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{snap?.snapshot.totalTickets || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                {snap?.snapshot.openTickets || 0} open, {snap?.snapshot.inProgressTickets || 0} in progress
              </p>
            </CardContent>
          </Card>

          {/* Unassigned Tickets */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Unassigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{queue?.queueDepth.unassigned || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Avg wait: {queue?.avgWaitTimeMinutes || 0} min</p>
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                SLA Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{metrics?.metrics.slaComplianceRate || 0}%</div>
              <p className="text-xs text-slate-500 mt-1">{slaBreaches?.data?.totalBreaches || 0} breaches</p>
            </CardContent>
          </Card>

          {/* Critical Tickets */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{snap?.snapshot.criticalTickets || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Ticket Status */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Ticket Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Open</span>
                      <span className="font-semibold text-cyan-400">{metrics.status.open}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${(metrics.status.open / metrics.totalTickets) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">In Progress</span>
                      <span className="font-semibold text-blue-400">{metrics.status.inProgress}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(metrics.status.inProgress / metrics.totalTickets) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Resolved</span>
                      <span className="font-semibold text-green-400">{metrics.status.resolved}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(metrics.status.resolved / metrics.totalTickets) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Closed</span>
                      <span className="font-semibold text-slate-400">{metrics.status.closed}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-slate-500 h-2 rounded-full" style={{ width: `${(metrics.status.closed / metrics.totalTickets) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">🔴 Critical</span>
                    <span className="font-semibold">{metrics.priority.critical}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-400">🟠 High</span>
                    <span className="font-semibold">{metrics.priority.high}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400">🟡 Medium</span>
                    <span className="font-semibold">{metrics.priority.medium}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400">🟢 Low</span>
                    <span className="font-semibold">{metrics.priority.low}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Avg Response Time</span>
                      <span className="font-semibold text-cyan-400">{metrics.metrics.avgResponseTimeHours.toFixed(1)}h</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Resolution Rate</span>
                      <span className="font-semibold text-green-400">{metrics.metrics.resolutionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Tickets (24h)</span>
                      <span className="font-semibold text-blue-400">{metrics.trends.last24h}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Tickets (7d)</span>
                      <span className="font-semibold text-blue-400">{metrics.trends.last7d}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agent Performance */}
        {agents && agents.agents.length > 0 && (
          <Card className="bg-slate-900 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-500" />
                Agent Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-2 text-slate-400">Agent</th>
                      <th className="text-center py-2 px-2 text-slate-400">Assigned</th>
                      <th className="text-center py-2 px-2 text-slate-400">Resolved</th>
                      <th className="text-center py-2 px-2 text-slate-400">Open</th>
                      <th className="text-center py-2 px-2 text-slate-400">Resolution %</th>
                      <th className="text-center py-2 px-2 text-slate-400">SLA %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.agents.map((agent) => (
                      <tr key={agent.agentId} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                        <td className="py-3 px-2 text-cyan-400">{agent.agentName}</td>
                        <td className="text-center py-3 px-2">{agent.assignedTickets}</td>
                        <td className="text-center py-3 px-2 text-green-400">{agent.resolvedTickets}</td>
                        <td className="text-center py-3 px-2 text-yellow-400">{agent.openTickets}</td>
                        <td className="text-center py-3 px-2">
                          <span className={agent.resolutionRate > 75 ? "text-green-400" : "text-yellow-400"}>{agent.resolutionRate.toFixed(1)}%</span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={agent.slaComplianceRate > 90 ? "text-green-400" : "text-yellow-400"}>{agent.slaComplianceRate.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-refresh Control */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setRefreshInterval(5000)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${refreshInterval === 5000 ? "bg-cyan-500 text-black" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
          >
            5s
          </button>
          <button
            onClick={() => setRefreshInterval(10000)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${refreshInterval === 10000 ? "bg-cyan-500 text-black" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
          >
            10s
          </button>
          <button
            onClick={() => setRefreshInterval(30000)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${refreshInterval === 30000 ? "bg-cyan-500 text-black" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
          >
            30s
          </button>
          <button
            onClick={() => {
              overallMetrics.refetch();
              agentMetrics.refetch();
              queueMetrics.refetch();
              slaBreaches.refetch();
              snapshot.refetch();
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
