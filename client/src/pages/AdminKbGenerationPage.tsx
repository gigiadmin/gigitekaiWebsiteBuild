/**
 * AdminKbGenerationPage — Manage auto-generated KB articles
 * Review, approve, reject, or publish KB articles generated from resolved tickets
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Eye,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Streamdown } from "streamdown";

export default function AdminKbGenerationPage() {
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
  const approveMutation = trpc.kbGeneration.approve.useMutation({
    onSuccess: () => {
      toast.success("KB article approved");
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

  return (
    <AdminLayout title="KB Generation">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="text-cyan-400" size={24} />
              KB Auto-Generation
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Review and approve AI-generated knowledge base articles from resolved tickets
            </p>
          </div>
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

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Generated</p>
              <p className="text-2xl font-bold text-white">{metrics.totalGenerated}</p>
            </div>
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Approved</p>
              <p className="text-2xl font-bold text-cyan-400">{metrics.totalApproved}</p>
            </div>
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Published</p>
              <p className="text-2xl font-bold text-green-400">{metrics.totalPublished}</p>
            </div>
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Approval Rate</p>
              <p className="text-2xl font-bold text-white">{metrics.approvalRate}%</p>
            </div>
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Confidence</p>
              <p className="text-2xl font-bold text-white">{metrics.avgConfidenceScore}%</p>
            </div>
          </div>
        )}

        {/* Pending Generations */}
        <div className="bg-[#141B2D] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-400" />
              Pending Approval ({pending.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading generations...</div>
          ) : pending.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p>No pending KB generations</p>
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
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">{item.generatedTitle}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{item.generatedContent}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 text-xs font-medium">
                        <TrendingUp size={12} />
                        {item.confidence}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-800 rounded">{item.suggestedCategory}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(item.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-2xl bg-[#141B2D] border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText size={18} className="text-cyan-400" />
              Generated KB Article
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Review and approve this AI-generated article
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 mt-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Category</p>
                  <p className="text-white font-medium">{selectedItem.suggestedCategory}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-cyan-400 h-2 rounded-full"
                        style={{ width: `${selectedItem.confidence}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{selectedItem.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Title</p>
                <p className="text-white text-lg font-semibold">{selectedItem.generatedTitle}</p>
              </div>

              {/* Tags */}
              {selectedItem.suggestedTags && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.suggestedTags.split(",").map((tag) => (
                      <span
                        key={tag.trim()}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Content</p>
                <div className="bg-[#0A0E1A] border border-gray-800 rounded-lg p-4 text-gray-300 text-sm">
                  <Streamdown>{selectedItem.generatedContent}</Streamdown>
                </div>
              </div>

              {/* Source Ticket */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">From Ticket</p>
                <div className="bg-[#0A0E1A] border border-gray-800 rounded-lg p-3">
                  <p className="text-white font-medium text-sm mb-1">{selectedItem.sourceTicketTitle}</p>
                  <p className="text-gray-400 text-xs line-clamp-3">{selectedItem.sourceTicketContent}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => setSelectedId(null)}
                  className="border-gray-700 text-gray-400"
                >
                  Close
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
                  onClick={() =>
                    approveMutation.mutate({
                      generationId: selectedItem.id,
                      publish: false,
                    })
                  }
                  disabled={approveMutation.isPending}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                >
                  <CheckCircle size={14} className="mr-1.5" />
                  Approve
                </Button>
                <Button
                  onClick={() =>
                    approveMutation.mutate({
                      generationId: selectedItem.id,
                      publish: true,
                    })
                  }
                  disabled={approveMutation.isPending}
                  className="bg-green-500 hover:bg-green-400 text-black font-semibold"
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
            <DialogTitle className="text-white">Reject KB Article</DialogTitle>
            <DialogDescription className="text-gray-400">
              Provide a reason for rejecting this generated article
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="Why are you rejecting this article? (e.g., inaccurate, incomplete, duplicate)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-[#0A0E1A] border-gray-700 text-white placeholder:text-gray-600 min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                }}
                className="border-gray-700 text-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error("Please provide a rejection reason");
                    return;
                  }
                  rejectMutation.mutate({
                    generationId: selectedItem!.id,
                    reason: rejectionReason,
                  });
                }}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="bg-red-500 hover:bg-red-400 text-white font-semibold"
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
