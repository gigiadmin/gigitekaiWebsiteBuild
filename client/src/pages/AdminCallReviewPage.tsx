/**
 * Admin Call Review Page
 * Shows Teams PSTN call logs, AI-generated draft tickets, and review workflow.
 * Admins can approve (creating a real ticket) or reject draft tickets.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Phone,
  PhoneIncoming,
  PhoneOff,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  User,
  Zap,
  AlertTriangle,
  ChevronRight,
  Mic,
  MicOff,
  Activity,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (!seconds) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(dt: string | Date | null | undefined): string {
  if (!dt) return "—";
  return new Date(dt).toLocaleString();
}

function priorityColor(p: string) {
  switch (p) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  }
}

function confidenceLabel(c: number) {
  if (c >= 0.8) return { label: "High", color: "text-green-400" };
  if (c >= 0.5) return { label: "Medium", color: "text-yellow-400" };
  return { label: "Low", color: "text-red-400" };
}

// ─── Draft Ticket Review Modal ────────────────────────────────────────────────
function ReviewModal({
  draft,
  onClose,
  onApproved,
  onRejected,
}: {
  draft: any;
  onClose: () => void;
  onApproved: () => void;
  onRejected: () => void;
}) {
  const [title, setTitle] = useState(draft.draft.title || "");
  const [description, setDescription] = useState(draft.draft.description || "");
  const [priority, setPriority] = useState(draft.draft.priority || "medium");
  const [category, setCategory] = useState(draft.draft.category || "general_support");
  const [rejectReason, setRejectReason] = useState("");
  const [mode, setMode] = useState<"review" | "reject">("review");

  const utils = trpc.useUtils();

  const approveMutation = trpc.calls.approveDraft.useMutation({
    onSuccess: (data) => {
      toast.success(`Ticket #${data.ticketId} created successfully!`);
      utils.calls.getDraftTickets.invalidate();
      utils.calls.getStats.invalidate();
      onApproved();
    },
    onError: (err) => toast.error(`Failed to approve: ${err.message}`),
  });

  const deleteMutation = trpc.calls.deleteDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft ticket deleted.");
      utils.calls.getDraftTickets.invalidate();
      utils.calls.getStats.invalidate();
      onRejected();
    },
    onError: (err) => toast.error(`Failed to delete: ${err.message}`),
  });

  const rejectMutation = trpc.calls.rejectDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft ticket rejected.");
      utils.calls.getDraftTickets.invalidate();
      utils.calls.getStats.invalidate();
      onRejected();
    },
    onError: (err) => toast.error(`Failed to reject: ${err.message}`),
  });

  const callLog = draft.log;
  const d = draft.draft;
  const confidence = parseFloat(d.aiConfidence || "0.5");
  const conf = confidenceLabel(confidence);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0D1117] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#00D4FF]">
            <PhoneIncoming className="w-5 h-5" />
            Review Call Draft Ticket
          </DialogTitle>
        </DialogHeader>

        {/* Call Info */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-lg border border-white/10 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-gray-400">Caller:</span>
            <span className="font-mono text-white">{d.callerPhone || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-gray-400">Duration:</span>
            <span className="text-white">{formatDuration(callLog?.durationSeconds || 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-gray-400">Caller Name:</span>
            <span className="text-white">{d.callerName || "Not identified"}</span>
          </div>
          <div className="flex items-center gap-2">
            {callLog?.hasTranscript ? (
              <Mic className="w-4 h-4 text-green-400" />
            ) : (
              <MicOff className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-gray-400">Transcript:</span>
            <span className={callLog?.hasTranscript ? "text-green-400" : "text-gray-500"}>
              {callLog?.hasTranscript ? "Available" : "Not available"}
            </span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Zap className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-gray-400">AI Confidence:</span>
            <span className={conf.color}>{conf.label} ({Math.round(confidence * 100)}%)</span>
          </div>
        </div>

        {/* Transcript (if available) */}
        {callLog?.transcriptText && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Mic className="w-3 h-3" /> Call Transcript
            </p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
              {callLog.transcriptText}
            </p>
          </div>
        )}

        {mode === "review" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ticket Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description (AI-generated — edit as needed)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="bg-white/5 border-white/10 text-white resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D1117] border-white/10 text-white">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D1117] border-white/10 text-white">
                    <SelectItem value="m365">Microsoft 365</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="account_access">Account Access</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="general_support">General Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Reason for rejection (optional)</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Spam call, wrong number, already handled..."
              rows={3}
              className="bg-white/5 border-white/10 text-white resize-none"
            />
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-between">
          <Button
            variant="outline"
            onClick={() => setMode(mode === "review" ? "reject" : "review")}
            className="border-white/10 text-gray-400 hover:text-white"
          >
            {mode === "review" ? "Reject Instead" : "Back to Review"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => deleteMutation.mutate({ draftId: d.id })}
              disabled={deleteMutation.isPending}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              {deleteMutation.isPending ? "Deleting..." : "🗑 Delete"}
            </Button>
            <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400">
              Cancel
            </Button>
            {mode === "review" ? (
              <Button
                onClick={() => approveMutation.mutate({ draftId: d.id, title, description, priority: priority as any, category })}
                disabled={approveMutation.isPending || !title.trim()}
                className="bg-[#00D4FF] text-black hover:bg-[#00B8D9]"
              >
                {approveMutation.isPending ? "Creating..." : "✓ Create Ticket"}
              </Button>
            ) : (
              <Button
                onClick={() => rejectMutation.mutate({ draftId: d.id, reason: rejectReason })}
                disabled={rejectMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {rejectMutation.isPending ? "Rejecting..." : "✗ Reject Draft"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCallReviewPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "logs">("pending");
  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);

  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.calls.getStats.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: pollerStatus } = trpc.calls.getPollerStatus.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: draftTickets, isLoading: draftsLoading } = trpc.calls.getDraftTickets.useQuery({
    status: activeTab === "all" ? "all" : activeTab === "pending" ? "pending" : "all",
    limit: 50,
    offset: 0,
  });

  const { data: callLogs, isLoading: logsLoading } = trpc.calls.getCallLogs.useQuery({
    direction: "inbound",
    days: 7,
    limit: 50,
    offset: 0,
  }, { enabled: activeTab === "logs" });

  const triggerPoll = trpc.calls.triggerPoll.useMutation({
    onSuccess: () => {
      toast.success("Poll cycle triggered — check back in a moment.");
      utils.calls.getDraftTickets.invalidate();
      utils.calls.getStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const tabs = [
    { id: "pending", label: "Pending Review", count: stats?.pending },
    { id: "all", label: "All Drafts", count: stats?.total },
    { id: "logs", label: "Call Logs", count: stats?.todayCalls },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Admin
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <div className="flex items-center gap-2">
              <PhoneIncoming className="w-5 h-5 text-[#00D4FF]" />
              <h1 className="text-lg font-semibold">Call Ticket Review</h1>
            </div>
          </div>
          <Button
            onClick={() => triggerPoll.mutate()}
            disabled={triggerPoll.isPending || pollerStatus?.isRunning}
            size="sm"
            className="bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 hover:bg-[#00D4FF]/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${triggerPoll.isPending ? "animate-spin" : ""}`} />
            {triggerPoll.isPending ? "Polling..." : "Poll Now"}
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Pending Review", value: stats?.pending ?? 0, icon: <AlertTriangle className="w-4 h-4" />, color: "text-yellow-400" },
            { label: "Approved", value: stats?.approved ?? 0, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-400" },
            { label: "Rejected", value: stats?.rejected ?? 0, icon: <XCircle className="w-4 h-4" />, color: "text-red-400" },
            { label: "Total Drafts", value: stats?.total ?? 0, icon: <FileText className="w-4 h-4" />, color: "text-[#00D4FF]" },
            { label: "Today's Calls", value: stats?.todayCalls ?? 0, icon: <Phone className="w-4 h-4" />, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className={`flex items-center gap-2 ${s.color} mb-1`}>
                {s.icon}
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Poller Status */}
        <div className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${pollerStatus?.isRunning ? "text-green-400 animate-pulse" : "text-gray-500"}`} />
            <span className="text-gray-400">Poller:</span>
            <span className={pollerStatus?.isRunning ? "text-green-400" : "text-gray-300"}>
              {pollerStatus?.isRunning ? "Running" : "Idle"}
            </span>
          </div>
          {pollerStatus?.lastPollTime && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Last poll:</span>
              <span className="text-gray-300">{formatTime(pollerStatus.lastPollTime)}</span>
            </div>
          )}
          {pollerStatus?.lastError && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-3 h-3" />
              <span className="truncate max-w-xs">{pollerStatus.lastError}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-[#00D4FF] text-[#00D4FF]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 bg-[#00D4FF]/20 text-[#00D4FF] text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Draft Tickets List */}
        {(activeTab === "pending" || activeTab === "all") && (
          <div className="space-y-3">
            {draftsLoading ? (
              <div className="text-center py-12 text-gray-500">Loading draft tickets...</div>
            ) : !draftTickets?.length ? (
              <div className="text-center py-16 bg-white/5 rounded-lg border border-white/10">
                <PhoneOff className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">
                  {activeTab === "pending" ? "No pending draft tickets" : "No draft tickets yet"}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Draft tickets are created automatically when inbound calls are detected.
                </p>
              </div>
            ) : (
              draftTickets.map((item) => {
                const d = item.draft;
                const log = item.log;
                const confidence = 0.5; // aiConfidence not available in call log schema
                const conf = confidenceLabel(confidence);
                return (
                  <div
                    key={d.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-[#00D4FF]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColor(d.priority || 'medium')}`}>
                            {d.priority}
                          </span>
                          <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                            {d.category?.replace(/_/g, " ")}
                          </span>
                          {d.reviewStatus !== "pending" && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              d.reviewStatus === "approved" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            }`}>
                              {d.reviewStatus}
                            </span>
                          )}
                          {log?.hasTranscript && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <Mic className="w-3 h-3" /> Transcript
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-white truncate">{d.title}</h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{d.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {d.callerPhone || "Unknown"}
                          </span>
                          {d.callerName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {d.callerName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(log?.durationSeconds || 0)}
                          </span>
                          <span className={`flex items-center gap-1 ${conf.color}`}>
                            <Zap className="w-3 h-3" />
                            AI: {conf.label}
                          </span>
                          <span>{formatTime(d.createdAt)}</span>
                        </div>
                      </div>
                      {d.reviewStatus === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedDraft(item)}
                          className="bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 hover:bg-[#00D4FF]/20 shrink-0"
                        >
                          Review
                        </Button>
                      )}
                      {d.reviewStatus === "approved" && d.ticketId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/helpdesk/ticket/${d.ticketId}`)}
                          className="border-white/10 text-gray-400 hover:text-white shrink-0"
                        >
                          View Ticket #{d.ticketId}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Call Logs Tab */}
        {activeTab === "logs" && (
          <div className="space-y-3">
            {logsLoading ? (
              <div className="text-center py-12 text-gray-500">Loading call logs...</div>
            ) : !callLogs?.length ? (
              <div className="text-center py-16 bg-white/5 rounded-lg border border-white/10">
                <Phone className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No inbound call logs found in the last 7 days.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs">
                      <th className="text-left py-2 px-3">Caller</th>
                      <th className="text-left py-2 px-3">Duration</th>
                      <th className="text-left py-2 px-3">Time</th>
                      <th className="text-left py-2 px-3">Transcript</th>
                      <th className="text-left py-2 px-3">AI Summary</th>
                      <th className="text-left py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 font-mono text-[#00D4FF]">{log.callerNumber}</td>
                        <td className="py-2 px-3 text-gray-300">{formatDuration(log.durationSeconds || 0)}</td>
                        <td className="py-2 px-3 text-gray-400">{formatTime(log.startedAt)}</td>
                        <td className="py-2 px-3">
                          {log.hasTranscript ? (
                            <span className="text-green-400 flex items-center gap-1"><Mic className="w-3 h-3" /> Yes</span>
                          ) : (
                            <span className="text-gray-600 flex items-center gap-1"><MicOff className="w-3 h-3" /> No</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-300 max-w-xs truncate">{log.aiTitle || "—"}</td>
                        <td className="py-2 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            log.status === "draft_created" ? "bg-blue-500/20 text-blue-400" :
                            log.status === "analyzed" ? "bg-purple-500/20 text-purple-400" :
                            "bg-gray-500/20 text-gray-400"
                          }`}>
                            {log.status || "pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedDraft && (
        <ReviewModal
          draft={selectedDraft}
          onClose={() => setSelectedDraft(null)}
          onApproved={() => setSelectedDraft(null)}
          onRejected={() => setSelectedDraft(null)}
        />
      )}
    </div>
  );
}
