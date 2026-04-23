/**
 * Admin: MS Learn Sync Dashboard
 * Allows admins to view sync status and manually trigger a sync of
 * Microsoft Learn training modules into the GigitekAI Knowledge Base.
 */

import { useState } from "react";
import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";
import { trpc } from "@/lib/trpc";
import { RefreshCw, BookOpen, Clock, CheckCircle, AlertTriangle, Layers } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  "m365": "Microsoft 365",
  "azure": "Azure",
  "security": "Security",
  "copilot": "Copilot / AI",
  "general": "General IT",
};

export default function AdminMsLearnSyncPage() {
  const [maxModules, setMaxModules] = useState<number | undefined>(undefined);
  const [syncResult, setSyncResult] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    durationMs: number;
  } | null>(null);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } =
    trpc.msLearnSync.getSyncStatus.useQuery(undefined, {
      refetchOnWindowFocus: false,
    });

  const triggerSync = trpc.msLearnSync.triggerSync.useMutation({
    onSuccess: (result) => {
      setSyncResult(result);
      refetchStatus();
    },
  });

  const handleSync = () => {
    setSyncResult(null);
    triggerSync.mutate({ maxModules });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " ET";
  };

  return (
    <AdminLayoutWithSidebar currentPage="ms-learn-sync">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00D4FF]/10 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MS Learn Sync</h1>
              <p className="text-gray-400 text-sm">
                Sync Microsoft Learn training modules into the GigitekAI Knowledge Base
              </p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Total Articles */}
          <div className="bg-[#0F1419] border border-gray-800/40 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-[#00D4FF]" />
              <span className="text-gray-400 text-sm">Total Articles</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {statusLoading ? (
                <span className="text-gray-600 text-lg">Loading...</span>
              ) : (
                status?.totalArticles ?? 0
              )}
            </p>
            <p className="text-gray-500 text-xs mt-1">MS Learn modules in KB</p>
          </div>

          {/* Last Synced */}
          <div className="bg-[#0F1419] border border-gray-800/40 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-400 text-sm">Last Synced</span>
            </div>
            <p className="text-sm font-semibold text-white">
              {statusLoading ? (
                <span className="text-gray-600">Loading...</span>
              ) : (
                formatDate(status?.lastSyncedAt)
              )}
            </p>
            <p className="text-gray-500 text-xs mt-1">Nightly sync at 2:00 AM ET</p>
          </div>

          {/* Categories */}
          <div className="bg-[#0F1419] border border-gray-800/40 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Layers className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Categories</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {statusLoading ? (
                <span className="text-gray-600 text-lg">Loading...</span>
              ) : (
                Object.keys(status?.byCategory ?? {}).length
              )}
            </p>
            <p className="text-gray-500 text-xs mt-1">Active topic categories</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {!statusLoading && status && Object.keys(status.byCategory).length > 0 && (
          <div className="bg-[#0F1419] border border-gray-800/40 rounded-xl p-6 mb-8">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00D4FF]" />
              Category Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800/40">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Category</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Articles</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(status.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => {
                      const pct = status.totalArticles > 0
                        ? ((count / status.totalArticles) * 100).toFixed(1)
                        : "0.0";
                      return (
                        <tr key={cat} className="border-b border-gray-800/20 hover:bg-white/2">
                          <td className="py-3 px-3 text-white">
                            {CATEGORY_LABELS[cat] ?? cat}
                          </td>
                          <td className="py-3 px-3 text-right text-[#00D4FF] font-semibold">
                            {count.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right text-gray-400">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Manual Sync Trigger */}
        <div className="bg-[#0F1419] border border-gray-800/40 rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-1">Manual Sync</h2>
          <p className="text-gray-400 text-sm mb-5">
            Trigger an immediate sync from the MS Learn catalog. The nightly sync runs automatically at 2:00 AM ET.
            Use the limit field for a quick test run (e.g., 50 modules).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm whitespace-nowrap">Module limit:</label>
              <input
                type="number"
                min={1}
                max={500}
                placeholder="All"
                value={maxModules ?? ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setMaxModules(isNaN(v) ? undefined : v);
                }}
                className="w-24 px-3 py-2 bg-white/5 border border-gray-700/40 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/50"
              />
              <span className="text-gray-500 text-xs">(blank = all)</span>
            </div>
            <button
              onClick={handleSync}
              disabled={triggerSync.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-[#00D4FF] hover:bg-[#00D4FF]/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-lg text-sm transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${triggerSync.isPending ? "animate-spin" : ""}`} />
              {triggerSync.isPending ? "Syncing..." : "Run Sync Now"}
            </button>
          </div>

          {/* Sync Error */}
          {triggerSync.isError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium text-sm">Sync Failed</p>
                <p className="text-red-300/70 text-xs mt-1">
                  {triggerSync.error?.message ?? "An unexpected error occurred."}
                </p>
              </div>
            </div>
          )}

          {/* Sync Result */}
          {syncResult && !triggerSync.isPending && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 font-semibold text-sm">Sync Complete</p>
                <span className="text-gray-500 text-xs ml-auto">
                  Completed in {formatDuration(syncResult.durationMs)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Processed", value: syncResult.total, color: "text-white" },
                  { label: "Created", value: syncResult.created, color: "text-green-400" },
                  { label: "Updated", value: syncResult.updated, color: "text-cyan-400" },
                  { label: "Errors", value: syncResult.errors, color: syncResult.errors > 0 ? "text-red-400" : "text-gray-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-gray-500 text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl p-5">
          <h3 className="text-[#00D4FF] font-semibold text-sm mb-2">About MS Learn Sync</h3>
          <ul className="text-gray-400 text-sm space-y-1.5">
            <li>• Pulls from <code className="text-[#00D4FF]/80 bg-black/30 px-1 rounded">learn.microsoft.com/api/catalog/</code> — public, no auth required</li>
            <li>• Filters to M365, Azure, Security, and Copilot/AI modules relevant to GigitekAI clients</li>
            <li>• Aria uses these articles to answer training and certification questions</li>
            <li>• Existing articles are updated; new ones are created; no duplicates</li>
            <li>• Nightly cron runs at <strong className="text-white">2:00 AM ET</strong> automatically</li>
          </ul>
        </div>
      </div>
    </AdminLayoutWithSidebar>
  );
}
