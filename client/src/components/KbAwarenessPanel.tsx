/**
 * KbAwarenessPanel
 * Shown after a ticket is closed/resolved. Offers two capabilities:
 * 1. Suggest relevant existing KB articles related to the ticket
 * 2. Auto-generate a new KB article from the ticket using Copilot
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BookOpen,
  Zap,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  FileText,
} from "lucide-react";

interface KbAwarenessPanelProps {
  ticketId: number;
  ticketTitle: string;
  ticketStatus: string;
}

export default function KbAwarenessPanel({
  ticketId,
  ticketTitle,
  ticketStatus,
}: KbAwarenessPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Fetch KB suggestions for this ticket
  const { data: suggestions = [], isLoading: loadingSuggestions } =
    trpc.kbGeneration.suggestForTicket.useQuery(
      { ticketId },
      {
        enabled: expanded && (ticketStatus === "resolved" || ticketStatus === "closed"),
        staleTime: 60_000,
      }
    );

  // KB generation mutation
  const generateMutation = trpc.kbGeneration.generateFromTicket.useMutation({
    onSuccess: () => {
      setGenerated(true);
      setGenerating(false);
      toast.success("KB article generated! Pending admin approval.", {
        description: "Visit KB Generation in the admin panel to review and publish.",
        action: {
          label: "Review",
          onClick: () => window.open("/admin/kb-generation", "_blank"),
        },
      });
    },
    onError: (err) => {
      setGenerating(false);
      toast.error(`Failed to generate KB article: ${err.message}`);
    },
  });

  const handleGenerate = () => {
    setGenerating(true);
    generateMutation.mutate({ ticketId });
  };

  // Only show for resolved/closed tickets
  if (ticketStatus !== "resolved" && ticketStatus !== "closed") return null;

  return (
    <div className="mt-3 border border-cyan-500/20 rounded-lg bg-cyan-500/5 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-cyan-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-cyan-400" />
          <span className="text-cyan-300 text-xs font-semibold tracking-wide">
            COPILOT KB SUGGESTIONS
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-cyan-400" />
        ) : (
          <ChevronDown size={14} className="text-cyan-400" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-cyan-500/20">
          {/* Generate KB Article */}
          <div className="pt-3">
            <p className="text-slate-400 text-xs mb-2">
              Auto-generate a KB article from this resolved ticket using Copilot AI.
            </p>
            {generated ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle size={14} />
                <span>KB article generated — pending approval</span>
                <a
                  href="/admin/kb-generation"
                  target="_blank"
                  className="underline hover:text-emerald-300 flex items-center gap-1"
                >
                  Review <ExternalLink size={10} />
                </a>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
                className="h-7 text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-1.5"
              >
                {generating ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap size={12} />
                    Generate KB Article
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Related KB Articles */}
          <div>
            <p className="text-slate-500 text-xs font-medium mb-2 flex items-center gap-1.5">
              <BookOpen size={12} />
              Related KB Articles
            </p>
            {loadingSuggestions ? (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Loader2 size={12} className="animate-spin" />
                Finding related articles...
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-slate-600 text-xs">No related articles found.</p>
            ) : (
              <div className="space-y-1.5">
                {suggestions.map((article: any) => (
                  <a
                    key={article.id}
                    href={`/admin/kb?article=${article.id}`}
                    target="_blank"
                    className="flex items-start gap-2 p-2 bg-slate-800/60 rounded border border-slate-700/50 hover:border-cyan-500/30 transition-colors group"
                  >
                    <FileText size={12} className="text-slate-500 mt-0.5 flex-shrink-0 group-hover:text-cyan-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-300 text-xs font-medium truncate group-hover:text-white">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[9px] h-3.5 px-1 border-slate-600 text-slate-500"
                        >
                          {article.category}
                        </Badge>
                      </div>
                    </div>
                    <ExternalLink size={10} className="text-slate-600 flex-shrink-0 mt-0.5 group-hover:text-cyan-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
