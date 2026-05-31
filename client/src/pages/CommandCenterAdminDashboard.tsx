import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * Command Center Admin Monitoring Dashboard
 * Analytics, system health, command usage, and alert statistics
 */
export default function CommandCenterAdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch admin data
  const commandStats = trpc.commandCenterAdmin.getCommandStats.useQuery({ days: 30 });
  const alertStats = trpc.commandCenterAdmin.getAlertStats.useQuery({ days: 30 });
  const systemHealth = trpc.commandCenterAdmin.getSystemHealth.useQuery();
  const commandTimeline = trpc.commandCenterAdmin.getCommandTimeline.useQuery({ days: 7, interval: "daily" });
  const userActivity = trpc.commandCenterAdmin.getUserActivitySummary.useQuery({ limit: 10 });
  const auditLogs = trpc.commandCenterAdmin.getAuditLogs.useQuery({ limit: 50 });

  const isLoading =
    commandStats.isLoading ||
    alertStats.isLoading ||
    systemHealth.isLoading ||
    commandTimeline.isLoading;

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Command Center Admin Dashboard</h1>
          <p className="text-slate-400">System health, analytics, and monitoring</p>
        </div>

        {/* System Health Overview */}
        {systemHealth.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {systemHealth.data.systemStatus.overall === "operational" ? "✓ Operational" : "⚠ Attention"}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Commands (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {systemHealth.data.last24h.commandsExecuted}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {systemHealth.data.last24h.commandSuccessRate}% success rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Alerts (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {systemHealth.data.last24h.alertsTriggered}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {systemHealth.data.last24h.alertResolutionRate}% resolved
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Audit Logs (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">
                  {systemHealth.data.last24h.auditLogEntries}
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
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {commandTimeline.data && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Command Execution Timeline</CardTitle>
                  <CardDescription>Daily command execution over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {commandTimeline.data.data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={commandTimeline.data.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="timestamp" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#06b6d4"
                          name="Total Commands"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="successful"
                          stroke="#10b981"
                          name="Successful"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="failed"
                          stroke="#ef4444"
                          name="Failed"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-slate-400 py-8">No data available</div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Commands Tab */}
          <TabsContent value="commands" className="space-y-4">
            {commandStats.data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Executed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-cyan-400">{commandStats.data.totalExecuted}</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400">{commandStats.data.successRate}%</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-400">{commandStats.data.totalFailed}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {commandStats.data && Object.keys(commandStats.data.intentStats).length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Commands by Intent</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(commandStats.data.intentStats).map(([intent, count]) => ({
                        intent,
                        count,
                      }))}
                    >
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
            {alertStats.data && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Triggered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-cyan-400">{alertStats.data.totalTriggered}</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Resolved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400">{alertStats.data.totalResolved}</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Unresolved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-400">{alertStats.data.unresolvedCount}</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Avg Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-300">{alertStats.data.avgResolutionTime}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            {userActivity.data && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Top Users</CardTitle>
                  <CardDescription>Most active users in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userActivity.data.map((user: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                        <div>
                          <p className="text-white font-medium">{user.userId}</p>
                          <p className="text-sm text-slate-400">
                            {user.commandCount} commands • {user.successRate}% success
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400 font-bold">{user.topIntent}</p>
                          <p className="text-xs text-slate-400">Most used intent</p>
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
            {auditLogs.data && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Audit Logs</CardTitle>
                  <CardDescription>Latest {auditLogs.data.logs.length} events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {auditLogs.data.logs.map((log: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-700 rounded text-sm">
                        <div className="flex justify-between">
                          <span className="text-cyan-400 font-mono">{log.action}</span>
                          <span className="text-slate-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1">
                          {log.resourceType}: {log.resourceId}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
