/**
 * AdminEscalationPatternsPage — Aria AI Escalation Pattern Analytics
 * Shows which questions escalate to humans, by intent and reason.
 * Provides a monthly summary report for the admin panel.
 * Design: Cyberpunk Minimalism — deep navy-black + Electric cyan
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";
import { Loader2, TrendingUp, AlertTriangle, BarChart2, Calendar, RefreshCw } from "lucide-react";

const INTENT_LABELS: Record<string, string> = {
  password_reset: "Password Reset",
  email_not_working: "Email Not Working",
  billing_invoice: "Billing / Invoice",
  plan_details: "Plan Details",
  m365_install: "M365 Install",
  mfa_reset: "MFA Reset",
  sharepoint_access: "SharePoint Access",
  teams_crash: "Teams Crash",
  onedrive_sync: "OneDrive Sync",
  sales: "Sales Inquiry",
  billing: "Billing",
  complaint: "Complaint",
  general: "General",
};

const REASON_LABELS: Record<string, string> = {
  user_requested: "User Requested",
  auto_escalation_angry_sentiment: "Auto (Angry Sentiment)",
  complex_issue: "Complex Issue",
  repeated_failure: "Repeated Failure",
};

const INTENT_COLORS: Record<string, string> = {
  password_reset: "#00D4FF",
  email_not_working: "#f59e0b",
  billing_invoice: "#10b981",
  plan_details: "#8b5cf6",
  m365_install: "#3b82f6",
  mfa_reset: "#ef4444",
  sharepoint_access: "#06b6d4",
  teams_crash: "#f97316",
  onedrive_sync: "#84cc16",
  sales: "#a855f7",
  billing: "#14b8a6",
  complaint: "#fb7185",
  general: "#64748b",
};

function getMonthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function AdminEscalationPatternsPage() {
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = current month
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { start: startDate, end: endDate } = useMemo(() => getMonthRange(selectedMonth), [selectedMonth]);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = trpc.aibot.getEscalationStats.useQuery({
    startDate,
    endDate,
  });

  const { data: patternsData, isLoading: patternsLoading, refetch: refetchPatterns } = trpc.aibot.getEscalationPatterns.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    startDate,
    endDate,
  });

  const stats = statsData?.stats || { total: 0, byIntent: {}, byReason: {}, resolvedCount: 0 };
  const patterns = patternsData?.patterns || [];

  // Sort intents by count for the bar chart
  const sortedIntents = Object.entries(stats.byIntent as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxIntentCount = sortedIntents[0]?.[1] || 1;

  const monthOptions = [
    { value: 0, label: "This Month" },
    { value: 1, label: "Last Month" },
    { value: 2, label: "2 Months Ago" },
    { value: 3, label: "3 Months Ago" },
  ];

  const monthLabel = new Date(startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function handleRefresh() {
    refetchStats();
    refetchPatterns();
  }

  return (
    <AdminLayoutWithSidebar currentPage="escalation-patterns">
      <div className="min-h-screen bg-[#0A0E1A] text-white p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              Aria Escalation Patterns
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Track which questions escalate to human agents — use this to improve KB coverage and reduce escalations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(Number(e.target.value)); setPage(0); }}
              className="bg-slate-800 border border-cyan-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-slate-800 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Escalations</div>
            <div className="text-3xl font-bold text-cyan-400">{stats.total}</div>
            <div className="text-gray-500 text-xs mt-1">{monthLabel}</div>
          </div>
          <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Resolved by Agent</div>
            <div className="text-3xl font-bold text-green-400">{stats.resolvedCount}</div>
            <div className="text-gray-500 text-xs mt-1">
              {stats.total > 0 ? Math.round((stats.resolvedCount / stats.total) * 100) : 0}% resolution rate
            </div>
          </div>
          <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Top Intent</div>
            <div className="text-xl font-bold text-amber-400 truncate">
              {sortedIntents[0] ? INTENT_LABELS[sortedIntents[0][0]] || sortedIntents[0][0] : "—"}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {sortedIntents[0] ? `${sortedIntents[0][1]} escalations` : "No data yet"}
            </div>
          </div>
          <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Auto-Escalated</div>
            <div className="text-3xl font-bold text-red-400">
              {(stats.byReason as Record<string, number>)?.auto_escalation_angry_sentiment || 0}
            </div>
            <div className="text-gray-500 text-xs mt-1">Angry sentiment triggers</div>
          </div>
        </div>

        {/* Intent Breakdown Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Escalations by Intent
            </h2>
            {statsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : sortedIntents.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-8">No escalations recorded for this period.</div>
            ) : (
              <div className="space-y-2">
                {sortedIntents.map(([intent, count]) => (
                  <div key={intent} className="flex items-center gap-3">
                    <div className="w-32 text-xs text-gray-400 truncate flex-shrink-0">
                      {INTENT_LABELS[intent] || intent}
                    </div>
                    <div className="flex-1 bg-slate-800 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{
                          width: `${Math.max(8, (count / maxIntentCount) * 100)}%`,
                          backgroundColor: INTENT_COLORS[intent] || "#00D4FF",
                          opacity: 0.85,
                        }}
                      >
                        <span className="text-[10px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Escalation Reasons */}
          <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Escalation Reasons
            </h2>
            {statsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : Object.keys(stats.byReason as Record<string, number>).length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-8">No data for this period.</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.byReason as Record<string, number>)
                  .sort((a, b) => b[1] - a[1])
                  .map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">
                        {REASON_LABELS[reason] || reason}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-cyan-400">{count}</div>
                        <div className="text-xs text-gray-500">
                          ({stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%)
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Escalation Log Table */}
        <div className="bg-slate-900 border border-cyan-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/10">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Escalation Log — {monthLabel}
            </h2>
            <span className="text-xs text-gray-500">{patterns.length} records shown</span>
          </div>
          {patternsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : patterns.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-12">
              No escalations recorded for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyan-500/10 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Message</th>
                    <th className="text-left px-5 py-3">Intent</th>
                    <th className="text-left px-5 py-3">Reason</th>
                    <th className="text-left px-5 py-3">Sentiment</th>
                    <th className="text-left px-5 py-3">Ticket</th>
                    <th className="text-left px-5 py-3">Resolved</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map((p: any) => (
                    <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-300 max-w-xs">
                        <div className="truncate" title={p.originalMessage}>
                          {p.originalMessage}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${INTENT_COLORS[p.detectedIntent || "general"]}20`,
                            color: INTENT_COLORS[p.detectedIntent || "general"] || "#64748b",
                            border: `1px solid ${INTENT_COLORS[p.detectedIntent || "general"]}40`,
                          }}
                        >
                          {INTENT_LABELS[p.detectedIntent || "general"] || p.detectedIntent || "General"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {REASON_LABELS[p.escalationReason || "user_requested"] || p.escalationReason || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium ${
                          p.sentiment === "angry" ? "text-red-400" :
                          p.sentiment === "negative" ? "text-orange-400" :
                          p.sentiment === "positive" ? "text-green-400" :
                          "text-gray-400"
                        }`}>
                          {p.sentiment || "neutral"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-cyan-400 text-xs">
                        {p.ticketId ? `#${p.ticketId}` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {p.resolvedByAgent ? (
                          <span className="text-green-400 text-xs">✓ Yes</span>
                        ) : (
                          <span className="text-gray-500 text-xs">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {patterns.length === PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-cyan-500/10">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-xs text-cyan-400 disabled:text-gray-600 hover:text-cyan-300 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-500">Page {page + 1}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayoutWithSidebar>
  );
}
