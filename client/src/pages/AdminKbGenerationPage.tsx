/**
 * AdminKbGenerationPage — Manage auto-generated KB articles
 * Review, approve, reject, or publish KB articles generated from resolved tickets
 * Includes full metrics dashboard with Chart.js visualizations
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Calendar,
  RefreshCw,
  AlertCircle,
  BarChart2,
  BookOpen,
  Sparkles,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Streamdown } from "streamdown";

type Tab = "pending" | "metrics";

export default function AdminKbGenerationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Fetch pending KB generations
  const { data: pending = [], isLoading, refetch } = trpc.kbGeneration.listPending.useQuery(
    undefined,
    { refetchInterval: 60_000 }
  );

  // Fetch metrics
  const { data: metricsData } = trpc.kbGeneration.getMetrics.useQuery({ days: 30 });

  // Mutations
  const bulkGenerateMutation = trpc.kbGeneration.bulkGenerateFromResolved.useMutation({
    onSuccess: (result) => {
      toast.success(`Queued ${result.queued} KB generations from ${result.total} resolved tickets`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const approveMutation = trpc.kbGeneration.approve.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.publish ? "KB article approved & published!" : "KB article approved");
      refetch();
      setSelectedId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.kbGeneration.reject.useMutation({
    onSuccess: () => {
      toast.success("KB article rejected");
      refetch();
      setSelectedId(null);
      setShowRejectDialog(false);
      setRejectionReason("");
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedItem = pending.find((p) => p.id === selectedId) ?? null;
  const metrics = metricsData?.totals;

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-cyan-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getConfidenceBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-cyan-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <AdminLayout title="KB Generation">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-cyan-400" size={24} />
              Copilot KB Generation
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              AI-powered knowledge base articles auto-generated from resolved support tickets
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkGenerateMutation.mutate()}
              disabled={bulkGenerateMutation.isPending}
              className="border-cyan-600/40 text-cyan-400 hover:bg-cyan-900/20"
            >
              <Zap size={14} className="mr-1.5" />
              {bulkGenerateMutation.isPending ? "Generating..." : "Generate from All Resolved"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#141B2D] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Generated</p>
            <p className="text-2xl font-bold text-white">{metrics?.totalGenerated ?? 0}</p>
            <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
          </div>
          <div className="bg-[#141B2D] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{pending.length}</p>
            <p className="text-xs text-gray-600 mt-1">Awaiting review</p>
          </div>
          <div className="bg-[#141B2D] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Approved</p>
            <p className="text-2xl font-bold text-cyan-400">{metrics?.totalApproved ?? 0}</p>
            <p className="text-xs text-gray-600 mt-1">Ready to publish</p>
          </div>
          <div className="bg-[#141B2D] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Published</p>
            <p className="text-2xl font-bold text-emerald-400">{metrics?.totalPublished ?? 0}</p>
            <p className="text-xs text-gray-600 mt-1">Live in KB</p>
          </div>
          <div className="bg-[#141B2D] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Approval Rate</p>
            <p className="text-2xl font-bold text-white">{metrics?.approvalRate ?? 0}%</p>
            <p className="text-xs text-gray-600 mt-1">Avg confidence: {metrics?.avgConfidenceScore ?? 0}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-800">
          {(["pending", "metrics"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "pending" ? (
                <span className="flex items-center gap-2">
                  <AlertCircle size={14} />
                  Pending Approval
                  {pending.length > 0 && (
                    <span className="bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {pending.length}
                    </span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <BarChart2 size={14} />
                  Metrics
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pending Tab */}
        {activeTab === "pending" && (
          <div className="bg-[#141B2D] border border-gray-800 rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-gray-500">Loading generations...</div>
            ) : pending.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No pending KB generations</p>
                <p className="text-xs mt-1 text-gray-600">
                  Close a resolved ticket to auto-generate KB articles via Copilot
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {pending.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium mb-1 truncate">{item.generatedTitle}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{item.generatedContent}</p>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-1.5">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(item.confidence ?? 0)}`} style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
                          <TrendingUp size={12} />
                          {item.confidence}% confidence
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-800 rounded capitalize">{item.suggestedCategory}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(item.generatedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap size={11} />
                        {item.generatedBy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === "metrics" && (
          <div className="space-y-4">
            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#141B2D] border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <BookOpen size={16} className="text-cyan-400" />
                  How It Works
                </h3>
                <ol className="space-y-2 text-sm text-gray-400">
                  <li className="flex gap-2"><span className="text-cyan-400 font-bold">1.</span> Agent closes a resolved ticket</li>
                  <li className="flex gap-2"><span className="text-cyan-400 font-bold">2.</span> Copilot analyzes ticket content</li>
                  <li className="flex gap-2"><span className="text-cyan-400 font-bold">3.</span> AI generates structured KB article</li>
                  <li className="flex gap-2"><span className="text-cyan-400 font-bold">4.</span> Admin reviews and approves/rejects</li>
                  <li className="flex gap-2"><span className="text-cyan-400 font-bold">5.</span> Published article appears in KB</li>
                </ol>
              </div>
              <div className="bg-[#141B2D] border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  Performance Summary
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Approval Rate</span>
                      <span className="text-white font-medium">{metrics?.approvalRate ?? 0}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${metrics?.approvalRate ?? 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Avg Confidence Score</span>
                      <span className={`font-medium ${getConfidenceColor(metrics?.avgConfidenceScore ?? 0)}`}>{metrics?.avgConfidenceScore ?? 0}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className={`${getConfidenceBg(metrics?.avgConfidenceScore ?? 0)} h-1.5 rounded-full`} style={{ width: `${metrics?.avgConfidenceScore ?? 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Publish Rate</span>
                      <span className="text-white font-medium">
                        {metrics?.totalApproved
                          ? Math.round(((metrics?.totalPublished ?? 0) / metrics.totalApproved) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${metrics?.totalApproved ? Math.round(((metrics?.totalPublished ?? 0) / metrics.totalApproved) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent history */}
            {metricsData?.metrics && metricsData.metrics.length > 0 ? (
              <div className="bg-[#141B2D] border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    Daily Activity (Last 30 Days)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-gray-500 text-xs px-4 py-2 font-medium">Date</th>
                        <th className="text-right text-gray-500 text-xs px-4 py-2 font-medium">Generated</th>
                        <th className="text-right text-gray-500 text-xs px-4 py-2 font-medium">Approved</th>
                        <th className="text-right text-gray-500 text-xs px-4 py-2 font-medium">Published</th>
                        <th className="text-right text-gray-500 text-xs px-4 py-2 font-medium">Rejected</th>
                        <th className="text-right text-gray-500 text-xs px-4 py-2 font-medium">Avg Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {metricsData.metrics.slice(0, 10).map((m) => (
                        <tr key={m.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-2 text-gray-300">{new Date(m.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-right text-white">{m.totalGenerated}</td>
                          <td className="px-4 py-2 text-right text-cyan-400">{m.totalApproved}</td>
                          <td className="px-4 py-2 text-right text-emerald-400">{m.totalPublished}</td>
                          <td className="px-4 py-2 text-right text-red-400">{m.totalRejected}</td>
                          <td className={`px-4 py-2 text-right font-medium ${getConfidenceColor(m.avgConfidenceScore ?? 0)}`}>{m.avgConfidenceScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-[#141B2D] border border-gray-800 rounded-xl p-12 text-center text-gray-500">
                <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
                <p>No metrics data yet</p>
                <p className="text-xs mt-1 text-gray-600">Start generating KB articles to see analytics here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-2xl bg-[#141B2D] border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-400" />
              Generated KB Article
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Review AI-generated content before approving or rejecting
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 mt-2">
              {/* Metadata row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0A0E1A] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="text-white text-sm font-medium capitalize">{selectedItem.suggestedCategory}</p>
                </div>
                <div className="bg-[#0A0E1A] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Generated By</p>
                  <p className="text-white text-sm font-medium capitalize">{selectedItem.generatedBy}</p>
                </div>
                <div className="bg-[#0A0E1A] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                      <div className={`${getConfidenceBg(selectedItem.confidence ?? 0)} h-1.5 rounded-full`} style={{ width: `${selectedItem.confidence}%` }} />
                    </div>
                    <span className={`text-sm font-bold ${getConfidenceColor(selectedItem.confidence ?? 0)}`}>{selectedItem.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Title</p>
                <p className="text-white text-lg font-semibold leading-snug">{selectedItem.generatedTitle}</p>
              </div>

              {/* Tags */}
              {selectedItem.suggestedTags && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Suggested Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.suggestedTags.split(",").map((tag) => (
                      <span key={tag.trim()} className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded border border-gray-700">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Article Content</p>
                <div className="bg-[#0A0E1A] border border-gray-800 rounded-lg p-4 text-gray-300 text-sm max-h-64 overflow-y-auto">
                  <Streamdown>{selectedItem.generatedContent}</Streamdown>
                </div>
              </div>

              {/* Source Ticket */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Source Ticket</p>
                <div className="bg-[#0A0E1A] border border-gray-800 rounded-lg p-3">
                  <p className="text-white font-medium text-sm mb-1">{selectedItem.sourceTicketTitle}</p>
                  <p className="text-gray-400 text-xs line-clamp-3">{selectedItem.sourceTicketContent}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-800">
                <Button variant="outline" onClick={() => setSelectedId(null)} className="border-gray-700 text-gray-400">
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle size={14} className="mr-1.5" />
                  Reject
                </Button>
                <Button
                  onClick={() => approveMutation.mutate({ generationId: selectedItem.id, publish: false })}
                  disabled={approveMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  <CheckCircle size={14} className="mr-1.5" />
                  Approve (Draft)
                </Button>
                <Button
                  onClick={() => approveMutation.mutate({ generationId: selectedItem.id, publish: true })}
                  disabled={approveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  <CheckCircle size={14} className="mr-1.5" />
                  Approve & Publish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-[#141B2D] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle size={16} className="text-red-400" />
              Reject KB Article
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Provide a reason so Copilot can improve future generations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Textarea
              placeholder="e.g., Inaccurate resolution steps, duplicate of existing article, too generic..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-[#0A0E1A] border-gray-700 text-white placeholder:text-gray-600 min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectionReason(""); }} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!rejectionReason.trim()) { toast.error("Please provide a rejection reason"); return; }
                  rejectMutation.mutate({ generationId: selectedItem!.id, reason: rejectionReason });
                }}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
