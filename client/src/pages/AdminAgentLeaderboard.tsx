import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Trophy,
  Medal,
  Star,
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
  Loader2,
  Award,
  Search,
} from "lucide-react";

type TimeRange = "week" | "month" | "all";

const RANK_ICONS = [
  <Trophy className="w-5 h-5 text-yellow-400" />,
  <Medal className="w-5 h-5 text-slate-300" />,
  <Award className="w-5 h-5 text-amber-600" />,
];

function getRankBadge(rank: number) {
  if (rank === 1) return <span className="text-yellow-400 font-bold text-lg">#1</span>;
  if (rank === 2) return <span className="text-slate-300 font-bold text-lg">#2</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold text-lg">#3</span>;
  return <span className="text-slate-500 font-semibold text-base">#{rank}</span>;
}

function getResolutionRateColor(rate: number) {
  if (rate >= 0.8) return "text-green-400";
  if (rate >= 0.5) return "text-yellow-400";
  return "text-red-400";
}

function getResponseTimeColor(hours: number) {
  if (hours <= 4) return "text-green-400";
  if (hours <= 24) return "text-yellow-400";
  return "text-red-400";
}

export default function AdminAgentLeaderboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: leaderboard = [], isLoading } = trpc.helpdesk.getAgentLeaderboard.useQuery(
    { timeRange },
    { refetchInterval: 60000 }
  );

  const filteredAgents = leaderboard.filter((agent) =>
    agent.agentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topAgent = filteredAgents[0];

  return (
    <AdminLayoutWithSidebar currentPage="agent-leaderboard">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Agent Performance Leaderboard
            </h1>
            <p className="text-slate-400 mt-1">
              Ranking based on resolved tickets, response time, and resolution rate
            </p>
          </div>
          {/* Time range selector */}
          <div className="flex gap-2">
            {(["week", "month", "all"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:border-cyan-500/30"
                }`}
              >
                {range === "week" ? "This Week" : range === "month" ? "This Month" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/60 border-slate-700/50 text-white placeholder-slate-500"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <Card className="bg-slate-900/60 border-slate-700/50 p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No agent data available for this period</p>
            <p className="text-slate-500 text-sm mt-2">
              Agents appear here once they have resolved tickets
            </p>
          </Card>
        ) : (
          <>
            {/* Top 3 Podium */}
            {filteredAgents.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-2">
                {/* 2nd place */}
                <div className="flex flex-col items-center pt-8">
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300 mb-3 border-2 border-slate-500">
                    {filteredAgents[1]?.agentName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <Medal className="w-6 h-6 text-slate-300 mb-1" />
                  <p className="text-white font-semibold text-sm text-center">{filteredAgents[1]?.agentName}</p>
                  <p className="text-slate-400 text-xs">{filteredAgents[1]?.resolvedTickets} resolved</p>
                  <div className="mt-3 bg-slate-700/60 rounded-t-lg w-full h-20 flex items-end justify-center pb-2">
                    <span className="text-slate-300 font-bold text-xl">#2</span>
                  </div>
                </div>
                {/* 1st place */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center text-3xl font-bold text-yellow-400 mb-3 border-2 border-yellow-500/60">
                    {filteredAgents[0]?.agentName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <Trophy className="w-7 h-7 text-yellow-400 mb-1" />
                  <p className="text-white font-bold text-sm text-center">{filteredAgents[0]?.agentName}</p>
                  <p className="text-slate-400 text-xs">{filteredAgents[0]?.resolvedTickets} resolved</p>
                  <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-t-lg w-full h-32 flex items-end justify-center pb-2">
                    <span className="text-yellow-400 font-bold text-2xl">#1</span>
                  </div>
                </div>
                {/* 3rd place */}
                <div className="flex flex-col items-center pt-12">
                  <div className="w-14 h-14 rounded-full bg-amber-900/30 flex items-center justify-center text-xl font-bold text-amber-600 mb-3 border-2 border-amber-700/50">
                    {filteredAgents[2]?.agentName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <Award className="w-5 h-5 text-amber-600 mb-1" />
                  <p className="text-white font-semibold text-sm text-center">{filteredAgents[2]?.agentName}</p>
                  <p className="text-slate-400 text-xs">{filteredAgents[2]?.resolvedTickets} resolved</p>
                  <div className="mt-3 bg-amber-900/20 rounded-t-lg w-full h-14 flex items-end justify-center pb-2">
                    <span className="text-amber-600 font-bold text-lg">#3</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard Table */}
            <Card className="bg-slate-900/60 border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50">
                <h2 className="text-white font-semibold text-lg">Full Rankings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/80">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-400">Rank</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-400">Agent</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-400">
                        <span className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Resolved
                        </span>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-400">
                        <span className="flex items-center justify-center gap-1">
                          <Clock className="w-4 h-4" /> Avg Response
                        </span>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-400">
                        <span className="flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4" /> Resolution Rate
                        </span>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-400">
                        <span className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4" /> NPS Score
                        </span>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-400">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filteredAgents.map((agent, idx) => {
                      const rank = idx + 1;
                      const resolutionPct = Math.round(agent.resolutionRate * 100);
                      return (
                        <tr
                          key={agent.agentId}
                          className={`transition hover:bg-slate-800/40 ${rank === 1 ? "bg-yellow-500/5" : ""}`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {rank <= 3 ? RANK_ICONS[rank - 1] : null}
                              {getRankBadge(rank)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                                rank === 1 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" :
                                rank === 2 ? "bg-slate-700 text-slate-300 border border-slate-500" :
                                rank === 3 ? "bg-amber-900/30 text-amber-500 border border-amber-700/40" :
                                "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}>
                                {agent.agentName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-medium">{agent.agentName}</p>
                                <p className="text-slate-500 text-xs">{agent.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-cyan-400 font-bold text-lg">{agent.resolvedTickets}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-semibold ${getResponseTimeColor(agent.avgResponseTime)}`}>
                              {agent.avgResponseTime > 0 ? `${agent.avgResponseTime}h` : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold ${getResolutionRateColor(agent.resolutionRate)}`}>
                                {resolutionPct}%
                              </span>
                              <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    resolutionPct >= 80 ? "bg-green-400" :
                                    resolutionPct >= 50 ? "bg-yellow-400" : "bg-red-400"
                                  }`}
                                  style={{ width: `${Math.min(resolutionPct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-slate-300 font-semibold">
                              {agent.npsScore > 0 ? agent.npsScore.toFixed(1) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {resolutionPct >= 80 ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Excellent</Badge>
                            ) : resolutionPct >= 60 ? (
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Good</Badge>
                            ) : resolutionPct >= 40 ? (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Average</Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Needs Improvement</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-900/60 border-slate-700/50 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Total Agents</p>
                <p className="text-2xl font-bold text-white">{filteredAgents.length}</p>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Total Resolved</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {filteredAgents.reduce((s, a) => s + a.resolvedTickets, 0)}
                </p>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Top Performer</p>
                <p className="text-lg font-bold text-yellow-400 truncate">
                  {topAgent?.agentName || "—"}
                </p>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Avg Resolution Rate</p>
                <p className="text-2xl font-bold text-green-400">
                  {filteredAgents.length > 0
                    ? `${Math.round(filteredAgents.reduce((s, a) => s + a.resolutionRate, 0) / filteredAgents.length * 100)}%`
                    : "—"}
                </p>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayoutWithSidebar>
  );
}
