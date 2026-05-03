/*
  Admin Dashboard for Compliance Scorecard Results
  Slug: /admin/scorecard-results
  Tracks submissions, scores, and lead quality with segmentation
*/

import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, Filter, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const SCORE_BANDS = [
  { min: 90, max: 100, label: "Excellent", color: "#00D4FF", count: 2 },
  { min: 70, max: 89, label: "Good", color: "#7c3aed", count: 8 },
  { min: 50, max: 69, label: "At Risk", color: "#f59e0b", count: 15 },
  { min: 0, max: 49, label: "Critical", color: "#ef4444", count: 5 },
];

const SAMPLE_SUBMISSIONS = [
  { id: 1, name: "Acme Corp", email: "cto@acme.com", score: 45, band: "Critical", date: "2026-05-03", status: "Email drip sent" },
  { id: 2, name: "TechFlow Inc", email: "it@techflow.com", score: 72, band: "Good", date: "2026-05-02", status: "Email drip sent" },
  { id: 3, name: "DataVault LLC", email: "ops@datavault.com", score: 38, band: "Critical", date: "2026-05-01", status: "Awaiting response" },
  { id: 4, name: "CloudNine Systems", email: "admin@cloudnine.com", score: 85, band: "Good", date: "2026-04-30", status: "Scheduled demo" },
  { id: 5, name: "SecureNet", email: "security@securenet.com", score: 92, band: "Excellent", date: "2026-04-29", status: "Proposal sent" },
];

const DAILY_SUBMISSIONS = [
  { date: "Apr 25", submissions: 2 },
  { date: "Apr 26", submissions: 1 },
  { date: "Apr 27", submissions: 3 },
  { date: "Apr 28", submissions: 5 },
  { date: "Apr 29", submissions: 4 },
  { date: "Apr 30", submissions: 6 },
  { date: "May 01", submissions: 7 },
  { date: "May 02", submissions: 8 },
  { date: "May 03", submissions: 5 },
];

export default function AdminScorecardDashboard() {
  const [filter, setFilter] = useState<string>("all");
  const [submissions, setSubmissions] = useState(SAMPLE_SUBMISSIONS);

  useSEO({
    title: "Scorecard Results Dashboard | GigitekAI Admin",
    description: "Admin dashboard tracking compliance scorecard submissions, scores, and lead quality.",
    path: "/admin/scorecard-results",
  });

  const filteredSubmissions = filter === "all" ? submissions : submissions.filter((s) => s.band === filter);

  const totalSubmissions = submissions.length;
  const avgScore = Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions);
  const conversionRate = ((submissions.filter((s) => s.status !== "Awaiting response").length / totalSubmissions) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Scorecard Results</h1>
            <p className="text-gray-400 mt-1">Track compliance audit submissions and lead quality</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-4 py-2 rounded-lg font-semibold hover:bg-[#00D4FF]/90">
            <Download size={18} /> Export CSV
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0D1528] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Submissions</p>
                <p className="text-3xl font-bold text-white mt-2">{totalSubmissions}</p>
              </div>
              <TrendingUp className="text-[#00D4FF]" size={32} />
            </div>
          </div>

          <div className="bg-[#0D1528] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className="text-3xl font-bold text-white mt-2">{avgScore}/100</p>
              </div>
              <CheckCircle className="text-[#7c3aed]" size={32} />
            </div>
          </div>

          <div className="bg-[#0D1528] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Conversion Rate</p>
                <p className="text-3xl font-bold text-white mt-2">{conversionRate}%</p>
              </div>
              <TrendingUp className="text-[#10b981]" size={32} />
            </div>
          </div>

          <div className="bg-[#0D1528] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">At Risk</p>
                <p className="text-3xl font-bold text-[#ef4444] mt-2">{submissions.filter((s) => s.band === "Critical").length}</p>
              </div>
              <AlertTriangle className="text-[#ef4444]" size={32} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <div className="bg-[#0D1528] border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={SCORE_BANDS} cx="50%" cy="50%" labelLine={false} label={({ label, count }) => `${label}: ${count}`} outerRadius={100} fill="#8884d8" dataKey="count">
                  {SCORE_BANDS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Submissions Trend */}
          <div className="bg-[#0D1528] border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Submissions Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={DAILY_SUBMISSIONS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: "#0A0E1A", border: "1px solid #00D4FF" }} />
                <Line type="monotone" dataKey="submissions" stroke="#00D4FF" strokeWidth={2} dot={{ fill: "#00D4FF" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-[#0D1528] border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-[#0A0E1A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00D4FF]"
            >
              <option value="all">All Scores</option>
              <option value="Excellent">Excellent (90+)</option>
              <option value="Good">Good (70-89)</option>
              <option value="At Risk">At Risk (50-69)</option>
              <option value="Critical">Critical (0-49)</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Company</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Contact</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Score</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Band</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-white/5 hover:bg-[#0A0E1A] transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{submission.name}</td>
                    <td className="py-3 px-4 text-gray-400">{submission.email}</td>
                    <td className="py-3 px-4 text-white font-bold">{submission.score}/100</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: SCORE_BANDS.find((b) => b.label === submission.band)?.color + "20",
                          color: SCORE_BANDS.find((b) => b.label === submission.band)?.color,
                        }}
                      >
                        {submission.band}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{submission.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs bg-[#00D4FF]/10 text-[#00D4FF]">{submission.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
