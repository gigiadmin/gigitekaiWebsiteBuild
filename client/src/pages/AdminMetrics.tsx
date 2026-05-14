import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Clock, CheckCircle, AlertCircle, MessageSquare, RefreshCw, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminMetrics() {
  const { data: metrics, isLoading, error, refetch } = trpc.helpdesk.getMetrics.useQuery(undefined, {
    refetchInterval: 60_000, // auto-refresh every 60 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading live metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  const totalTickets = metrics?.total ?? 0;
  const openTickets = (metrics?.open ?? 0) + (metrics?.inProgress ?? 0);
  const resolvedTickets = (metrics?.resolved ?? 0) + (metrics?.closed ?? 0);
  const avgResolutionHours = metrics?.avgResolutionHours;

  // Ticket status breakdown for pie chart
  const statusData = [
    { name: "Open", value: metrics?.open ?? 0, fill: "#FBBF24" },
    { name: "In Progress", value: metrics?.inProgress ?? 0, fill: "#60A5FA" },
    { name: "Resolved", value: metrics?.resolved ?? 0, fill: "#34D399" },
    { name: "Closed", value: metrics?.closed ?? 0, fill: "#6B7280" },
  ].filter(d => d.value > 0);

  // Ticket category breakdown for bar chart
  const categoryData = [
    { name: "Support", value: metrics?.byCategory?.general_support ?? 0 },
    { name: "Bug", value: metrics?.byCategory?.bug_report ?? 0 },
    { name: "Feature", value: metrics?.byCategory?.feature_request ?? 0 },
    { name: "Billing", value: metrics?.byCategory?.billing ?? 0 },
  ];

  // Priority breakdown
  const priorityData = [
    { name: "Critical", value: metrics?.byPriority?.critical ?? 0, fill: "#EF4444" },
    { name: "High", value: metrics?.byPriority?.high ?? 0, fill: "#F97316" },
    { name: "Medium", value: metrics?.byPriority?.medium ?? 0, fill: "#FBBF24" },
    { name: "Low", value: metrics?.byPriority?.low ?? 0, fill: "#34D399" },
  ];

  // Last 7 days trend
  const trendData = (metrics?.ticketsByDay ?? []).map(d => ({
    day: new Date(d.day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    count: d.count,
  }));

  // Satisfaction
  const sat = metrics?.satisfaction;
  const satisfactionScore = sat?.score;
  const totalRatings = sat?.total ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Metrics Dashboard</h1>
            <p className="text-slate-400">Live data — auto-refreshes every 60 seconds</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Tickets</p>
                <p className="text-3xl font-bold text-white">{totalTickets}</p>
                <p className="text-slate-500 text-xs mt-1">All time</p>
              </div>
              <MessageSquare className="w-12 h-12 text-cyan-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Open / In Progress</p>
                <p className="text-3xl font-bold text-yellow-400">{openTickets}</p>
                <p className="text-slate-500 text-xs mt-1">{metrics?.open ?? 0} open · {metrics?.inProgress ?? 0} in progress</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Resolved / Closed</p>
                <p className="text-3xl font-bold text-green-400">{resolvedTickets}</p>
                <p className="text-slate-500 text-xs mt-1">{metrics?.resolved ?? 0} resolved · {metrics?.closed ?? 0} closed</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Avg Resolution</p>
                <p className="text-3xl font-bold text-cyan-400">
                  {avgResolutionHours !== null && avgResolutionHours !== undefined ? `${avgResolutionHours}h` : "—"}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {avgResolutionHours !== null && avgResolutionHours !== undefined ? "Based on resolved tickets" : "No resolved tickets yet"}
                </p>
              </div>
              <Clock className="w-12 h-12 text-cyan-400 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Charts Row 1: Trend + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 7-Day Ticket Trend */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">Tickets — Last 7 Days</h3>
            </div>
            {trendData.every(d => d.count === 0) ? (
              <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No tickets in the last 7 days</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="day" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", color: "#fff" }} />
                  <Line type="monotone" dataKey="count" stroke="#00D4FF" strokeWidth={2} dot={{ fill: "#00D4FF", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Ticket Status Pie */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Ticket Status Breakdown</h3>
            {statusData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No tickets yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Charts Row 2: Category + Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Tickets by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569", color: "#fff" }} />
                <Bar dataKey="value" fill="#00D4FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Priority Breakdown */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Tickets by Priority</h3>
            <div className="space-y-3 mt-2">
              {priorityData.map(({ name, value, fill }) => (
                <div key={name} className="flex items-center justify-between gap-3">
                  <span className="text-slate-400 text-sm w-16">{name}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: totalTickets > 0 ? `${(value / totalTickets) * 100}%` : "0%", backgroundColor: fill }}
                    />
                  </div>
                  <span className="text-white font-bold text-sm w-8 text-right">{value}</span>
                </div>
              ))}
              {totalTickets === 0 && <p className="text-slate-500 text-sm text-center py-4">No tickets yet</p>}
            </div>
          </Card>
        </div>

        {/* Customer Satisfaction */}
        <div className="mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Customer Satisfaction</h3>
            {totalRatings === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No feedback submitted yet — satisfaction score will appear once customers rate their tickets.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-center">
                  <p className="text-6xl font-bold text-cyan-400">{satisfactionScore}%</p>
                  <p className="text-slate-400 text-sm mt-2">Based on {totalRatings} ticket {totalRatings === 1 ? "rating" : "ratings"}</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Positive (4–5 ★)", count: sat?.helpful ?? 0, color: "bg-green-400" },
                    { label: "Neutral (3 ★)", count: sat?.neutral ?? 0, color: "bg-slate-400" },
                    { label: "Negative (1–2 ★)", count: sat?.unhelpful ?? 0, color: "bg-red-400" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm w-32">{label}</span>
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${color} transition-all duration-500`}
                          style={{ width: totalRatings > 0 ? `${(count / totalRatings) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-white text-sm font-bold w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 text-xs">
          <p>Live data from helpdesk database · Last refreshed: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
