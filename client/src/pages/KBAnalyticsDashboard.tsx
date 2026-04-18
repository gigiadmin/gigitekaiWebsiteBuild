import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';

export default function KBAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { data: analyticsData, isLoading } = trpc.aibot.getKBAnalytics.useQuery({
    articleId: undefined,
  });

  useEffect(() => {
    if (analyticsData?.success) {
      setAnalytics(analyticsData.analytics);
      setLoading(false);
    }
  }, [analyticsData]);

  const COLORS = ['#00D4FF', '#FF006E', '#8338EC', '#FFBE0B', '#FB5607'];

  // Prepare data for charts
  const topArticles = analytics?.slice(0, 10).map((a: any) => ({
    title: a.title?.substring(0, 20) + '...' || 'Unknown',
    suggestions: a.suggestions || 0,
    helpful: a.helpful_count || 0,
    unhelpful: a.unhelpful_count || 0,
    helpfulRate: a.helpful_rate || 0,
  })) || [];

  const feedbackBreakdown = [
    { name: 'Helpful', value: analytics?.reduce((sum: number, a: any) => sum + (a.helpful_count || 0), 0) || 0 },
    { name: 'Unhelpful', value: analytics?.reduce((sum: number, a: any) => sum + (a.unhelpful_count || 0), 0) || 0 },
  ];

  const needsImprovement = analytics
    ?.filter((a: any) => a.unhelpful_count > 0)
    .sort((a: any, b: any) => (b.unhelpful_count || 0) - (a.unhelpful_count || 0))
    .slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">KB Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track knowledge base article performance and user feedback</p>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={dateRange === '7d' ? 'default' : 'outline'}
            onClick={() => setDateRange('7d')}
            size="sm"
          >
            Last 7 Days
          </Button>
          <Button
            variant={dateRange === '30d' ? 'default' : 'outline'}
            onClick={() => setDateRange('30d')}
            size="sm"
          >
            Last 30 Days
          </Button>
          <Button
            variant={dateRange === '90d' ? 'default' : 'outline'}
            onClick={() => setDateRange('90d')}
            size="sm"
          >
            Last 90 Days
          </Button>
        </div>

        {loading || isLoading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-400">
                    {analytics?.reduce((sum: number, a: any) => sum + (a.suggestions || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">KB articles suggested to users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Helpful Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">
                    {feedbackBreakdown[0]?.value || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Users found articles helpful</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unhelpful Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-400">
                    {feedbackBreakdown[1]?.value || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Articles needing improvement</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Helpful Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">
                    {analytics && analytics.length > 0
                      ? Math.round(
                          (analytics.reduce((sum: number, a: any) => sum + (a.helpful_rate || 0), 0) /
                            analytics.length) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Across all articles</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Articles Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Suggested Articles</CardTitle>
                <CardDescription>Most frequently suggested KB articles to users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topArticles}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="title" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00D4FF' }}
                      labelStyle={{ color: '#00D4FF' }}
                    />
                    <Legend />
                    <Bar dataKey="suggestions" fill="#00D4FF" name="Suggestions" />
                    <Bar dataKey="helpful" fill="#00FF00" name="Helpful" />
                    <Bar dataKey="unhelpful" fill="#FF0000" name="Unhelpful" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feedback Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Breakdown</CardTitle>
                  <CardDescription>Helpful vs Unhelpful ratings</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={feedbackBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {feedbackBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00D4FF' }}
                        labelStyle={{ color: '#00D4FF' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Articles Needing Improvement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Articles Needing Improvement
                  </CardTitle>
                  <CardDescription>Highest unhelpful feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {needsImprovement.length > 0 ? (
                      needsImprovement.map((article: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-card rounded border border-border">
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">{article.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {article.unhelpful_count} unhelpful ratings
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-400">{article.unhelpful_count}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">All articles have positive feedback!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* All Articles Table */}
            <Card>
              <CardHeader>
                <CardTitle>All KB Articles Performance</CardTitle>
                <CardDescription>Complete analytics for all knowledge base articles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Article Title</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Suggestions</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Helpful</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Unhelpful</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Helpful Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.map((article: any, idx: number) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground">{article.title}</td>
                          <td className="text-center py-3 px-4 text-cyan-400 font-medium">{article.suggestions || 0}</td>
                          <td className="text-center py-3 px-4 text-green-400 font-medium">{article.helpful_count || 0}</td>
                          <td className="text-center py-3 px-4 text-red-400 font-medium">{article.unhelpful_count || 0}</td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-medium ${
                              (article.helpful_rate || 0) > 0.7 ? 'text-green-400' : 
                              (article.helpful_rate || 0) > 0.4 ? 'text-yellow-400' : 
                              'text-red-400'
                            }`}>
                              {Math.round((article.helpful_rate || 0) * 100)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
