import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import HelpdeskNav from "@/components/HelpdeskNav";
import SlaTimer from "@/components/SlaTimer";
import CannedResponsePicker from "@/components/CannedResponsePicker";
import Breadcrumb from "@/components/Breadcrumb";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Clock,
  History,
  Loader2,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Send,
  Shield,
  StickyNote,
  Sparkles,
  Tag,
  Trash2,
  User,
  XCircle,
  Zap,
} from "lucide-react";

export default function TicketDetail() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const { ticketId } = useParams<{ ticketId: string }>();
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [activeAdminTab, setActiveAdminTab] = useState<"notes" | "activity">("notes");

  const ticketIdNum = parseInt(ticketId || "0");
  const isAdmin = user?.role === "admin";

  const { data: ticketData, isLoading, error, refetch } = trpc.helpdesk.getTicket.useQuery(
    { ticketId: ticketIdNum },
    { enabled: isAuthenticated && !!ticketId && ticketId !== "0" }
  );

  const { data: notes, refetch: refetchNotes } = trpc.helpdesk.getNotes.useQuery(
    { ticketId: ticketIdNum },
    { enabled: isAdmin && isAuthenticated && !!ticketId && ticketId !== "0" }
  );

  const { data: activity, refetch: refetchActivity } = trpc.helpdesk.getActivity.useQuery(
    { ticketId: ticketIdNum },
    { enabled: isAdmin && isAuthenticated && !!ticketId && ticketId !== "0" }
  );

  useEffect(() => {
    if (error) {
      toast.error("Failed to load ticket details");
    }
  }, [error]);

  const utils = trpc.useUtils();

  const suggestReplyMutation = trpc.aiTriage.suggestReply.useMutation({
    onSuccess: (data) => {
      if (data.draft) {
        setReplyText(data.draft);
        toast.success("AI draft inserted — review and edit before sending");
      }
    },
    onError: () => toast.error("AI draft generation failed"),
  });

  const addReplyMutation = trpc.helpdesk.addReply.useMutation({
    onSuccess: () => {
      toast.success("Reply sent!");
      setReplyText("");
      utils.helpdesk.getTicket.invalidate({ ticketId: ticketIdNum });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send reply");
    },
  });

  const updateStatusMutation = trpc.helpdesk.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      const labels: Record<string, string> = {
        open: "Reopened",
        in_progress: "Resumed",
        on_hold: "Put On Hold",
        resolved: "Marked Resolved",
        closed: "Closed",
      };
      toast.success(`Ticket ${labels[vars.status] || "updated"}!`);
      refetch();
      refetchActivity();
    },
    onError: (error: any) => toast.error(error.message || "Failed to update status"),
  });

  const addNoteMutation = trpc.helpdesk.addNote.useMutation({
    onSuccess: () => {
      toast.success("Internal note added!");
      setNoteText("");
      refetchNotes();
      refetchActivity();
    },
    onError: (error: any) => toast.error(error.message || "Failed to add note"),
  });

  const deleteNoteMutation = trpc.helpdesk.deleteNote.useMutation({
    onSuccess: () => {
      toast.success("Note deleted");
      refetchNotes();
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete note"),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    addReplyMutation.mutate({ ticketId: ticketIdNum, message: replyText });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    addNoteMutation.mutate({ ticketId: ticketIdNum, content: noteText });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
      open: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: <CircleDot className="w-3.5 h-3.5" />, label: "Open" },
      in_progress: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: <Loader2 className="w-3.5 h-3.5" />, label: "In Progress" },
      on_hold: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", icon: <PauseCircle className="w-3.5 h-3.5" />, label: "On Hold" },
      resolved: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Resolved" },
      closed: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Closed" },
    };
    return configs[status] || configs.closed;
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { dot: string; text: string; label: string }> = {
      low: { dot: "bg-green-500", text: "text-green-400", label: "Low" },
      medium: { dot: "bg-yellow-500", text: "text-yellow-400", label: "Medium" },
      high: { dot: "bg-orange-500", text: "text-orange-400", label: "High" },
      critical: { dot: "bg-red-500", text: "text-red-400", label: "Critical" },
    };
    return configs[priority] || configs.medium;
  };

  const getActivityLabel = (entry: any) => {
    if (entry.action === "status_changed") {
      const fromLabel = entry.fromValue?.replace(/_/g, " ") || "unknown";
      const toLabel = entry.toValue?.replace(/_/g, " ") || "unknown";
      return `Changed status from "${fromLabel}" to "${toLabel}"`;
    }
    if (entry.action === "note_added") {
      return `Added internal note: "${entry.toValue}"`;
    }
    return entry.action.replace(/_/g, " ");
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  if (!ticketData || !ticketData.ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]">
        <HelpdeskNav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Ticket not found</h2>
          <p className="text-gray-400 text-sm mb-6">This ticket may have been removed or you don't have access.</p>
          <Button
            onClick={() => navigate("/helpdesk/dashboard")}
            className="bg-[#00D4FF] hover:bg-[#00B8CC] text-[#0A0E1A] font-bold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { ticket, replies } = ticketData;
  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);

  const breadcrumbs = [
    { label: "Helpdesk", href: "/helpdesk/dashboard" },
    { label: "Tickets", href: "/helpdesk/dashboard" },
    { label: `#${ticketIdNum}` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]">
      <HelpdeskNav isAdmin={isAdmin} />

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4 ${isAdmin ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : ""}`}>
        {/* Main Column */}
        <div className={isAdmin ? "lg:col-span-2 space-y-6" : "max-w-4xl mx-auto space-y-6"}>
          <Breadcrumb items={breadcrumbs} />
          {/* Back button */}
          <button
            onClick={() => navigate(isAdmin ? "/admin/helpdesk" : "/helpdesk/dashboard")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-[#00D4FF] text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isAdmin ? "Back to Admin" : "Back to Dashboard"}
          </button>

          {/* Ticket Header Card */}
          <div className="bg-[#141B2D]/80 border border-gray-800/60 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500 text-xs font-mono">TICKET #{ticket.id}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {ticket.title}
                </h1>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-gray-800/60">
              <MetaItem
                icon={<Zap className="w-4 h-4" />}
                label="Priority"
                value={
                  <span className={`flex items-center gap-1.5 font-semibold ${priorityConfig.text}`}>
                    <span className={`w-2 h-2 rounded-full ${priorityConfig.dot}`}></span>
                    {priorityConfig.label}
                  </span>
                }
              />
              <MetaItem
                icon={<Tag className="w-4 h-4" />}
                label="Category"
                value={<span className="text-white font-medium capitalize">{ticket.category.replace(/_/g, " ")}</span>}
              />
              <MetaItem
                icon={<Clock className="w-4 h-4" />}
                label="Created"
                value={<span className="text-white font-medium">{new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
              />
              <MetaItem
                icon={<Clock className="w-4 h-4" />}
                label="Last Updated"
                value={<span className="text-white font-medium">{new Date(ticket.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
              />
            </div>

            {/* SLA Timer */}
            <div className="mt-4">
              <SlaTimer
                priority={ticket.priority}
                updatedAt={ticket.updatedAt}
                status={ticket.status}
              />
            </div>

            {/* Admin Quick Actions */}
            {isAdmin && (
              <div className="mt-5 pt-5 border-t border-gray-800/60">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {(ticket.status === "closed" || ticket.status === "resolved") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ ticketId: ticketIdNum, status: "open" })}
                      disabled={updateStatusMutation.isPending}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Reopen
                    </Button>
                  )}
                  {(ticket.status === "open" || ticket.status === "in_progress") && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ ticketId: ticketIdNum, status: "in_progress" })}
                        disabled={updateStatusMutation.isPending || ticket.status === "in_progress"}
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs disabled:opacity-40"
                      >
                        <Loader2 className="w-3.5 h-3.5 mr-1.5" />
                        In Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ ticketId: ticketIdNum, status: "on_hold" })}
                        disabled={updateStatusMutation.isPending}
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs"
                      >
                        <PauseCircle className="w-3.5 h-3.5 mr-1.5" />
                        Put On Hold
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ ticketId: ticketIdNum, status: "resolved" })}
                        disabled={updateStatusMutation.isPending}
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Mark Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ ticketId: ticketIdNum, status: "closed" })}
                        disabled={updateStatusMutation.isPending}
                        className="border-gray-600/50 text-gray-400 hover:bg-gray-500/10 text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Close
                      </Button>
                    </>
                  )}
                  {ticket.status === "on_hold" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ ticketId: ticketIdNum, status: "in_progress" })}
                        disabled={updateStatusMutation.isPending}
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs"
                      >
                        <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                        Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ ticketId: ticketIdNum, status: "closed" })}
                        disabled={updateStatusMutation.isPending}
                        className="border-gray-600/50 text-gray-400 hover:bg-gray-500/10 text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-[#141B2D]/80 border border-gray-800/60 rounded-xl p-6">
            <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <MessageSquare className="w-4 h-4 text-[#00D4FF]" />
              Description
            </h2>
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Conversation Thread */}
          <div>
            <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <MessageSquare className="w-4 h-4 text-[#00D4FF]" />
              Conversation
              {replies && replies.length > 0 && (
                <span className="text-xs text-gray-500 font-normal ml-1">({replies.length} {replies.length === 1 ? "reply" : "replies"})</span>
              )}
            </h2>

            {replies && replies.length > 0 ? (
              <div className="space-y-4">
                {replies.map((reply: any) => {
                  const isStaff = reply.isStaffReply;
                  return (
                    <div
                      key={reply.id}
                      className={`rounded-xl p-5 border ${
                        isStaff
                          ? "bg-[#0D1B2A] border-[#00D4FF]/15"
                          : "bg-[#141B2D]/60 border-gray-800/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isStaff
                            ? "bg-gradient-to-br from-[#00D4FF] to-[#0088AA]"
                            : "bg-gray-700"
                        }`}>
                          {isStaff ? (
                            <Shield className="w-4 h-4 text-[#0A0E1A]" />
                          ) : (
                            <User className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-sm ${isStaff ? "text-[#00D4FF]" : "text-white"}`}>
                                {isStaff ? "GigitekAI Support" : "You"}
                              </span>
                              {isStaff && (
                                <span className="px-1.5 py-0.5 bg-[#00D4FF]/10 text-[#00D4FF] text-[10px] font-bold rounded uppercase tracking-wider">
                                  Staff
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(reply.createdAt).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{reply.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#141B2D]/40 border border-gray-800/30 rounded-xl p-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No replies yet</p>
                <p className="text-gray-500 text-xs mt-1">Our support team will respond shortly.</p>
              </div>
            )}
          </div>

          {/* Reply Form */}
          {ticket.status !== "closed" ? (
            <div className="bg-[#141B2D]/80 border border-gray-800/60 rounded-xl p-6">
              <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <Send className="w-4 h-4 text-[#00D4FF]" />
                {isAdmin ? "Reply to Customer" : "Reply"}
              </h2>
              <form onSubmit={handleAddReply} className="space-y-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isAdmin ? "Type your reply to the customer..." : "Type your reply..."}
                  rows={4}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleAddReply(e);
                    }
                  }}
                  className="w-full bg-[#0A0E1A] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-all resize-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-600">Press Ctrl+Enter to send</p>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <CannedResponsePicker onSelect={(body) => setReplyText(body)} />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={suggestReplyMutation.isPending}
                          onClick={() => suggestReplyMutation.mutate({ ticketId: ticketIdNum })}
                          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 rounded-xl text-sm"
                        >
                          {suggestReplyMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-1.5" />
                          )}
                          AI Draft
                        </Button>
                      </>
                    )}
                    <Button
                      type="submit"
                      disabled={addReplyMutation.isPending || !replyText.trim()}
                      className="bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold rounded-xl shadow-lg shadow-[#00D4FF]/15"
                    >
                      {addReplyMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {addReplyMutation.isPending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-[#141B2D]/40 border border-gray-800/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">This ticket is closed</p>
                  {(ticket as any).closedAt && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      Closed on {new Date((ticket as any).closedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              {(ticket as any).closingNotes && (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    Resolution Notes
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{(ticket as any).closingNotes}</p>
                </div>
              )}
              {isAdmin ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate({ ticketId: ticketIdNum, status: "open" })}
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reopen Ticket
                </Button>
              ) : (
                <p className="text-gray-500 text-xs">Create a new ticket if you need further assistance.</p>
              )}
            </div>
          )}
        </div>

        {/* Admin Sidebar: Notes & Activity */}
        {isAdmin && (
          <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex gap-1 bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-1">
              <button
                onClick={() => setActiveAdminTab("notes")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeAdminTab === "notes"
                    ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                Internal Notes
                {notes && notes.length > 0 && (
                  <span className="bg-[#00D4FF]/20 text-[#00D4FF] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {notes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveAdminTab("activity")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeAdminTab === "activity"
                    ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Activity Log
                {activity && activity.length > 0 && (
                  <span className="bg-gray-700 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {activity.length}
                  </span>
                )}
              </button>
            </div>

            {/* Internal Notes Panel */}
            {activeAdminTab === "notes" && (
              <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800/40">
                  <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" />
                    Staff Only — Not visible to customer
                  </p>
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="p-4 border-b border-gray-800/40">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={3}
                    className="w-full bg-[#0A0E1A] border border-gray-800 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none resize-none mb-2"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addNoteMutation.isPending || !noteText.trim()}
                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs"
                  >
                    {addNoteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <StickyNote className="w-3.5 h-3.5 mr-1.5" />}
                    Add Note
                  </Button>
                </form>

                {/* Notes List */}
                <div className="divide-y divide-gray-800/40 max-h-96 overflow-y-auto">
                  {notes && notes.length > 0 ? (
                    notes.map((note: any) => (
                      <div key={note.id} className="p-4 group">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <span className="text-xs font-semibold text-amber-400">{note.authorName}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(note.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteNoteMutation.mutate({ noteId: note.id })}
                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <StickyNote className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-xs">No internal notes yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Log Panel */}
            {activeAdminTab === "activity" && (
              <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800/40">
                  <p className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Ticket Audit Trail
                  </p>
                </div>
                <div className="divide-y divide-gray-800/40 max-h-[500px] overflow-y-auto">
                  {activity && activity.length > 0 ? (
                    activity.map((entry: any) => (
                      <div key={entry.id} className="p-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#00D4FF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <History className="w-3 h-3 text-[#00D4FF]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium">{entry.actorName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{getActivityLabel(entry)}</p>
                            <p className="text-[10px] text-gray-600 mt-1">
                              {new Date(entry.createdAt).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <History className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-xs">No activity recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
        {icon}
        {label}
      </div>
      {value}
    </div>
  );
}
