/**
 * TicketAIPanel — AI Analysis & Draft Reply panel for admin ticket views
 * Integrates with ticketAI tRPC router (analyzeTicket, suggestResponse, getAnalysis)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  MessageSquare,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TicketAIPanelProps {
  ticketId: number;
  onDraftReply?: (draft: string) => void;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-green-400",
  neutral: "text-slate-400",
  frustrated: "text-yellow-400",
  angry: "text-red-400",
  urgent: "text-orange-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-700 text-slate-300",
  medium: "bg-yellow-900/50 text-yellow-300",
  high: "bg-orange-900/50 text-orange-300",
  critical: "bg-red-900/50 text-red-400",
};

export default function TicketAIPanel({ ticketId, onDraftReply }: TicketAIPanelProps) {
  const [model, setModel] = useState<"claude" | "manus" | "gemini">("claude");
  const [tone, setTone] = useState<"professional" | "friendly" | "technical">("professional");
  const [expanded, setExpanded] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [draftReply, setDraftReply] = useState<string>("");
  const [kbUsed, setKbUsed] = useState<Array<{ id: number; title: string }>>([]);

  // Load stored analysis
  const { data: storedAnalysis, isLoading: loadingStored } = trpc.ticketAI.getAnalysis.useQuery(
    { ticketId },
    { retry: false }
  );

  const analyzeMutation = trpc.ticketAI.analyzeTicket.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      setKbUsed(data.kbArticlesUsed);
      toast.success("AI analysis complete");
    },
    onError: (err) => {
      toast.error(`Analysis failed: ${err.message}`);
    },
  });

  const suggestMutation = trpc.ticketAI.suggestResponse.useMutation({
    onSuccess: (data) => {
      setDraftReply(data.draftReply);
      setKbUsed(data.kbArticlesUsed);
      toast.success("Draft reply generated");
    },
    onError: (err) => {
      toast.error(`Draft failed: ${err.message}`);
    },
  });

  const handleAnalyze = () => {
    analyzeMutation.mutate({ ticketId, model });
  };

  const handleSuggestReply = () => {
    suggestMutation.mutate({ ticketId, tone, model });
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(draftReply);
    toast.success("Draft copied to clipboard");
  };

  const handleUseDraft = () => {
    if (onDraftReply) {
      onDraftReply(draftReply);
      toast.success("Draft inserted into reply box");
    }
  };

  const analysis = analysisResult || (storedAnalysis?.hasAnalysis ? storedAnalysis : null);
  const hasStoredAnalysis = storedAnalysis?.hasAnalysis;

  return (
    <div className="border border-cyan-900/40 rounded-lg bg-[#0d1117] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1117] hover:bg-cyan-950/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-300">AI Analysis</span>
          {hasStoredAnalysis && (
            <Badge variant="outline" className="text-xs border-cyan-800 text-cyan-500">
              Analyzed
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Model + Controls */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Select value={model} onValueChange={(v) => setModel(v as typeof model)}>
              <SelectTrigger className="w-40 h-8 text-xs bg-slate-900 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude">Claude 3.5</SelectItem>
                <SelectItem value="gemini">Gemini 1.5</SelectItem>
                <SelectItem value="manus">Manus LLM</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-cyan-800 text-cyan-400 hover:bg-cyan-950/30"
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              {hasStoredAnalysis ? "Re-Analyze" : "Analyze Ticket"}
            </Button>
          </div>

          {/* Analysis Results */}
          {analyzeMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
              Analyzing ticket with {model}...
            </div>
          )}

          {(analysisResult || (hasStoredAnalysis && storedAnalysis)) && !analyzeMutation.isPending && (
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="bg-slate-900 h-8">
                <TabsTrigger value="analysis" className="text-xs h-7">Analysis</TabsTrigger>
                <TabsTrigger value="solutions" className="text-xs h-7">Solutions</TabsTrigger>
                <TabsTrigger value="reply" className="text-xs h-7">Draft Reply</TabsTrigger>
              </TabsList>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="mt-3 space-y-3">
                {analysisResult ? (
                  <>
                    {/* Summary */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {String(analysisResult.summary || "")}
                    </p>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900 rounded p-2">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Priority Score
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white">
                            {String(analysisResult.priorityScore || "—")}/10
                          </span>
                          <Badge
                            className={`text-xs ${PRIORITY_COLORS[String(analysisResult.priority)] || "bg-slate-700 text-slate-300"}`}
                          >
                            {String(analysisResult.priority || "—")}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded p-2">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Sentiment
                        </div>
                        <span
                          className={`text-sm font-semibold capitalize ${
                            SENTIMENT_COLORS[String(analysisResult.sentiment)] || "text-slate-300"
                          }`}
                        >
                          {String(analysisResult.sentiment || "—")}
                        </span>
                      </div>

                      <div className="bg-slate-900 rounded p-2">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Est. Resolution
                        </div>
                        <span className="text-xs text-white">
                          {String(analysisResult.estimatedResolutionTime || "Unknown")}
                        </span>
                      </div>

                      <div className="bg-slate-900 rounded p-2">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Escalation
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            analysisResult.escalationRequired ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {analysisResult.escalationRequired ? "Required" : "Not needed"}
                        </span>
                      </div>
                    </div>

                    {/* Root Cause */}
                    {analysisResult.rootCause && (
                      <div className="bg-slate-900 rounded p-2">
                        <div className="text-xs text-slate-500 mb-1">Root Cause</div>
                        <p className="text-xs text-slate-300">{String(analysisResult.rootCause)}</p>
                      </div>
                    )}

                    {/* Confidence */}
                    {typeof analysisResult.confidence === "number" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">AI Confidence:</span>
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                          <div
                            className="bg-cyan-500 h-1.5 rounded-full"
                            style={{ width: `${(analysisResult.confidence as number) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {Math.round((analysisResult.confidence as number) * 100)}%
                        </span>
                      </div>
                    )}
                  </>
                ) : hasStoredAnalysis && storedAnalysis ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-300">{storedAnalysis.aiReasoning}</p>
                    <div className="flex gap-2 flex-wrap">
                      {storedAnalysis.aiCategory && (
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                          {storedAnalysis.aiCategory}
                        </Badge>
                      )}
                      {storedAnalysis.aiPriority && (
                        <Badge
                          className={`text-xs ${PRIORITY_COLORS[storedAnalysis.aiPriority] || "bg-slate-700 text-slate-300"}`}
                        >
                          {storedAnalysis.aiPriority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 italic">
                      Run a fresh analysis to see full details.
                    </p>
                  </div>
                ) : null}
              </TabsContent>

              {/* Solutions Tab */}
              <TabsContent value="solutions" className="mt-3 space-y-3">
                {analysisResult?.suggestedSolutions &&
                Array.isArray(analysisResult.suggestedSolutions) ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 mb-2">AI-suggested resolution steps:</p>
                    {(analysisResult.suggestedSolutions as string[]).map((step, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-900/50 text-cyan-400 text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Run analysis to see suggested solutions.
                  </p>
                )}

                {/* KB Articles Used */}
                {kbUsed.length > 0 && (
                  <div className="border-t border-slate-800 pt-3">
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      KB Articles Referenced
                    </p>
                    <div className="space-y-1">
                      {kbUsed.map((kb) => (
                        <div
                          key={kb.id}
                          className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        >
                          #{kb.id} — {kb.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Draft Reply Tab */}
              <TabsContent value="reply" className="mt-3 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                    <SelectTrigger className="w-36 h-7 text-xs bg-slate-900 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-cyan-800 text-cyan-400 hover:bg-cyan-950/30"
                    onClick={handleSuggestReply}
                    disabled={suggestMutation.isPending}
                  >
                    {suggestMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Generate Draft
                  </Button>
                </div>

                {suggestMutation.isPending && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    Generating {tone} reply with {model}...
                  </div>
                )}

                {draftReply && !suggestMutation.isPending && (
                  <div className="space-y-2">
                    <div className="bg-slate-900 rounded p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {draftReply}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-slate-700 text-slate-400 hover:bg-slate-800"
                        onClick={handleCopyDraft}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      {onDraftReply && (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-cyan-700 hover:bg-cyan-600 text-white"
                          onClick={handleUseDraft}
                        >
                          Use Draft
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {!draftReply && !suggestMutation.isPending && (
                  <p className="text-xs text-slate-500 italic">
                    Click "Generate Draft" to create an AI-powered reply.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Empty state when no analysis yet */}
          {!analysisResult && !hasStoredAnalysis && !analyzeMutation.isPending && !loadingStored && (
            <p className="text-xs text-slate-500 italic">
              Click "Analyze Ticket" to get AI-powered insights, priority scoring, and solution suggestions.
            </p>
          )}

          {loadingStored && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading stored analysis...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
