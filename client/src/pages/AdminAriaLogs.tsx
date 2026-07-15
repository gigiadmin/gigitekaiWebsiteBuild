import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Filter,
  MessageSquare, Mic, Terminal, TrendingUp, XCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  voice_error: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  fallback: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const METHOD_ICONS: Record<string, React.ReactNode> = {
  text: <MessageSquare className="w-3.5 h-3.5" />,
  voice: <Mic className="w-3.5 h-3.5" />,
  slash_command: <Terminal className="w-3.5 h-3.5" />,
};

export default function AdminAriaLogs() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [intentFilter, setIntentFilter] = useState<string | undefined>();
  const [methodFilter, setMethodFilter] = useState<string | undefined>();
  const limit = 25;

  const { data: stats } = trpc.aria.getAriaLogStats.useQuery();
  const { data: logsData, isLoading } = trpc.aria.getAriaLogs.useQuery({
    limit,
    offset: page * limit,
    status: statusFilter,
    intent: intentFilter,
    inputMethod: methodFilter,
  });

  const totalPages = Math.ceil((logsData?.total || 0) / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          Aria Analytics & Logs
        </h1>
        <p className="text-slate-400 mt-1">
          Monitor Aria's performance, track errors, and optimize intent detection.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Total Queries</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.totalQueries ?? 0}</p>
              </div>
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Error Rate</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.errorRate ?? 0}%</p>
              </div>
              <div className={`p-2 rounded-lg ${(stats?.errorRate ?? 0) > 5 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                {(stats?.errorRate ?? 0) > 5 ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Avg Response</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.avgResponseTime ?? 0}ms</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Input Methods</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-300">
                    <MessageSquare className="w-3 h-3 inline mr-0.5" />{stats?.inputMethodBreakdown?.text ?? 0}
                  </span>
                  <span className="text-xs text-slate-300">
                    <Mic className="w-3 h-3 inline mr-0.5" />{stats?.inputMethodBreakdown?.voice ?? 0}
                  </span>
                  <span className="text-xs text-slate-300">
                    <Terminal className="w-3 h-3 inline mr-0.5" />{stats?.inputMethodBreakdown?.slash_command ?? 0}
                  </span>
                </div>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Filter className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Intents */}
      {stats?.topIntents && stats.topIntents.length > 0 && (
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300">Top Intents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topIntents.map((item) => (
                <button
                  key={item.intent}
                  onClick={() => { setIntentFilter(intentFilter === item.intent ? undefined : item.intent); setPage(0); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    intentFilter === item.intent
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {item.intent} <span className="text-slate-500 ml-1">({item.count})</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 uppercase tracking-wide mr-2">Filters:</span>
        {["success", "error", "voice_error", "fallback"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(statusFilter === s ? undefined : s); setPage(0); }}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
              statusFilter === s
                ? STATUS_COLORS[s]
                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
            }`}
          >
            {s === "voice_error" ? "Voice Error" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="text-slate-700 mx-1">|</span>
        {["text", "voice", "slash_command"].map((m) => (
          <button
            key={m}
            onClick={() => { setMethodFilter(methodFilter === m ? undefined : m); setPage(0); }}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-all flex items-center gap-1 ${
              methodFilter === m
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
            }`}
          >
            {METHOD_ICONS[m]} {m === "slash_command" ? "Slash" : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
        {(statusFilter || intentFilter || methodFilter) && (
          <button
            onClick={() => { setStatusFilter(undefined); setIntentFilter(undefined); setMethodFilter(undefined); setPage(0); }}
            className="px-2.5 py-1 rounded text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10"
          >
            <XCircle className="w-3 h-3 inline mr-1" /> Clear
          </button>
        )}
      </div>

      {/* Logs Table */}
      <Card className="bg-slate-900/60 border-slate-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-3 text-xs text-slate-400 uppercase tracking-wide">Time</th>
                  <th className="text-left p-3 text-xs text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-left p-3 text-xs text-slate-400 uppercase tracking-wide">Method</th>
                  <th className="text-left p-3 text-xs text-slate-400 uppercase tracking-wide">Intent</th>
                  <th className="text-left p-3 text-xs text-slate-400 uppercase tracking-wide">Question</th>
                  <th className="text-right p-3 text-xs text-slate-400 uppercase tracking-wide">Time (ms)</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td></tr>
                ) : logsData?.logs.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">
                    No logs yet. Aria interactions will appear here once you start using her.
                  </td></tr>
                ) : (
                  logsData?.logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[log.status] || ''}`}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-slate-300 text-xs">
                          {METHOD_ICONS[log.inputMethod] || null}
                          {log.inputMethod}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-cyan-400 font-mono">{log.intent || '-'}</span>
                      </td>
                      <td className="p-3 max-w-[300px]">
                        <p className="text-xs text-slate-300 truncate" title={log.question || ''}>
                          {log.question?.substring(0, 80) || '-'}
                        </p>
                        {log.errorMessage && (
                          <p className="text-[10px] text-red-400 mt-0.5 truncate" title={log.errorMessage}>
                            ⚠ {log.errorMessage.substring(0, 60)}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`text-xs font-mono ${
                          (log.responseTimeMs || 0) > 5000 ? 'text-red-400' :
                          (log.responseTimeMs || 0) > 2000 ? 'text-yellow-400' : 'text-emerald-400'
                        }`}>
                          {log.responseTimeMs ? `${log.responseTimeMs}ms` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-slate-700/50">
              <span className="text-xs text-slate-400">
                Showing {page * limit + 1}–{Math.min((page + 1) * limit, logsData?.total || 0)} of {logsData?.total || 0}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-7 px-2 border-slate-700 text-slate-300"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs text-slate-400 px-2">Page {page + 1} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-7 px-2 border-slate-700 text-slate-300"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
