import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Activity, AlertTriangle, BarChart3 } from "lucide-react";

/**
 * Audit Analytics Component for Command Center
 * Displays command trends, user activity heatmap, failure patterns, and most-used intents
 */
export function CommandCenterAuditAnalytics() {
  // Fetch analytics data
  const { data: trendsData, isLoading: trendsLoading } = trpc.auditAnalytics.getCommandTrends.useQuery({
    days: 30,
    interval: "daily",
  });

  const { data: heatmapData, isLoading: heatmapLoading } = trpc.auditAnalytics.getUserActivityHeatmap.useQuery({
    days: 30,
  });

  const { data: failureData, isLoading: failureLoading } = trpc.auditAnalytics.getFailurePatterns.useQuery({
    days: 30,
    limit: 10,
  });

  const { data: intentsData, isLoading: intentsLoading } = trpc.auditAnalytics.getMostUsedIntents.useQuery({
    days: 30,
    limit: 10,
  });

  const { data: auditStatsData, isLoading: auditStatsLoading } = trpc.auditAnalytics.getAuditStats.useQuery({
    days: 30,
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="trends">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="heatmap">
            <Activity className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="failures">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Failures
          </TabsTrigger>
          <TabsTrigger value="intents">
            <BarChart3 className="w-4 h-4 mr-2" />
            Top Intents
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Command Execution Trends
              </CardTitle>
              <CardDescription>Daily command execution over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : trendsData?.trends && trendsData.trends.length > 0 ? (
                <div className="space-y-4">
                  {/* Simple bar chart representation */}
                  <div className="h-64 bg-slate-700 rounded-lg p-4 flex items-end gap-1">
                    {trendsData.trends.map((trend: any, idx: number) => {
                      const maxCount = Math.max(...trendsData.trends.map((t: any) => t.count));
                      const height = (trend.count / maxCount) * 100;
                      return (
                        <div
                          key={idx}
                          className="flex-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t hover:opacity-80 transition-opacity"
                          style={{ height: `${height}%`, minHeight: "4px" }}
                          title={`${trend.date}: ${trend.count} commands (${trend.success} success, ${trend.failed} failed)`}
                        />
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-slate-700 p-3 rounded">
                      <p className="text-slate-400">Total Commands</p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {trendsData.trends.reduce((sum: number, t: any) => sum + t.count, 0)}
                      </p>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                      <p className="text-slate-400">Avg Daily</p>
                      <p className="text-2xl font-bold text-green-400">
                        {(trendsData.trends.reduce((sum: number, t: any) => sum + t.count, 0) / trendsData.trends.length).toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                      <p className="text-slate-400">Success Rate</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {trendsData.trends.length > 0
                          ? (
                              (trendsData.trends.reduce((sum: number, t: any) => sum + t.success, 0) /
                                trendsData.trends.reduce((sum: number, t: any) => sum + t.count, 0)) *
                              100
                            ).toFixed(1)
                          : "0"}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p>No trend data available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                User Activity Heatmap
              </CardTitle>
              <CardDescription>Command execution by time of day and day of week</CardDescription>
            </CardHeader>
            <CardContent>
              {heatmapLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : heatmapData?.heatmap && heatmapData.heatmap.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-slate-700 p-4 rounded-lg overflow-x-auto">
                    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(30px, 1fr))" }}>
                      {heatmapData.heatmap.map((cell: any, idx: number) => {
                        const maxValue = Math.max(...heatmapData.heatmap.map((c: any) => c.value));
                        const intensity = maxValue > 0 ? cell.value / maxValue : 0;
                        const bgColor = intensity === 0 ? "bg-slate-600" : `bg-opacity-${Math.round(intensity * 100)}`;
                        return (
                          <div
                            key={idx}
                            className={`h-8 rounded ${bgColor} bg-cyan-500 transition-all hover:ring-2 hover:ring-cyan-300`}
                            title={`${cell.day} ${cell.hour}:00 - ${cell.value} commands`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Darker = More activity</p>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p>No activity data available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failures Tab */}
        <TabsContent value="failures">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Failure Patterns
              </CardTitle>
              <CardDescription>Top failed commands and error patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {failureLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : failureData?.patterns && failureData.patterns.length > 0 ? (
                <div className="space-y-3">
                  {failureData.patterns.map((pattern: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-700 rounded-lg border-l-4 border-red-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium">{pattern.intent}</p>
                          <p className="text-xs text-slate-400 mt-1">{pattern.errorSample}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-400">{pattern.count}</p>
                          <p className="text-xs text-slate-400">failures</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p>No failures recorded. Great job!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Intents Tab */}
        <TabsContent value="intents">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Most Used Commands
              </CardTitle>
              <CardDescription>Top 10 commands by execution frequency</CardDescription>
            </CardHeader>
            <CardContent>
              {intentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : intentsData?.intents && intentsData.intents.length > 0 ? (
                <div className="space-y-3">
                  {intentsData.intents.map((intent: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-medium">{idx + 1}. {intent.intent}</p>
                        <div className="text-right">
                          <p className="text-lg font-bold text-cyan-400">{intent.count}</p>
                          <p className="text-xs text-slate-400">executions</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span className="text-slate-400">Success Rate:</span>
                          <span className="text-green-400 ml-1 font-medium">{intent.successRate}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Avg Time:</span>
                          <span className="text-yellow-400 ml-1 font-medium">{intent.avgExecutionTime}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p>No command data available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audit Statistics Card */}
      {auditStatsData && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Audit Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700 p-4 rounded">
                <p className="text-slate-400 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-cyan-400">{auditStatsData.stats.totalAuditEvents}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded">
                <p className="text-slate-400 text-sm">Success Rate</p>
                <p className="text-3xl font-bold text-green-400">{auditStatsData.stats.successRate}%</p>
              </div>
              <div className="bg-slate-700 p-4 rounded">
                <p className="text-slate-400 text-sm">Period</p>
                <p className="text-lg font-bold text-yellow-400">{auditStatsData.period}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
