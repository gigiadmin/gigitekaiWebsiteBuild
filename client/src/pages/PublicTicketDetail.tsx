import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "wouter";

export default function PublicTicketDetail() {
  const [, params] = useRoute("/support/ticket/:ticketId");
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Get email and token from sessionStorage
    const storedEmail = sessionStorage.getItem("support_email");
    const storedToken = sessionStorage.getItem("support_token");
    if (storedEmail && storedToken) {
      setEmail(storedEmail);
      setToken(storedToken);
    }
  }, []);

  const ticketId = params?.ticketId ? parseInt(params.ticketId) : 0;

  // Fetch ticket detail
  const { data: ticketData, isLoading: isLoadingTicket } = trpc.support.getTicketDetail.useQuery(
    { ticketId, email, token },
    { enabled: !!email && !!token && ticketId > 0 }
  );

  // Add reply mutation
  const addReplyMutation = trpc.support.addReply.useMutation({
    onSuccess: () => {
      setMessage("");
      // Refetch ticket data to show new reply
      // In a real app, you'd use invalidate or optimistic updates
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    addReplyMutation.mutate({
      ticketId,
      email,
      message,
    });
  };

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <div className="bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2 text-center">Session Expired</h2>
          <p className="text-gray-400 text-sm mb-6 text-center">
            Please go back and verify your email again.
          </p>
          <Button
            onClick={() => navigate("/support/lookup")}
            className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] hover:from-[#00D4FF]/90 hover:to-[#0099CC]/90 text-black font-bold"
          >
            Back to Lookup
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingTicket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <div className="bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2 text-center">Ticket Not Found</h2>
          <Button
            onClick={() => navigate("/support/lookup")}
            className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] hover:from-[#00D4FF]/90 hover:to-[#0099CC]/90 text-black font-bold"
          >
            Back to Lookup
          </Button>
        </div>
      </div>
    );
  }

  const { ticket, replies } = ticketData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D]">
      {/* Header */}
      <div className="border-b border-[rgba(0,212,255,0.1)] bg-[#0A0E1A]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate("/support/lookup")}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-white font-bold text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {ticket.title}
              </h1>
              <p className="text-gray-400 text-sm mt-2">Ticket #{ticket.id}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              ticket.status === "resolved" ? "bg-green-500/10 text-green-400" :
              ticket.status === "in_progress" ? "bg-blue-500/10 text-blue-400" :
              ticket.status === "on_hold" ? "bg-yellow-500/10 text-yellow-400" :
              "bg-gray-500/10 text-gray-400"
            }`}>
              {ticket.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Ticket Details */}
        <div className="bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ticket Details
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Priority</p>
              <p className="text-white font-medium capitalize">{ticket.priority}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Category</p>
              <p className="text-white font-medium capitalize">{ticket.category.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Created</p>
              <p className="text-white font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Last Updated</p>
              <p className="text-white font-medium">{new Date(ticket.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(0,212,255,0.1)]">
            <p className="text-gray-400 text-sm mb-2">Description</p>
            <p className="text-white">{ticket.description}</p>
          </div>
        </div>

        {/* Chat History */}
        <div className="bg-[#141B2D]/80 border border-[rgba(0,212,255,0.12)] rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Conversation History
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
            {replies.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No messages yet. Be the first to reply!</p>
            ) : (
              replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded-lg ${
                    reply.isStaffReply
                      ? "bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)]"
                      : "bg-[#0A0E1A]/50 border border-[rgba(0,212,255,0.1)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#00D4FF] text-xs font-medium">
                      {reply.isStaffReply ? "Support Team" : "You"}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{reply.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Reply Form */}
          <div className="border-t border-[rgba(0,212,255,0.1)] pt-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Add a Reply
            </label>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder-gray-500 mb-3"
              rows={3}
            />
            <Button
              onClick={handleSendMessage}
              disabled={addReplyMutation.isPending || !message.trim()}
              className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] hover:from-[#00D4FF]/90 hover:to-[#0099CC]/90 text-black font-bold"
            >
              {addReplyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
            {addReplyMutation.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 mt-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">
                  {addReplyMutation.error.message || "Failed to send reply"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
