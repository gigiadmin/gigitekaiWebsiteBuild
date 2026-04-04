import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";

export default function HelpdeskDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: tickets, isLoading } = trpc.helpdesk.getMyTickets.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/helpdesk");
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
              <span className="text-[#0A0E1A] font-bold text-sm">?</span>
            </div>
            <span className="text-white font-bold">Help Desk</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user?.name}</span>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Tickets</h1>
            <p className="text-gray-400">View and manage your support tickets</p>
          </div>
          <Button
            onClick={() => navigate("/helpdesk/tickets/new")}
            className="bg-[#00D4FF] hover:bg-[#00B8CC] text-[#0A0E1A] font-semibold"
          >
            + Create New Ticket
          </Button>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tickets...</p>
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/helpdesk/tickets/${ticket.id}`)}
                className="bg-[#141B2D] border border-gray-800 rounded-lg p-6 hover:border-[#00D4FF] transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold text-lg">#{ticket.id} - {ticket.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{ticket.description.substring(0, 100)}...</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                    {ticket.category.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">You haven't created any tickets yet.</p>
            <Button
              onClick={() => navigate("/helpdesk/tickets/new")}
              className="bg-[#00D4FF] hover:bg-[#00B8CC] text-[#0A0E1A] font-semibold"
            >
              Create Your First Ticket
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
