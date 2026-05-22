import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, TrendingUp, Eye, Share2, CheckCircle2, ThumbsUp, Search, AlertTriangle, MousePointerClick, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function KBAnalyticsDashboard() {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [searchDays, setSearchDays] = useState(30);

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = trpc.kbAnalytics.getDashboardMetrics.useQuery();

  // Fetch top articles by views
  const { data: topArticles, isLoading: topLoading } = trpc.kbAnalytics.getTopArticlesByViews.useQuery({
    limit: 10,
    days: 30,
  });

  // Fetch most effective articles
  const { data: effectiveArticles, isLoading: effectiveLoading } =
    trpc.kbAnalytics.getMostEffectiveArticles.useQuery({ limit: 10 });

  // Fetch article analytics
  const { data: articleAnalytics } = trpc.kbAnalytics.getArticleAnalytics.useQuery(
    { articleId: selectedArticleId || 0 },
    { enabled: !!selectedArticleId }
  );

  // ── Search Analytics ──────────────────────────────────────────────
  const { data: searchMetrics, isLoading: searchMetricsLoading } =
    trpc.kbSearchAnalytics.getDashboardMetrics.useQuery({ days: searchDays });

  const { data: topQueries, isLoading: topQueriesLoading } =
    trpc.kbSearchAnalytics.getTopQueries.useQuery({ limit: 15, days: searchDays });

  const { data: zeroResultQueries, isLoading: zeroResultLoading } =
    trpc.kbSearchAnalytics.getZeroResultQueries.useQuery({ limit: 15, days: searchDays });

  const { data: sourceBreakdown } =
    trpc.kbSearchAnalytics.getSourceBreakdown.useQuery({ days: searchDays });

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-gray-400 ml-3">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — Article Engagement Metrics
         ═══════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Article Engagement</h2>
        <p className="text-gray-400 text-sm">Track article performance, effectiveness, and engagement</p>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="Total Articles" value={metrics.totalArticles} icon={<Eye className="w-8 h-8 text-cyan-400/30" />} color="text-white" />
          <MetricCard label="Total Views" value={metrics.totalViews.toLocaleString()} icon={<TrendingUp className="w-8 h-8 text-blue-400/30" />} color="text-blue-400" />
          <MetricCard label="Shares" value={metrics.totalShares} icon={<Share2 className="w-8 h-8 text-purple-400/30" />} color="text-purple-400" />
          <MetricCard label="Tickets Resolved" value={metrics.totalTicketsResolved} icon={<CheckCircle2 className="w-8 h-8 text-green-400/30" />} color="text-green-400" />
          <MetricCard label="Helpful Rate" value={`${metrics.helpfulRate}%`} icon={<ThumbsUp className="w-8 h-8 text-orange-400/30" />} color="text-orange-400" />
          <MetricCard label="Avg Time (sec)" value={metrics.avgTimeSpent} icon={<Eye className="w-8 h-8 text-cyan-400/30" />} color="text-cyan-400" />
        </div>
      )}

      {/* Top Articles & Effective Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Viewed Articles */}
        <div className="bg-[#141B2D]/40 border border-gray-800/30 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-cyan-300 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Most Viewed Articles (30 days)
          </h3>

          {topLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            </div>
          ) : topArticles && topArticles.length > 0 ? (
            <div className="space-y-2">
              {topArticles.map((article, idx) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticleId(article.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-[opacity,transform] ${
                    selectedArticleId === article.id
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-gray-800/20 border-gray-700/30 hover:bg-gray-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-300 truncate">#{idx + 1}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{article.views} views</p>
                    </div>
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                      {article.shares} shares
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs text-center py-6">No articles yet</p>
          )}
        </div>

        {/* Most Effective Articles */}
        <div className="bg-[#141B2D]/40 border border-gray-800/30 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-green-300 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Most Effective Articles
          </h3>

          {effectiveLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            </div>
          ) : effectiveArticles && effectiveArticles.length > 0 ? (
            <div className="space-y-2">
              {effectiveArticles.map((article, idx) => (
                <div
                  key={article.id}
                  className="p-3 rounded-lg bg-gray-800/20 border border-gray-700/30 hover:bg-gray-800/40 transition-[opacity,transform]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-300 truncate">#{idx + 1}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{article.ticketsResolved} tickets resolved</p>
                    </div>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                      {article.views} views
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs text-center py-6">No articles yet</p>
          )}
        </div>
      </div>

      {/* Article Details */}
      {selectedArticleId && articleAnalytics && (
        <div className="bg-[#141B2D]/40 border border-cyan-500/20 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-cyan-300">Article Performance Details</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#0A0E1A]/60 border border-gray-800/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Views</p>
              <p className="text-2xl font-bold text-white mt-1">{articleAnalytics.views}</p>
            </div>

            <div className="bg-[#0A0E1A]/60 border border-gray-800/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Shares</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{articleAnalytics.shares}</p>
            </div>

            <div className="bg-[#0A0E1A]/60 border border-gray-800/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Resolved</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{articleAnalytics.ticketsResolved}</p>
            </div>

            <div className="bg-[#0A0E1A]/60 border border-gray-800/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Helpful Rate</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">{articleAnalytics.helpfulRate}%</p>
            </div>
          </div>

          {articleAnalytics.helpfulCount !== undefined && (
            <div className="bg-gray-800/20 border border-gray-700/20 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Helpfulness Breakdown</p>
              <div className="flex gap-4">
                <div>
                  <span className="text-xs text-green-400">Helpful: {articleAnalytics.helpfulCount}</span>
                </div>
                <div>
                  <span className="text-xs text-red-400">Not Helpful: {articleAnalytics.unhelpfulCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — Search Analytics
         ═══════════════════════════════════════════════════════════════ */}
      <div className="border-t border-gray-800/50 pt-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              Search Analytics
            </h2>
            <p className="text-gray-400 text-sm mt-1">Track what users search for and identify content gaps</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={searchDays === d ? "default" : "outline"}
                onClick={() => setSearchDays(d)}
                className={searchDays === d ? "bg-cyan-600 text-white" : "border-slate-600 text-gray-400"}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Search KPI Cards */}
      {searchMetricsLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
      ) : searchMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Searches"
            value={searchMetrics.totalSearches.toLocaleString()}
            icon={<Search className="w-8 h-8 text-cyan-400/30" />}
            color="text-cyan-400"
          />
          <MetricCard
            label="Unique Queries"
            value={searchMetrics.uniqueQueries.toLocaleString()}
            icon={<BarChart3 className="w-8 h-8 text-blue-400/30" />}
            color="text-blue-400"
          />
          <MetricCard
            label="Zero-Result Rate"
            value={`${searchMetrics.zeroResultRate}%`}
            icon={<AlertTriangle className="w-8 h-8 text-amber-400/30" />}
            color={searchMetrics.zeroResultRate > 30 ? "text-red-400" : "text-amber-400"}
          />
          <MetricCard
            label="Click-Through Rate"
            value={`${searchMetrics.clickThroughRate}%`}
            icon={<MousePointerClick className="w-8 h-8 text-green-400/30" />}
            color="text-green-400"
          />
        </div>
      )}

      {/* Source Breakdown */}
      {sourceBreakdown && sourceBreakdown.length > 0 && (
        <div className="bg-[#141B2D]/40 border border-gray-800/30 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-cyan-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Search Sources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sourceBreakdown.map((src) => {
              const sourceLabels: Record<string, string> = {
                kb_portal: "KB Portal",
                aria_chat: "Aria Chat",
                ticket_widget: "Ticket Widget",
              };
              const ctr = Number(src.searchCount) > 0
                ? Math.round((Number(src.clickCount) / Number(src.searchCount)) * 100)
                : 0;
              return (
                <div key={src.source} className="bg-[#0A0E1A]/60 border border-gray-800/30 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                    {sourceLabels[src.source] || src.source}
                  </p>
                  <p className="text-xl font-bold text-white mt-1">{Number(src.searchCount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Number(src.clickCount)} clicks ({ctr}% CTR)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Queries & Zero-Result Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Queries */}
        <div className="bg-[#141B2D]/40 border border-gray-800/30 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-cyan-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Top Search Queries
          </h3>

          {topQueriesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            </div>
          ) : topQueries && topQueries.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase tracking-wide font-semibold px-3 py-1.5">
                <span className="col-span-6">Query</span>
                <span className="col-span-2 text-right">Count</span>
                <span className="col-span-2 text-right">Avg Results</span>
                <span className="col-span-2 text-right">Clicks</span>
              </div>
              {topQueries.map((q, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-gray-800/20 border border-gray-700/30 hover:bg-gray-800/40 transition-[opacity,transform]"
                >
                  <span className="col-span-6 text-sm text-gray-300 truncate font-mono">
                    {q.query}
                  </span>
                  <span className="col-span-2 text-sm text-white text-right font-semibold">
                    {Number(q.searchCount)}
                  </span>
                  <span className={`col-span-2 text-sm text-right ${Number(q.avgResults) === 0 ? "text-red-400" : "text-gray-400"}`}>
                    {Number(q.avgResults)}
                  </span>
                  <span className="col-span-2 text-sm text-cyan-400 text-right">
                    {Number(q.clickCount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs text-center py-6">No search data yet</p>
          )}
        </div>

        {/* Zero-Result Queries — Content Gaps */}
        <div className="bg-[#141B2D]/40 border border-red-900/30 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-red-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Content Gaps (Zero-Result Queries)
          </h3>

          {zeroResultLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            </div>
          ) : zeroResultQueries && zeroResultQueries.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase tracking-wide font-semibold px-3 py-1.5">
                <span className="col-span-8">Query</span>
                <span className="col-span-2 text-right">Count</span>
                <span className="col-span-2 text-right">Last</span>
              </div>
              {zeroResultQueries.map((q, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-red-950/20 border border-red-900/20 hover:bg-red-950/30 transition-[opacity,transform]"
                >
                  <span className="col-span-8 text-sm text-gray-300 truncate font-mono">
                    {q.query}
                  </span>
                  <span className="col-span-2 text-sm text-red-400 text-right font-semibold">
                    {Number(q.searchCount)}
                  </span>
                  <span className="col-span-2 text-xs text-gray-500 text-right">
                    {q.lastSearched ? new Date(q.lastSearched).toLocaleDateString() : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs text-center py-6">No zero-result queries — great coverage!</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared metric card ────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}
