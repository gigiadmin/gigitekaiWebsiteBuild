import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { AlertCircle, TrendingUp, TrendingDown, Zap } from "lucide-react";

/**
 * KB Quality Dashboard
 * Shows article quality scores, health metrics, and improvement opportunities
 */
export const KBQualityDashboard: React.FC = () => {
  const [selectedArticleId, setSelectedArticleId] = useState<number | undefined>();

  // Get quality scores
  const calculateScores = trpc.kbBulkOperations.calculateArticleQualityScores.useMutation();
  const [qualityData, setQualityData] = React.useState<any>(null);
  const scoresLoading = calculateScores.isPending;

  React.useEffect(() => {
    if (selectedArticleId || !selectedArticleId) {
      calculateScores.mutate({ articleId: selectedArticleId }, {
        onSuccess: (data) => setQualityData(data),
      });
    }
  }, [selectedArticleId]);

  // Get health metrics
  const getMetrics = trpc.kbBulkOperations.getKbHealthMetrics.useQuery();
  const healthMetrics = getMetrics.data;
  const metricsLoading = getMetrics.isLoading;

  const isLoading = scoresLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const topArticles = qualityData?.topArticles || [];
  const lowArticles = qualityData?.lowScoringArticles || [];

  return (
    <div className="space-y-6">
      {/* Health Metrics */}
      {healthMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">{healthMetrics.totalArticles}</p>
              </div>
              <Zap className="w-8 h-8 text-cyan-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tagged Articles</p>
                <p className="text-2xl font-bold">{healthMetrics.articlesWithTags}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tagging Coverage</p>
                <p className="text-2xl font-bold">{healthMetrics.taggingCoverage}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Tags/Article</p>
                <p className="text-2xl font-bold">{healthMetrics.averageTagsPerArticle}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Top Performing Articles */}
      {topArticles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Top Performing Articles
          </h3>

          <div className="space-y-3">
            {topArticles.map((article: any) => (
              <div key={article.articleId} className="flex items-center justify-between p-3 bg-muted rounded">
                <div className="flex-1">
                  <p className="font-medium">Article #{article.articleId}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>Quality: {article.score.toFixed(1)}/100</span>
                    <span>Feedback: {article.feedback.toFixed(1)}</span>
                    <span>Views: {article.views}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-500">{article.score.toFixed(0)}</div>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Low Performing Articles - Improvement Opportunities */}
      {lowArticles.length > 0 && (
        <Card className="p-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Improvement Opportunities
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            These articles have low quality scores. Consider updating content, adding examples, or improving clarity.
          </p>

          <div className="space-y-3">
            {lowArticles.map((article: any) => (
              <div key={article.articleId} className="flex items-center justify-between p-3 bg-background rounded border border-orange-200">
                <div className="flex-1">
                  <p className="font-medium">Article #{article.articleId}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>Quality: {article.score.toFixed(1)}/100</span>
                    <span>Feedback: {article.feedback.toFixed(1)}</span>
                    <span>Views: {article.views}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-500">{article.score.toFixed(0)}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedArticleId(article.articleId)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quality Score Distribution */}
      {qualityData?.scores && qualityData.scores.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quality Score Distribution</h3>

          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="views"
                name="Views"
                type="number"
              />
              <YAxis
                dataKey="score"
                name="Quality Score"
                type="number"
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded p-2 text-sm">
                        <p>Article #{data.articleId}</p>
                        <p>Score: {data.score.toFixed(1)}</p>
                        <p>Views: {data.views}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name="Articles"
                data={qualityData.scores}
                fill="#00d4ff"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

export default KBQualityDashboard;
