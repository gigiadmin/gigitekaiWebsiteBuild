import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { Loader2, Wifi, WifiOff, BarChart3 } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { CommandCenterAISuggestions } from "@/components/CommandCenterAISuggestions";
import { CommandCenterAuditAnalytics } from "@/components/CommandCenterAuditAnalytics";

/**
 * Command Center Admin Monitoring Dashboard
 * Real-time analytics, system health, command usage, and alert statistics
 * 
 * Fetches live data from backend commandCenterAdmin router procedures.
 * WebSocket integration for real-time updates.
 */
export default function CommandCenterAdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [timeRange, setTimeRange] = useState(7);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  // Fetch real data from backend
  const { data: systemHealthData } = trpc.commandCenterAdmin.getSystemHealth.useQuery();
  const { data: commandStatsData } = trpc.commandCenterAdmin.getCommandStats.useQuery({ days: timeRange });
  const { data: alertStatsData } = trpc.commandCenterAdmin.getAlertStats.useQuery({ days: timeRange });
  const { data: commandTimelineData } = trpc.commandCenterAdmin.getCommandTimeline.useQuery({ days: timeRange, interval: "daily" });
  const { data: userActivityData } = trpc.commandCenterAdmin.getUserActivitySummary.useQuery({ limit: 10 });
  const { data: auditLogsData } = trpc.commandCenterAdmin.getAuditLogs.useQuery({ limit: 50 });

  // WebSocket integration for real-time updates
  const { connected, connectionStatus } = useWebSocket({
    onCommandExecuted: (data) => {
      setRecentEvents(prev => [{ type: 'command.executed', ...data }, ...prev].slice(0, 20));
    },
    onAlertTriggered: (data) => {
      setRecentEvents(prev => [{ type: 'alert.triggered', ...data }, ...prev].slice(0, 20));
    },
    onAlertResolved: (data) => {
      setRecentEvents(prev => [{ type: 'alert.resolved', ...data }, ...prev].slice(0, 20));
    },
    onSystemHealth: (data) => {
      console.log('[Dashboard] System health update:', data);
    },
    autoConnect: true,
  });

  const COLORS = ["#00D4FF", "#00A8CC", "#0077B6", "#03045E", "#0096C7"];

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with WebSocket Status */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Command Center Admin Dashboard</h1>
            <p className="text-slate-400">Real-time system health, analytics, and monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-900 rounded-lg">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-900 rounded-lg">
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          {[1, 7, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === days
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Last {days}d
            </button>
          ))}
        </div>

        {/* System Health Overview */}
        {systemHealthData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {systemHealthData.systemStatus?.overall === "operational" ? "✓ Operational" : "⚠ Attention"}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Commands (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {systemHealthData.last24h?.commandsExecuted || 0}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {systemHealthData.last24h?.commandSuccessRate || 0}% success rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Alerts (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {systemHealthData.last24h?.alertsTriggered || 0}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {systemHealthData.last24h?.alertResolutionRate || 0}% resolved
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Audit Logs (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {systemHealthData.last24h?.auditLogEntries || 0}
                </div>
                <p className="text-xs text-slate-400 mt-1">Events logged</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="events">Real-Time Events</TabsTrigger>
            <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {commandTimelineData?.data && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Command Execution Timeline</CardTitle>
                  <CardDescription>Daily command execution over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={commandTimelineData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="timestamp" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#06b6d4" name="Total Commands" strokeWidth={2} />
                      <Line type="monotone" dataKey="successful" stroke="#10b981" name="Successful" strokeWidth={2} />
                      <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Commands Tab */}
          <TabsContent value="commands" className="space-y-4">
            {commandStatsData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Executed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-cyan-400">{commandStatsData.totalExecuted}</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400">{commandStatsData.successRate}%</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-400">{commandStatsData.totalFailed}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {commandStatsData && Object.keys(commandStatsData.intentStats || {}).length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Commands by Intent</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(commandStatsData.intentStats).map(([intent, count]) => ({ intent, count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="intent" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Bar dataKey="count" fill="#06b6d4" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {alertStatsData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Triggered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-cyan-400">{alertStatsData.totalTriggered}</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Resolved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400">{alertStatsData.totalResolved}</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Unresolved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-400">{alertStatsData.unresolvedCount}</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Avg Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-300">{alertStatsData.avgResolutionTime}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            {userActivityData && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Top Users</CardTitle>
                  <CardDescription>Most active users in the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userActivityData.map((user, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                        <div>
                          <p className="text-white font-medium">{user.userId}</p>
                          <p className="text-sm text-slate-400">{user.commandCount} commands • {user.topIntent}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">{user.successRate}%</p>
                          <p className="text-xs text-slate-400">success rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            {auditLogsData?.logs && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Audit Logs</CardTitle>
                  <CardDescription>Latest system events and actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {auditLogsData.logs.map((log, idx) => (
                      <div key={idx} className="text-xs p-3 bg-slate-700 rounded border-l-2 border-cyan-500">
                        <p className="text-white font-medium">{log.action}</p>
                        <p className="text-slate-400">{log.resource}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Real-Time Events Tab */}
          <TabsContent value="events">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Real-Time Events</CardTitle>
                <CardDescription>Live WebSocket events from the Command Center</CardDescription>
              </CardHeader>
              <CardContent>
                {recentEvents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No real-time events yet. Waiting for events...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentEvents.map((event, idx) => (
                      <div key={idx} className="text-xs p-3 bg-slate-700 rounded border-l-2 border-green-500">
                        <p className="text-white font-medium">
                          {event.type === 'command.executed' && '⚡ Command Executed'}
                          {event.type === 'alert.triggered' && '🚨 Alert Triggered'}
                          {event.type === 'alert.resolved' && '✓ Alert Resolved'}
                        </p>
                        <p className="text-slate-400 mt-1">{JSON.stringify(event, null, 2).substring(0, 100)}...</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Suggestions Tab */}
          <TabsContent value="ai">
            <CommandCenterAISuggestions />
          </TabsContent>

          {/* Audit Analytics Tab */}
          <TabsContent value="analytics">
            <CommandCenterAuditAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
