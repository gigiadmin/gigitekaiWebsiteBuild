import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, TrendingUp, Eye, Share2, CheckCircle2, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function KBAnalyticsDashboard() {
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

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

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-gray-400 ml-3">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">KB Analytics Dashboard</h2>
        <p className="text-gray-400 text-sm">Track article performance, effectiveness, and engagement</p>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Total Articles</p>
                <p className="text-2xl font-bold text-white mt-1">{metrics.totalArticles}</p>
              </div>
              <Eye className="w-8 h-8 text-cyan-400/30" />
            </div>
          </div>

          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Total Views</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{metrics.totalViews.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400/30" />
            </div>
          </div>

          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Shares</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{metrics.totalShares}</p>
              </div>
              <Share2 className="w-8 h-8 text-purple-400/30" />
            </div>
          </div>

          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Tickets Resolved</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{metrics.totalTicketsResolved}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400/30" />
            </div>
          </div>

          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Helpful Rate</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">{metrics.helpfulRate}%</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-orange-400/30" />
            </div>
          </div>

          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Avg Time (sec)</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{metrics.avgTimeSpent}</p>
              </div>
              <Eye className="w-8 h-8 text-cyan-400/30" />
            </div>
          </div>
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
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
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
                  className="p-3 rounded-lg bg-gray-800/20 border border-gray-700/30 hover:bg-gray-800/40 transition-all"
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
                  <span className="text-xs text-green-400">👍 Helpful: {articleAnalytics.helpfulCount}</span>
                </div>
                <div>
                  <span className="text-xs text-red-400">👎 Not Helpful: {articleAnalytics.unhelpfulCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
