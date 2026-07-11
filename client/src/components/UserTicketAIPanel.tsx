/**
 * UserTicketAIPanel — Simplified AI analysis panel for end-users on their ticket detail page.
 * Shows: AI-suggested solutions, related KB articles, estimated resolution time.
 * Does NOT expose admin-only fields (draft reply, sentiment, internal notes).
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Sparkles,
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface UserTicketAIPanelProps {
  ticketId: number;
}

export default function UserTicketAIPanel({ ticketId }: UserTicketAIPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [kbUsed, setKbUsed] = useState<Array<{ id: number; title: string }>>([]);

  // Load stored analysis if it exists
  const { data: storedAnalysis, isLoading: loadingStored } = trpc.ticketAI.getMyTicketAnalysis.useQuery(
    { ticketId },
    { retry: false }
  );

  const analyzeMutation = trpc.ticketAI.analyzeMyTicket.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      setKbUsed(data.kbArticlesUsed);
      toast.success("AI analysis complete — suggested solutions ready");
    },
    onError: () => {
      toast.error("AI analysis failed. Please try again.");
    },
  });

  // Build active analysis from local state or stored AI fields
  const hasStoredAnalysis = storedAnalysis?.hasAnalysis;
  const activeAnalysis: Record<string, unknown> | null = analysisResult || (
    hasStoredAnalysis ? {
      summary: storedAnalysis?.aiReasoning || null,
      rootCause: null,
      suggestedSteps: null,
      estimatedResolution: null,
    } : null
  );
  const activeKb = kbUsed;

  const suggestedSteps = activeAnalysis?.suggestedSteps as string[] | undefined;
  const rootCause = activeAnalysis?.rootCause as string | undefined;
  const estimatedResolution = activeAnalysis?.estimatedResolution as string | undefined;
  const summary = activeAnalysis?.summary as string | undefined;

  return (
    <div className="bg-[#0F1A30]/80 border border-[#00D4FF]/15 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#00D4FF]/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-[#00D4FF]" />
          </div>
          <span className="text-white font-semibold text-sm">AI-Powered Suggestions</span>
          {activeAnalysis && (
            <Badge className="bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20 text-xs">Ready</Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {!activeAnalysis && (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-[#00D4FF]" />
              </div>
              <p className="text-gray-400 text-sm mb-1">Let AI analyze your ticket</p>
              <p className="text-gray-600 text-xs mb-4">Get instant suggested solutions and related KB articles before waiting for a technician.</p>
              <Button
                size="sm"
                onClick={() => analyzeMutation.mutate({ ticketId })}
                disabled={analyzeMutation.isPending || loadingStored}
                className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-semibold text-xs"
              >
                {analyzeMutation.isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Analyzing...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Analyze My Ticket</>
                )}
              </Button>
            </div>
          )}

          {activeAnalysis && (
            <div className="space-y-4">
              {/* Summary */}
              {summary && (
                <div className="bg-[#0A0E1A]/60 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Issue Summary</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
                </div>
              )}

              {/* Root Cause */}
              {rootCause && (
                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Likely Cause</p>
                    <p className="text-gray-300 text-sm">{rootCause}</p>
                  </div>
                </div>
              )}

              {/* Suggested Steps */}
              {suggestedSteps && suggestedSteps.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Try These Steps First</p>
                  <div className="space-y-2">
                    {suggestedSteps.slice(0, 5).map((step, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <div className="w-5 h-5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[#00D4FF] text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estimated Resolution */}
              {estimatedResolution && (
                <div className="flex items-center gap-2 bg-[#0A0E1A]/40 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-[#00D4FF] flex-shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500">Estimated resolution: </span>
                    <span className="text-gray-300 text-sm font-medium">{estimatedResolution}</span>
                  </div>
                </div>
              )}

              {/* Related KB Articles */}
              {activeKb.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Related KB Articles
                  </p>
                  <div className="space-y-1.5">
                    {activeKb.slice(0, 4).map((article) => (
                      <a
                        key={article.id}
                        href={`/kb/${article.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#00D4FF] hover:text-[#00D4FF]/80 text-sm group"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-[#00D4FF]/50 group-hover:text-[#00D4FF] transition-colors" />
                        <span className="hover:underline truncate">{article.title}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Re-analyze button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => analyzeMutation.mutate({ ticketId })}
                disabled={analyzeMutation.isPending}
                className="w-full border-gray-700 text-gray-400 hover:text-white text-xs"
              >
                {analyzeMutation.isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Re-analyzing...</>
                ) : (
                  <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh Analysis</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


