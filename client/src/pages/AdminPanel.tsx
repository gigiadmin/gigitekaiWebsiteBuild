import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminPanel() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  const { data: allTickets, isLoading, refetch } = trpc.helpdesk.getAllTickets.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateStatusMutation = trpc.helpdesk.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Ticket status updated!");
      setSelectedTicketId(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/helpdesk");
  };

  const handleUpdateStatus = (ticketId: number, status: string) => {
    updateStatusMutation.mutate({ ticketId, status: status as any });
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
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D]">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#0A0E1A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00D4FF] rounded-lg flex items-center justify-center">
              <span className="text-[#0A0E1A] font-bold text-sm">⚙️</span>
            </div>
            <span className="text-white font-bold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user?.name} (Admin)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">All Support Tickets</h1>
          <p className="text-gray-400">Manage and respond to customer support tickets</p>
        </div>

        {/* Tickets Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tickets...</p>
          </div>
        ) : allTickets && allTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Priority</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Created</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allTickets.map((ticket: any) => (
                  <tr key={ticket.id} className="border-b border-gray-800 hover:bg-[#141B2D]/50 transition">
                    <td className="px-4 py-3 text-white font-semibold">#{ticket.id}</td>
                    <td className="px-4 py-3 text-white max-w-xs truncate">{ticket.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold text-sm ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {ticket.category.replace("_", " ").toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/helpdesk/tickets/${ticket.id}`)}
                          className="border-gray-700 text-gray-400 hover:text-white text-xs"
                        >
                          View
                        </Button>
                        <select
                          value={selectedTicketId === ticket.id ? newStatus : ticket.status}
                          onChange={(e) => {
                            setSelectedTicketId(ticket.id);
                            setNewStatus(e.target.value);
                            handleUpdateStatus(ticket.id, e.target.value);
                          }}
                          className="bg-[#0A0E1A] border border-gray-700 rounded px-2 py-1 text-white text-xs focus:border-[#00D4FF] focus:outline-none"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400">No tickets found</p>
          </div>
        )}

        {/* Stats */}
        {allTickets && (
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Tickets</p>
              <p className="text-2xl font-bold text-white">{allTickets.length}</p>
            </div>
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Open</p>
              <p className="text-2xl font-bold text-blue-400">
                {allTickets.filter((t: any) => t.status === "open").length}
              </p>
            </div>
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-yellow-400">
                {allTickets.filter((t: any) => t.status === "in_progress").length}
              </p>
            </div>
            <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Resolved</p>
              <p className="text-2xl font-bold text-green-400">
                {allTickets.filter((t: any) => t.status === "resolved").length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
