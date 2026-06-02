import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Lightbulb, Zap, TrendingUp, Play } from "lucide-react";
import { CommandExecutionModal } from "./CommandExecutionModal";

/**
 * AI Suggestions Component for Command Center
 * Displays AI-powered command suggestions, automation opportunities, and performance insights
 */
export function CommandCenterAISuggestions() {
  const [selectedCommand, setSelectedCommand] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Fetch AI suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = trpc.aiCommandSuggestions.getSuggestions.useQuery({
    limit: 5,
    contextWindow: 10,
  });

  const { data: automationData, isLoading: automationLoading } = trpc.aiCommandSuggestions.getAutomationOpportunities.useQuery({
    days: 7,
    minFrequency: 3,
  });

  const { data: insightsData, isLoading: insightsLoading } = trpc.aiCommandSuggestions.getPerformanceInsights.useQuery({
    days: 7,
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="suggestions" className="space-y-4">
      <TabsList className="bg-slate-800 border-slate-700">
        <TabsTrigger value="suggestions">
          <Lightbulb className="w-4 h-4 mr-2" />
          Suggestions
        </TabsTrigger>
        <TabsTrigger value="automation">
          <Zap className="w-4 h-4 mr-2" />
          Automation
        </TabsTrigger>
        <TabsTrigger value="insights">
          <TrendingUp className="w-4 h-4 mr-2" />
          Insights
        </TabsTrigger>
      </TabsList>

      {/* Suggestions Tab */}
      <TabsContent value="suggestions">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              AI Command Suggestions
            </CardTitle>
            <CardDescription>Next commands you might want to execute based on your recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : suggestionsData?.suggestions && suggestionsData.suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestionsData.suggestions.map((suggestion: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-700 rounded-lg border-l-4 border-yellow-400">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-white font-medium text-lg">{suggestion.command}</p>
                        <p className="text-slate-300 text-sm mt-1">{suggestion.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-yellow-400">
                          {(suggestion.confidence * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-slate-400">confidence</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3 italic mb-3">{suggestion.reasoning}</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedCommand(suggestion);
                        setModalOpen(true);
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Execute
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No suggestions available yet. Execute more commands to get personalized suggestions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Automation Tab */}
      <TabsContent value="automation">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Automation Opportunities
            </CardTitle>
            <CardDescription>Repetitive command sequences that could be automated</CardDescription>
          </CardHeader>
          <CardContent>
            {automationLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : automationData?.opportunities && automationData.opportunities.length > 0 ? (
              <div className="space-y-4">
                {automationData.opportunities.map((opp: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-700 rounded-lg border-l-4 border-blue-400">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-medium">{opp.pattern}</p>
                        <p className="text-slate-300 text-sm mt-1">{opp.automationSuggestion}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400">{opp.frequency}x</div>
                        <p className="text-xs text-slate-400">occurrences</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <p className="text-slate-400">Time Saved</p>
                        <p className="text-green-400 font-medium">{opp.estimatedTimeSavings}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Complexity</p>
                        <p className={`font-medium ${
                          opp.complexity === 'low' ? 'text-green-400' :
                          opp.complexity === 'medium' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {opp.complexity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No automation opportunities detected yet. Keep executing commands to identify patterns.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Insights Tab */}
      <TabsContent value="insights">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Performance Insights
            </CardTitle>
            <CardDescription>AI-powered recommendations to optimize your workflow</CardDescription>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : insightsData?.insights && insightsData.insights.length > 0 ? (
              <div className="space-y-4">
                {/* Metrics Summary */}
                {insightsData.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="p-3 bg-slate-700 rounded">
                      <p className="text-xs text-slate-400">Total Commands</p>
                      <p className="text-xl font-bold text-cyan-400">{insightsData.metrics.totalCommands}</p>
                    </div>
                    <div className="p-3 bg-slate-700 rounded">
                      <p className="text-xs text-slate-400">Success Rate</p>
                      <p className="text-xl font-bold text-green-400">{insightsData.metrics.successRate}%</p>
                    </div>
                    <div className="p-3 bg-slate-700 rounded">
                      <p className="text-xs text-slate-400">Avg Exec Time</p>
                      <p className="text-xl font-bold text-blue-400">{insightsData.metrics.avgExecutionTime}ms</p>
                    </div>
                    <div className="p-3 bg-slate-700 rounded">
                      <p className="text-xs text-slate-400">Audit Logs</p>
                      <p className="text-xl font-bold text-purple-400">{insightsData.metrics.auditLogEntries}</p>
                    </div>
                  </div>
                )}

                {/* Insights List */}
                <div className="space-y-3">
                  {insightsData.insights.map((insight: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        insight.severity === 'critical' ? 'bg-red-900/20 border-red-400' :
                        insight.severity === 'high' ? 'bg-orange-900/20 border-orange-400' :
                        'bg-yellow-900/20 border-yellow-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-white font-medium">{insight.insight}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          insight.severity === 'critical' ? 'bg-red-400 text-red-900' :
                          insight.severity === 'high' ? 'bg-orange-400 text-orange-900' :
                          'bg-yellow-400 text-yellow-900'
                        }`}>
                          {insight.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{insight.recommendation}</p>
                      <p className="text-xs text-slate-400">
                        <span className="text-green-400 font-medium">Expected improvement:</span> {insight.expectedImprovement}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No insights available yet. Performance data will be analyzed after more activity.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      {/* Command Execution Modal */}
      <CommandExecutionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        command={selectedCommand}
        onExecutionComplete={() => {
          setModalOpen(false);
          setSelectedCommand(null);
        }}
      />
    </div>
  );
}
