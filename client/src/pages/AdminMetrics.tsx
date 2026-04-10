import { Card } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";

export default function AdminMetrics() {

  // Mock data for metrics
  const totalTickets = 156;
  const openTickets = 23;
  const resolvedTickets = 128;
  const avgResolutionTime = 12;

  const sentimentData = [
    { name: "Positive", value: 85, fill: "#00D4FF" },
    { name: "Neutral", value: 45, fill: "#6B7280" },
    { name: "Negative", value: 12, fill: "#EF4444" },
  ];

  const intentData = [
    { name: "Sales", value: 35 },
    { name: "Support", value: 68 },
    { name: "Billing", value: 28 },
    { name: "General", value: 25 },
  ];

  const ratings = {
    helpful: 95,
    neutral: 28,
    unhelpful: 8,
  };

  const totalRatings = ratings.helpful + ratings.neutral + ratings.unhelpful;
  const satisfactionScore = Math.round((ratings.helpful / totalRatings) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Metrics Dashboard</h1>
          <p className="text-slate-400">Track ticket volume, resolution times, and customer satisfaction</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Tickets */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Tickets</p>
                <p className="text-3xl font-bold text-white">{totalTickets}</p>
              </div>
              <MessageSquare className="w-12 h-12 text-cyan-400 opacity-50" />
            </div>
          </Card>

          {/* Open Tickets */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Open Tickets</p>
                <p className="text-3xl font-bold text-yellow-400">{openTickets}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-400 opacity-50" />
            </div>
          </Card>

          {/* Resolved Tickets */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Resolved Tickets</p>
                <p className="text-3xl font-bold text-green-400">{resolvedTickets}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400 opacity-50" />
            </div>
          </Card>

          {/* Avg Resolution Time */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Avg Resolution</p>
                <p className="text-3xl font-bold text-cyan-400">{avgResolutionTime}h</p>
              </div>
              <Clock className="w-12 h-12 text-cyan-400 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sentiment Distribution */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Sentiment Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Intent Routing */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Intent Routing</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={intentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #475569" }} />
                <Bar dataKey="value" fill="#00D4FF" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ticket Status Overview */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Ticket Status Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Open</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${(openTickets / totalTickets) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold">{openTickets}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Resolved</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-400 h-2 rounded-full"
                      style={{ width: `${(resolvedTickets / totalTickets) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold">{resolvedTickets}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Satisfaction */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Customer Satisfaction</h3>
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-cyan-400">{satisfactionScore}%</p>
                <p className="text-slate-400 text-sm mt-2">Based on {totalRatings} ratings</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Helpful</span>
                  <span className="text-white">{ratings.helpful}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Neutral</span>
                  <span className="text-white">{ratings.neutral}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-400">Unhelpful</span>
                  <span className="text-white">{ratings.unhelpful}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
