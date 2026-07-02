/**
 * MasterMetricsDashboard — Unified metrics page combining:
 * - Admin Metrics (ticket KPIs, status breakdown, category/priority charts)
 * - Helpdesk Metrics (ticket creation trend, resolution time, closing note themes)
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Clock, CheckCircle, AlertCircle, MessageSquare, RefreshCw, TrendingUp, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumb";
import AdminLayout from "@/components/AdminLayout";

export default function MasterMetricsDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  // Fetch metrics from both sources
  const { data: metrics, isLoading, error, refetch } = trpc.helpdesk.getMetrics.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const { data: allTickets = [] } = trpc.helpdesk.getAllTickets.useQuery(
    undefined,
    { refetchInterval: 60000 }
  );

  const { data: closedTickets = [] } = trpc.helpdesk.getClosedTicketsReport.useQuery(
    { days: 90 },
    { refetchInterval: 60000 }
  );

  // Calculate combined metrics
  const combinedMetrics = useMemo(() => {
    const total = allTickets.length;
    const open = allTickets.filter((t: any) => t.status === "open").length;
    const inProgress = allTickets.filter((t: any) => t.status === "in_progress").length;
    const resolved = allTickets.filter((t: any) => t.status === "resolved").length;
    const closed = allTickets.filter((t: any) => t.status === "closed").length;

    // Calculate average resolution time
    const resolutionTimes = closedTickets
      .map((t: any) => (new Date(t.closedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60))
      .filter((t: number) => t > 0);

    const avgResolutionTime = resolutionTimes.length > 0
      ? (resolutionTimes.reduce((a: number, b: number) => a + b, 0) / resolutionTimes.length).toFixed(1)
      : 0;

    // Calculate median resolution time
    const sortedTimes = [...resolutionTimes].sort((a: number, b: number) => a - b);
    const medianResolutionTime = sortedTimes.length > 0
      ? sortedTimes[Math.floor(sortedTimes.length / 2)].toFixed(1)
      : 0;

    // Analyze closing note themes
    const closingNoteThemes: { [key: string]: number } = {};
    closedTickets.forEach((t: any) => {
      if (t.closingNotes) {
        const themes = t.closingNotes.split(",").map((s: string) => s.trim());
        themes.forEach((theme: string) => {
          closingNoteThemes[theme] = (closingNoteThemes[theme] || 0) + 1;
        });
      }
    });

    // Get top 5 themes
    const topThemes = Object.entries(closingNoteThemes)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([theme, count]) => ({ name: theme, value: count }));

    // Ticket creation trend (last 30 days)
    const creationTrend: { [key: string]: number } = {};
    allTickets.forEach((t: any) => {
      const date = new Date(t.createdAt).toISOString().split("T")[0];
      creationTrend[date] = (creationTrend[date] || 0) + 1;
    });

    const trendData = Object.entries(creationTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, count]) => ({ date, count }));

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      avgResolutionTime,
      medianResolutionTime,
      topThemes,
      trendData,
    };
  }, [allTickets, closedTickets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    toast.success("Metrics refreshed");
    setRefreshing(false);
  };

  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: combinedMetrics,
      tickets: allTickets,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast.success("Metrics exported");
  };

  if (isLoading) {
    return (
      <AdminLayout title="Master Metrics Dashboard" noPadding>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-8 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400">Loading unified metrics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Master Metrics Dashboard" noPadding>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-8 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-semibold mb-1">Failed to load metrics</p>
            <p className="text-slate-500 text-sm mb-4">{error.message}</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors">
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const totalTickets = combinedMetrics.total;
  const openTickets = combinedMetrics.open + combinedMetrics.inProgress;
  const resolvedTickets = combinedMetrics.resolved + combinedMetrics.closed;
  const avgResolutionHours = combinedMetrics.avgResolutionTime;

  // Ticket status breakdown for pie chart
  const statusData = [
    { name: "Open", value: combinedMetrics.open, fill: "#FBBF24" },
    { name: "In Progress", value: combinedMetrics.inProgress, fill: "#60A5FA" },
    { name: "Resolved", value: combinedMetrics.resolved, fill: "#34D399" },
    { name: "Closed", value: combinedMetrics.closed, fill: "#6B7280" },
  ].filter(d => d.value > 0);

  // Priority breakdown
  const priorityData = [
    { name: "Critical", value: metrics?.byPriority?.critical ?? 0 },
    { name: "High", value: metrics?.byPriority?.high ?? 0 },
    { name: "Medium", value: metrics?.byPriority?.medium ?? 0 },
    { name: "Low", value: metrics?.byPriority?.low ?? 0 },
  ];

  // Category breakdown
  const categoryData = [
    { name: "Support", value: metrics?.byCategory?.general_support ?? 0 },
    { name: "Bug", value: metrics?.byCategory?.bug_report ?? 0 },
    { name: "Feature", value: metrics?.byCategory?.feature_request ?? 0 },
    { name: "Billing", value: metrics?.byCategory?.billing ?? 0 },
  ];

  return (
    <AdminLayout title="Master Metrics Dashboard" noPadding>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Master Metrics Dashboard</h1>
                <p className="text-slate-400 text-sm">Live data — auto-refreshes every 60 seconds</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Tickets</p>
                  <p className="text-3xl font-bold text-white mt-2">{totalTickets}</p>
                  <p className="text-slate-500 text-xs mt-2">All time</p>
                </div>
                <MessageSquare className="w-8 h-8 text-cyan-400 opacity-20" />
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Open / In Progress</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-2">{openTickets}</p>
                  <p className="text-slate-500 text-xs mt-2">{Math.round((openTickets / totalTickets) * 100)}% of total</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-400 opacity-20" />
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Resolved / Closed</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{resolvedTickets}</p>
                  <p className="text-slate-500 text-xs mt-2">{Math.round((resolvedTickets / totalTickets) * 100)}% of total</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400 opacity-20" />
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Avg Resolution</p>
                  <p className="text-3xl font-bold text-cyan-400 mt-2">{avgResolutionHours}h</p>
                  <p className="text-slate-500 text-xs mt-2">Based on resolved tickets</p>
                </div>
                <Clock className="w-8 h-8 text-cyan-400 opacity-20" />
              </div>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Creation Trend */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Tickets — Last 30 Days
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={combinedMetrics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Ticket Status Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ticket Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Tickets by Priority */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tickets by Priority</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Bar dataKey="value" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Tickets by Category */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tickets by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Bar dataKey="value" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Closing Note Themes */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Closing Note Themes</h3>
              <div className="space-y-3">
                {combinedMetrics.topThemes.length > 0 ? (
                  combinedMetrics.topThemes.map((theme, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">{theme.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${(theme.value / (combinedMetrics.topThemes[0]?.value || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-400 text-xs w-8 text-right">{theme.value}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No closing notes recorded</p>
                )}
              </div>
            </Card>

            {/* Resolution Time Statistics */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Resolution Time Statistics</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Average Resolution Time</p>
                  <p className="text-2xl font-bold text-cyan-400">{combinedMetrics.avgResolutionTime}h</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Median Resolution Time</p>
                  <p className="text-2xl font-bold text-blue-400">{combinedMetrics.medianResolutionTime}h</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
