import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import HelpdeskNav from "@/components/HelpdeskNav";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  Shield,
  Tag,
  User,
  Zap,
} from "lucide-react";

export default function TicketDetail() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const { ticketId } = useParams<{ ticketId: string }>();
  const [replyText, setReplyText] = useState("");

  const { data: ticketData, isLoading, error } = trpc.helpdesk.getTicket.useQuery(
    { ticketId: parseInt(ticketId || "0") },
    { enabled: isAuthenticated && !!ticketId && ticketId !== "0" }
  );

  useEffect(() => {
    if (error) {
      toast.error("Failed to load ticket details");
    }
  }, [error]);

  const utils = trpc.useUtils();

  const addReplyMutation = trpc.helpdesk.addReply.useMutation({
    onSuccess: () => {
      toast.success("Reply sent!");
      setReplyText("");
      utils.helpdesk.getTicket.invalidate({ ticketId: parseInt(ticketId || "0") });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send reply");
    },
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
    addReplyMutation.mutate({
      ticketId: parseInt(ticketId || "0"),
      message: replyText,
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
      open: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: <CircleDot className="w-3.5 h-3.5" />, label: "Open" },
      in_progress: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: <Loader2 className="w-3.5 h-3.5" />, label: "In Progress" },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]">
      <HelpdeskNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/helpdesk/dashboard")}
          className="flex items-center gap-1.5 text-gray-400 hover:text-[#00D4FF] text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Ticket Header Card */}
        <div className="bg-[#141B2D]/80 border border-gray-800/60 rounded-xl p-6 mb-6">
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
        </div>

        {/* Description */}
        <div className="bg-[#141B2D]/80 border border-gray-800/60 rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <MessageSquare className="w-4 h-4 text-[#00D4FF]" />
            Description
          </h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
        </div>

        {/* Conversation Thread */}
        <div className="mb-6">
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
              Reply
            </h2>
            <form onSubmit={handleAddReply} className="space-y-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleAddReply(e);
                  }
                }}
                className="w-full bg-[#0A0E1A] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-all resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">Press Ctrl+Enter to send</p>
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
            </form>
          </div>
        ) : (
          <div className="bg-[#141B2D]/40 border border-gray-800/30 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">This ticket is closed</p>
            <p className="text-gray-500 text-xs mt-1">Create a new ticket if you need further assistance.</p>
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
