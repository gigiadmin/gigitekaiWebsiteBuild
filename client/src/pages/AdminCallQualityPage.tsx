/**
 * Admin Call Quality Scoring Dashboard
 * AI-powered rubric-based scoring of call transcripts.
 * Shows overall stats, agent leaderboard, score trends, and per-call scores.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from "recharts";
import {
  Star,
  TrendingUp,
  Users,
  Phone,
  RefreshCw,
  Zap,
  Trophy,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────
function gradeColor(grade: string | null | undefined) {
  switch (grade) {
    case "A": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "B": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "C": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "D": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "F": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 80) return "text-blue-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 60) return "text-orange-400";
  return "text-red-400";
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Score Detail Dialog ────────────────────────────────────────────────────────
function ScoreDetailDialog({
  score,
  open,
  onClose,
}: {
  score: any;
  open: boolean;
  onClose: () => void;
}) {
  if (!score) return null;

  const radarData = [
    { category: "Greeting", value: score.score.scoreGreeting ?? 0 },
    { category: "Empathy", value: score.score.scoreEmpathy ?? 0 },
    { category: "Technical", value: score.score.scoreTechnical ?? 0 },
    { category: "Resolution", value: score.score.scoreResolution ?? 0 },
    { category: "Communication", value: score.score.scoreCommunication ?? 0 },
    { category: "Compliance", value: score.score.scoreCompliance ?? 0 },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-400">
            <Star className="w-5 h-5" />
            Call Quality Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="font-semibold text-white">{score.score.agentName || "Unknown Agent"}</p>
              <p className="text-sm text-slate-400">
                {score.call.callerNumber} · {formatDate(score.call.startedAt)} · {formatDuration(score.call.durationSeconds)}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-4xl font-bold ${scoreColor(score.score.totalScore ?? 0)}`}>
                {score.score.totalScore ?? "—"}
              </p>
              <Badge className={`mt-1 ${gradeColor(score.score.grade)}`}>
                Grade {score.score.grade ?? "—"}
              </Badge>
            </div>
          </div>

          {/* Radar chart */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Radar name="Score" dataKey="value" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Category scores */}
          <div className="grid grid-cols-3 gap-2">
            {radarData.map((item) => (
              <div key={item.category} className="p-2 bg-slate-800 rounded text-center">
                <p className="text-xs text-slate-400">{item.category}</p>
                <p className={`text-xl font-bold ${scoreColor(item.value * 10)}`}>{item.value}</p>
                <p className="text-xs text-slate-500">/ 10</p>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {score.score.aiSummary && (
            <div className="p-3 bg-slate-800 rounded-lg">
              <p className="text-xs font-semibold text-cyan-400 mb-1">AI Summary</p>
              <p className="text-sm text-slate-300">{score.score.aiSummary}</p>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-2 gap-3">
            {score.score.strengths && (
              <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Strengths
                </p>
                <p className="text-sm text-slate-300">{score.score.strengths}</p>
              </div>
            )}
            {score.score.improvements && (
              <div className="p-3 bg-orange-900/20 border border-orange-500/20 rounded-lg">
                <p className="text-xs font-semibold text-orange-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Improvements
                </p>
                <p className="text-sm text-slate-300">{score.score.improvements}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminCallQualityPage() {

  const [days, setDays] = useState(30);
  const [selectedScore, setSelectedScore] = useState<any>(null);

  const { data: summary, refetch: refetchSummary, isLoading: summaryLoading } =
    trpc.callQuality.getSummaryStats.useQuery({ days });

  const { data: scores, refetch: refetchScores, isLoading: scoresLoading } =
    trpc.callQuality.getScores.useQuery({ days, limit: 50 });

  const { data: unscoredCalls } =
    trpc.callQuality.getUnscoredCalls.useQuery({ limit: 20 });

  const scoreCall = trpc.callQuality.scoreCall.useMutation({
    onSuccess: (data) => {
      toast.success(`Scored: ${data.agentName} — ${data.scores.totalScore}/100 (${data.scores.grade})`);
      refetchSummary();
      refetchScores();
    },
    onError: (err) => toast.error(`Scoring failed: ${err.message}`),
  });

  const scoreAll = trpc.callQuality.scoreAllUnscored.useMutation({
    onSuccess: (data) => {
      toast.success(`Batch scored ${data.scored} calls (${data.failed} failed)`);
      refetchSummary();
      refetchScores();
    },
    onError: (err) => toast.error(`Batch scoring failed: ${err.message}`),
  });

  const stats = summary?.stats;
  const leaderboard = summary?.leaderboard || [];
  const trend = summary?.trend || [];
  const unscoredCount = summary?.unscoredCount || 0;

  // Trend chart data
  const trendData = trend.map((t) => ({
    date: t.date,
    score: Math.round(Number(t.avgScore) || 0),
    calls: Number(t.count),
  }));

  // Grade distribution data
  const gradeData = stats
    ? [
        { grade: "A", count: Number(stats.countA) || 0, fill: "#10b981" },
        { grade: "B", count: Number(stats.countB) || 0, fill: "#3b82f6" },
        { grade: "C", count: Number(stats.countC) || 0, fill: "#eab308" },
        { grade: "D", count: Number(stats.countD) || 0, fill: "#f97316" },
        { grade: "F", count: Number(stats.countF) || 0, fill: "#ef4444" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-cyan-400" />
            Call Quality Scoring
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-powered rubric-based agent performance scoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          {unscoredCount > 0 && (
            <Button
              onClick={() => scoreAll.mutate()}
              disabled={scoreAll.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {scoreAll.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Score {unscoredCount} Unscored
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Avg Score</p>
            <p className={`text-3xl font-bold ${scoreColor(Math.round(Number(stats?.avgTotal) || 0))}`}>
              {summaryLoading ? "…" : Math.round(Number(stats?.avgTotal) || 0)}
            </p>
            <p className="text-xs text-slate-500">out of 100</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Calls Scored</p>
            <p className="text-3xl font-bold text-white">
              {summaryLoading ? "…" : Number(stats?.totalScored) || 0}
            </p>
            <p className="text-xs text-slate-500">in last {days} days</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Top Agents</p>
            <p className="text-3xl font-bold text-white">{leaderboard.length}</p>
            <p className="text-xs text-slate-500">with scored calls</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 mb-1">Unscored Calls</p>
            <p className={`text-3xl font-bold ${unscoredCount > 0 ? "text-yellow-400" : "text-emerald-400"}`}>
              {unscoredCount}
            </p>
            <p className="text-xs text-slate-500">with transcripts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Score trend */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                No scored calls yet. Click "Score Unscored" to begin.
              </div>
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#00D4FF" strokeWidth={2} dot={false} name="Avg Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade distribution */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gradeData.every((g) => g.count === 0) ? (
              <div className="h-40 flex items-center justify-center text-slate-500 text-sm">No data</div>
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="grade" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    />
                    <Bar dataKey="count" name="Calls">
                      {gradeData.map((entry, index) => (
                        <rect key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Leaderboard */}
      {leaderboard.length > 0 && (
        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Agent Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">#</TableHead>
                  <TableHead className="text-slate-400">Agent</TableHead>
                  <TableHead className="text-slate-400 text-center">Calls</TableHead>
                  <TableHead className="text-slate-400 text-center">Avg Score</TableHead>
                  <TableHead className="text-slate-400 text-center">Greeting</TableHead>
                  <TableHead className="text-slate-400 text-center">Empathy</TableHead>
                  <TableHead className="text-slate-400 text-center">Technical</TableHead>
                  <TableHead className="text-slate-400 text-center">Resolution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((agent, idx) => (
                  <TableRow key={agent.agentUpn || idx} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell className="text-slate-400 font-mono">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-white">{agent.agentName || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{agent.agentUpn}</p>
                    </TableCell>
                    <TableCell className="text-center text-slate-300">{Number(agent.callsScored)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${scoreColor(Math.round(Number(agent.avgScore) || 0))}`}>
                        {Math.round(Number(agent.avgScore) || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-slate-300">{Math.round(Number(agent.avgGreeting) || 0)}</TableCell>
                    <TableCell className="text-center text-slate-300">{Math.round(Number(agent.avgEmpathy) || 0)}</TableCell>
                    <TableCell className="text-center text-slate-300">{Math.round(Number(agent.avgTechnical) || 0)}</TableCell>
                    <TableCell className="text-center text-slate-300">{Math.round(Number(agent.avgResolution) || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Unscored Calls */}
      {unscoredCalls && unscoredCalls.length > 0 && (
        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-yellow-400" /> Calls Ready to Score ({unscoredCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Caller</TableHead>
                  <TableHead className="text-slate-400">Agent</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Duration</TableHead>
                  <TableHead className="text-slate-400">Category</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unscoredCalls.map((call) => (
                  <TableRow key={call.id} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell className="text-slate-300 font-mono text-sm">{call.callerNumber || "Unknown"}</TableCell>
                    <TableCell className="text-slate-300">{call.calleeDisplayName || call.calleeUpn || "—"}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{formatDate(call.startedAt)}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{formatDuration(call.durationSeconds)}</TableCell>
                    <TableCell>
                      {call.aiCategory && (
                        <Badge className="bg-slate-700 text-slate-300 text-xs">{call.aiCategory}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                        disabled={scoreCall.isPending}
                        onClick={() => scoreCall.mutate({ callLogId: call.id })}
                      >
                        {scoreCall.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
                        Score
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Scored Calls */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Star className="w-4 h-4 text-cyan-400" /> Scored Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scoresLoading ? (
            <div className="h-20 flex items-center justify-center text-slate-500">Loading…</div>
          ) : !scores || scores.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-slate-500 text-sm">
              No scored calls yet. Score a call above to see results here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Agent</TableHead>
                  <TableHead className="text-slate-400">Caller</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400 text-center">Score</TableHead>
                  <TableHead className="text-slate-400 text-center">Grade</TableHead>
                  <TableHead className="text-slate-400">Summary</TableHead>
                  <TableHead className="text-slate-400"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((item) => (
                  <TableRow
                    key={item.score.id}
                    className="border-slate-700 hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => setSelectedScore(item)}
                  >
                    <TableCell>
                      <p className="font-medium text-white">{item.score.agentName || "Unknown"}</p>
                    </TableCell>
                    <TableCell className="text-slate-300 font-mono text-sm">
                      {item.call.callerNumber || "Unknown"}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">{formatDate(item.call.startedAt)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold text-lg ${scoreColor(item.score.totalScore ?? 0)}`}>
                        {item.score.totalScore ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={gradeColor(item.score.grade)}>
                        {item.score.grade ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                      {item.score.aiSummary || "—"}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Score Detail Dialog */}
      <ScoreDetailDialog
        score={selectedScore}
        open={!!selectedScore}
        onClose={() => setSelectedScore(null)}
      />
    </div>
  );
}
