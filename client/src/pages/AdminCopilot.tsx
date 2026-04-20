import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

/**
 * Admin Copilot Dashboard
 * - Ticket pattern analysis
 * - KB article auto-generation
 * - Process improvement recommendations
 * - Weekly insights digest
 */

export default function AdminCopilot() {
  const [activeTab, setActiveTab] = useState<"analysis" | "insights" | "kb">("analysis");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Queries
  const analysisQuery = trpc.copilot.analyzeTicketPatterns.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const insightsQuery = trpc.copilot.getProcessInsights.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const generateKBMutation = trpc.copilot.generateKBArticle.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSelectedArticle(data.article);
      }
    },
  });

  const analysis = analysisQuery.data;
  const insights = insightsQuery.data;

  return (
    <AdminLayout>
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Copilot for Microsoft 365</h1>
          <p className="text-muted-foreground">
            AI-powered ticket analysis, KB generation, and process insights
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "analysis"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ticket Analysis
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "insights"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Process Insights
          </button>
          <button
            onClick={() => setActiveTab("kb")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "kb"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            KB Generation
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "analysis" && (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tickets</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analysisQuery.isLoading ? "-" : analysis?.ticketCount || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-cyan-400" />
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analysisQuery.isLoading ? "-" : analysis?.resolvedCount || 0}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Resolution</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analysisQuery.isLoading ? "-" : `${analysis?.avgResolutionTime || 0}h`}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">KB Suggestions</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analysisQuery.isLoading ? "-" : analysis?.suggestedArticles?.length || 0}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
              </Card>
            </div>

            {/* Top Issues */}
            {analysis?.topIssues && analysis.topIssues.length > 0 && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-bold text-foreground mb-4">Top Issues</h2>
                <div className="space-y-3">
                  {analysis.topIssues.map((issue: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between p-3 bg-background rounded">
                      <div>
                        <p className="font-medium text-foreground">{issue.issue}</p>
                        <p className="text-sm text-muted-foreground">Frequency: {issue.frequency}</p>
                        <p className="text-sm text-cyan-400 mt-1">{issue.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Suggested KB Articles */}
            {analysis?.suggestedArticles && analysis.suggestedArticles.length > 0 && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-bold text-foreground mb-4">Suggested KB Articles</h2>
                <div className="space-y-3">
                  {analysis.suggestedArticles.map((article: any, idx: number) => (
                    <div key={idx} className="p-4 bg-background rounded border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{article.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{article.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              article.priority === "high"
                                ? "bg-red-500/20 text-red-400"
                                : article.priority === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                            }`}>
                              {article.priority}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="ml-4"
                          onClick={() => generateKBMutation.mutate({ ticketId: idx })}
                          disabled={generateKBMutation.isPending}
                        >
                          {generateKBMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {analysisQuery.isLoading && (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            )}
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-6">
            {/* Weekly Summary */}
            {insights?.insights && (
              <>
                <Card className="p-6 bg-card border-border">
                  <h2 className="text-xl font-bold text-foreground mb-4">Weekly Summary</h2>
                  <p className="text-lg text-muted-foreground">{insights.insights.summary}</p>
                </Card>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-card border-border">
                    <p className="text-sm text-muted-foreground">Total Tickets</p>
                    <p className="text-2xl font-bold text-foreground">
                      {insights.insights.metrics.totalTickets}
                    </p>
                  </Card>
                  <Card className="p-4 bg-card border-border">
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold text-foreground">
                      {insights.insights.metrics.resolvedTickets}
                    </p>
                  </Card>
                  <Card className="p-4 bg-card border-border">
                    <p className="text-sm text-muted-foreground">Avg Resolution</p>
                    <p className="text-2xl font-bold text-foreground">
                      {insights.insights.metrics.avgResolutionTime}h
                    </p>
                  </Card>
                  <Card className="p-4 bg-card border-border">
                    <p className="text-sm text-muted-foreground">Critical</p>
                    <p className="text-2xl font-bold text-red-400">
                      {insights.insights.metrics.criticalCount}
                    </p>
                  </Card>
                </div>

                {/* Recommendations */}
                {insights.insights.recommendations && insights.insights.recommendations.length > 0 && (
                  <Card className="p-6 bg-card border-border">
                    <h2 className="text-xl font-bold text-foreground mb-4">Recommendations</h2>
                    <div className="space-y-3">
                      {insights.insights.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-4 bg-background rounded border border-border">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              rec.type === "automation"
                                ? "bg-cyan-400"
                                : rec.type === "documentation"
                                ? "bg-blue-400"
                                : rec.type === "process"
                                ? "bg-purple-400"
                                : "bg-green-400"
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{rec.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                              <div className="flex gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  rec.impact === "high"
                                    ? "bg-red-500/20 text-red-400"
                                    : rec.impact === "medium"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-green-500/20 text-green-400"
                                }`}>
                                  Impact: {rec.impact}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  rec.effort === "high"
                                    ? "bg-red-500/20 text-red-400"
                                    : rec.effort === "medium"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-green-500/20 text-green-400"
                                }`}>
                                  Effort: {rec.effort}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {insightsQuery.isLoading && (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            )}
          </div>
        )}

        {activeTab === "kb" && (
          <div className="space-y-6">
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">KB Article Generator</h2>
              <p className="text-muted-foreground mb-4">
                Generate KB articles from resolved tickets. Articles require admin approval before publishing.
              </p>
              {selectedArticle && (
                <div className="mt-6 p-4 bg-background rounded border border-border">
                  <h3 className="font-bold text-foreground mb-2">{selectedArticle.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{selectedArticle.description}</p>
                  <div className="prose prose-invert max-w-none text-sm">
                    {selectedArticle.content}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                      {selectedArticle.category}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                      {selectedArticle.difficulty}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                      {selectedArticle.estimatedTime}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* KB Article Preview Dialog */}
      {selectedArticle && (
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedArticle.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">{selectedArticle.description}</p>
              <div className="prose prose-invert max-w-none">
                {selectedArticle.content}
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedArticle.tags?.split(",").map((tag: string) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                    {tag.trim()}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedArticle(null)}>
                  Cancel
                </Button>
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  Publish Article
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  
    </AdminLayout>);
}
