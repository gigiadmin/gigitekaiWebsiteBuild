import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
      console.error("Error loading ticket:", error);
      toast.error("Failed to load ticket details");
    }
  }, [error]);

  const addReplyMutation = trpc.helpdesk.addReply.useMutation({
    onSuccess: () => {
      toast.success("Reply added successfully!");
      setReplyText("");
      // Refetch ticket data
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add reply");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (ticketData) {
      console.log("Ticket data loaded:", ticketData);
    }
  }, [ticketData]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "closed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-orange-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticketData || !ticketData.ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D]">
        <nav className="border-b border-gray-800 bg-[#0A0E1A]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/helpdesk/dashboard")}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-400">Ticket not found or failed to load</p>
        </div>
      </div>
    );
  }

  const { ticket, replies } = ticketData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D]">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#0A0E1A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00D4FF] rounded-lg flex items-center justify-center">
              <span className="text-[#0A0E1A] font-bold text-sm">?</span>
            </div>
            <span className="text-white font-bold">Help Desk</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/helpdesk/dashboard")}
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ticket Header */}
        <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">#{ticket.id} - {ticket.title}</h1>
              <p className="text-gray-400">Created {new Date(ticket.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <div>
              <p className="text-gray-500 text-sm">Priority</p>
              <p className={`font-semibold ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Category</p>
              <p className="text-white font-semibold">
                {ticket.category.replace("_", " ").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Last Updated</p>
              <p className="text-white font-semibold">
                {new Date(ticket.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Description</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Conversation */}
        <div className="space-y-4 mb-6">
          <h2 className="text-white font-semibold">Conversation</h2>
          {replies && replies.length > 0 ? (
            replies.map((reply: any) => (
              <div
                key={reply.id}
                className={`border rounded-lg p-4 ${
                  reply.isStaffReply
                    ? "bg-[#1a2332] border-[#00D4FF]/30"
                    : "bg-[#141B2D] border-gray-800"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white font-semibold">
                    {reply.isStaffReply ? "🔧 Support Team" : "You"}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {new Date(reply.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))
          ) : (
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400">No replies yet. Support team will respond soon.</p>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {ticket.status !== "closed" && (
          <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-6">
            <h2 className="text-white font-semibold mb-4">Add Reply</h2>
            <form onSubmit={handleAddReply} className="space-y-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                rows={4}
                className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-[#00D4FF] focus:outline-none transition resize-none"
              />
              <Button
                type="submit"
                disabled={addReplyMutation.isPending || !replyText.trim()}
                className="bg-[#00D4FF] hover:bg-[#00B8CC] text-[#0A0E1A] font-semibold"
              >
                {addReplyMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
