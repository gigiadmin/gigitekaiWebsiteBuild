import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { trpc } from "@/lib/trpc";
import { Clock, AlertCircle, CheckCircle2, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumb";
import AdminLayout from "@/components/AdminLayout";

export default function AdminHelpdeskMetricsPage() {
  // Fetch all tickets for analysis
  const { data: allTickets = [] } = trpc.helpdesk.getAllTickets.useQuery(
    undefined,
    { refetchInterval: 60000 }
  );

  // Fetch closed tickets for resolution time analysis
  const { data: closedTickets = [] } = trpc.helpdesk.getClosedTicketsReport.useQuery(
    { days: 90 },
    { refetchInterval: 60000 }
  );

  // Calculate metrics
  const metrics = useMemo(() => {
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
        const notes = t.closingNotes.toLowerCase();
        if (notes.includes("resolved") || notes.includes("fixed") || notes.includes("completed")) {
          closingNoteThemes["Resolved/Fixed"] = (closingNoteThemes["Resolved/Fixed"] || 0) + 1;
        } else if (notes.includes("duplicate") || notes.includes("already")) {
          closingNoteThemes["Duplicate"] = (closingNoteThemes["Duplicate"] || 0) + 1;
        } else if (notes.includes("customer") && (notes.includes("no response") || notes.includes("not responding"))) {
          closingNoteThemes["Customer No Response"] = (closingNoteThemes["Customer No Response"] || 0) + 1;
        } else if (notes.includes("invalid") || notes.includes("not applicable")) {
          closingNoteThemes["Invalid/N/A"] = (closingNoteThemes["Invalid/N/A"] || 0) + 1;
        } else {
          closingNoteThemes["Other"] = (closingNoteThemes["Other"] || 0) + 1;
        }
      }
    });

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      avgResolutionTime,
      medianResolutionTime,
      closingNoteThemes,
    };
  }, [allTickets, closedTickets]);

  // Prepare data for status distribution pie chart
  const statusDistribution = [
    { name: "Open", value: metrics.open, fill: "#ef4444" },
    { name: "In Progress", value: metrics.inProgress, fill: "#f59e0b" },
    { name: "Resolved", value: metrics.resolved, fill: "#3b82f6" },
    { name: "Closed", value: metrics.closed, fill: "#10b981" },
  ].filter((item) => item.value > 0);

  // Prepare data for closing note themes pie chart
  const themeData = Object.entries(metrics.closingNoteThemes).map(([name, value]) => ({
    name,
    value,
  }));

  const THEME_COLORS = ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#64748b"];

  // Prepare data for daily ticket creation trend (last 30 days)
  const dailyTrend = useMemo(() => {
    const today = new Date();
    const trend: { [key: string]: number } = {};

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      trend[dateStr] = 0;
    }

    allTickets.forEach((t: any) => {
      const createdDate = new Date(t.createdAt);
      const dateStr = createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (trend.hasOwnProperty(dateStr)) {
        trend[dateStr]++;
      }
    });

    return Object.entries(trend).map(([date, count]) => ({ date, tickets: count }));
  }, [allTickets]);

  const handleExportCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Tickets", metrics.total],
      ["Open Tickets", metrics.open],
      ["In Progress", metrics.inProgress],
      ["Resolved", metrics.resolved],
      ["Closed (30d)", metrics.closed],
      ["Average Resolution Time (hours)", metrics.avgResolutionTime],
      ["Median Resolution Time (hours)", metrics.medianResolutionTime],
      ["Closure Rate (%)", metrics.total > 0 ? ((metrics.closed / metrics.total) * 100).toFixed(1) : 0],
      ["", ""],
      ["Closing Note Themes", "Count"],
      ...Object.entries(metrics.closingNoteThemes).map(([theme, count]) => [theme, count]),
    ];

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `helpdesk-metrics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Metrics exported successfully");
  };

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Operations", href: "/admin/helpdesk" },
    { label: "Metrics" },
  ];

  return (
    <AdminLayout>
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbs} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Helpdesk Metrics</h1>
          <p className="text-slate-400 mt-1">Ticket volume, resolution time, and closing note analysis</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Tickets</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{metrics.total}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-slate-600" />
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Open</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{metrics.open}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-slate-600" />
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Avg Resolution</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{metrics.avgResolutionTime}h</p>
            </div>
            <Clock className="w-8 h-8 text-slate-600" />
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Closed (30d)</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{metrics.closed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-slate-600" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Ticket Creation Trend */}
        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Ticket Creation Trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "12px" }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Line type="monotone" dataKey="tickets" stroke="#06b6d4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Ticket Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Closing Note Themes */}
        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Closing Note Themes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={themeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: "12px" }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Resolution Time Stats */}
        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Resolution Time Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
              <span className="text-slate-400">Average Resolution Time</span>
              <span className="text-lg font-semibold text-cyan-400">{metrics.avgResolutionTime}h</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
              <span className="text-slate-400">Median Resolution Time</span>
              <span className="text-lg font-semibold text-cyan-400">{metrics.medianResolutionTime}h</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/30">
              <span className="text-slate-400">Closed Tickets (90 days)</span>
              <span className="text-lg font-semibold text-green-400">{closedTickets.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Closure Rate</span>
              <span className="text-lg font-semibold text-green-400">
                {metrics.total > 0 ? ((metrics.closed / metrics.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  
    </AdminLayout>);
}
