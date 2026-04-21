import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KBAnalyticsDashboard } from "@/components/KBAnalyticsDashboard";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminKBAnalytics() {
  const [useNewDashboard, setUseNewDashboard] = useState(true);

  // Show new analytics dashboard
  if (useNewDashboard) {
    return (
      <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">KB Analytics</h1>
              <p className="text-gray-400 text-sm mt-1">Track article performance and effectiveness</p>
            </div>
            <button
              onClick={() => setUseNewDashboard(false)}
              className="text-xs text-gray-500 hover:text-gray-400 underline"
            >
              View Legacy Dashboard
            </button>
          </div>
          <KBAnalyticsDashboard />
        </div>
      </div>
      </AdminLayout>
    );
  }

  // Legacy dashboard code below
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = trpc.kbFeedback.getAnalytics.useQuery();
  const { data: summary, isLoading: summaryLoading } = trpc.kbFeedback.getSummary.useQuery();
  const { data: unhelpfulReasons, isLoading: reasonsLoading } = trpc.kbFeedback.getUnhelpfulReasons.useQuery();

  // Prepare chart data
  const articleChartData = analytics?.map((article: any) => ({
    title: article.title.substring(0, 20),
    helpful: article.helpful,
    unhelpful: article.unhelpful,
    fullTitle: article.title,
  })) || [];

  const reasonsChartData = unhelpfulReasons
    ? Object.entries(unhelpfulReasons).map(([reason, count]) => ({
        name: reason.substring(0, 20),
        value: count as number,
        fullName: reason,
      }))
    : [];

  const helpfulnessData = [
    {
      name: "Helpful",
      value: summary?.helpfulCount || 0,
      fill: "#10b981",
    },
    {
      name: "Unhelpful",
      value: summary?.unhelpfulCount || 0,
      fill: "#ef4444",
    },
  ];

  const isLoading = analyticsLoading || summaryLoading || reasonsLoading;

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">KB Analytics (Legacy)</h1>
            <p className="text-gray-400 text-sm mt-1">Legacy dashboard</p>
          </div>
          <button
            onClick={() => setUseNewDashboard(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline"
          >
            Switch to New Dashboard
          </button>
        </div>


        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card className="bg-slate-800 border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Articles</p>
                    <p className="text-3xl font-bold text-white mt-2">{summary?.totalArticles || 0}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-cyan-400 opacity-50" />
                </div>
              </Card>

              <Card className="bg-slate-800 border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Published</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">{summary?.publishedArticles || 0}</p>
                  </div>
                  <Badge className="bg-green-900/40 text-green-400">Active</Badge>
                </div>
              </Card>

              <Card className="bg-slate-800 border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Feedback</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{summary?.totalFeedback || 0}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-cyan-400 opacity-50" />
                </div>
              </Card>

              <Card className="bg-slate-800 border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Helpful</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">{summary?.helpfulCount || 0}</p>
                  </div>
                  <ThumbsUp className="w-8 h-8 text-green-400 opacity-50" />
                </div>
              </Card>

              <Card className="bg-slate-800 border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Helpfulness Rate</p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">{summary?.averageHelpfulRate || 0}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-cyan-400 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Helpfulness Distribution */}
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Feedback Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={helpfulnessData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {helpfulnessData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Top Unhelpful Reasons */}
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Issues</h3>
                <div className="space-y-3">
                  {reasonsChartData.slice(0, 5).map((reason, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{reason.fullName}</p>
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((reason.value as number) /
                                  Math.max(...reasonsChartData.map((r) => r.value as number))) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-red-400 ml-4">{reason.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Article Performance */}
            <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Article Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Title</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Category</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Helpful</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Unhelpful</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Rate</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.map((article: any) => (
                      <tr
                        key={article.id}
                        className="border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <td className="py-3 px-4 text-white text-sm">{article.title.substring(0, 40)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-slate-700 text-gray-300 text-xs">
                            {article.category.substring(0, 15)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-green-400 font-semibold">{article.helpful}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-red-400 font-semibold">{article.unhelpful}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-cyan-400 font-semibold">{article.helpfulRate}%</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={
                              article.isPublished
                                ? "bg-green-900/40 text-green-400"
                                : "bg-yellow-900/40 text-yellow-400"
                            }
                          >
                            {article.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Article Details */}
            {selectedArticle && (
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{selectedArticle.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Category</p>
                    <p className="text-white">{selectedArticle.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Status</p>
                    <Badge
                      className={
                        selectedArticle.isPublished
                          ? "bg-green-900/40 text-green-400"
                          : "bg-yellow-900/40 text-yellow-400"
                      }
                    >
                      {selectedArticle.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Total Feedback</p>
                    <p className="text-white text-lg font-semibold">{selectedArticle.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Helpfulness Rate</p>
                    <p className="text-cyan-400 text-lg font-semibold">{selectedArticle.helpfulRate}%</p>
                  </div>
                </div>

                {selectedArticle.unhelpfulFeedback.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <p className="text-gray-400 text-sm mb-3">Unhelpful Feedback</p>
                    <div className="space-y-2">
                      {selectedArticle.unhelpfulFeedback.map((feedback: string, idx: number) => (
                        <div key={idx} className="bg-slate-700/50 rounded p-3 text-sm text-gray-300">
                          "{feedback}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  
    </AdminLayout>
  );
}
