import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Ticket, Settings, LogOut, Bell, Eye, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState<"tickets" | "kb" | "settings">("tickets");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Fetch customer's tickets
  const { data: tickets, isLoading: ticketsLoading } = trpc.customerPortal.getMyTickets.useQuery({
    limit: 20,
    offset: 0,
  });

  // Fetch portal statistics
  const { data: stats } = trpc.customerPortal.getPortalStats.useQuery();

  // Fetch notification preferences
  const { data: preferences } = trpc.customerPortal.getNotificationPreferences.useQuery();

  // Update notification preferences mutation
  const updatePreferencesMutation = trpc.customerPortal.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("customerSessionToken");
    window.location.href = "/";
  };

  const statusColors: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    in_progress: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    resolved: "bg-green-500/10 text-green-400 border-green-500/20",
    closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const priorityColors: Record<string, string> = {
    low: "text-blue-400",
    medium: "text-yellow-400",
    high: "text-orange-400",
    critical: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D]">
      {/* Header */}
      <div className="bg-[#141B2D]/60 border-b border-gray-800/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Support Portal</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your tickets and preferences</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-gray-700 text-gray-300">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#141B2D]/60 border-gray-800/30">
              <div className="p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Total Tickets</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalTickets}</p>
              </div>
            </Card>

            <Card className="bg-[#141B2D]/60 border-gray-800/30">
              <div className="p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Open</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{stats.openTickets}</p>
              </div>
            </Card>

            <Card className="bg-[#141B2D]/60 border-gray-800/30">
              <div className="p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">In Progress</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.inProgressTickets}</p>
              </div>
            </Card>

            <Card className="bg-[#141B2D]/60 border-gray-800/30">
              <div className="p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Resolved</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{stats.resolvedTickets}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800/30 mb-6">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`pb-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "tickets"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-400"
            }`}
          >
            <Ticket className="w-4 h-4 inline mr-2" />
            My Tickets
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "settings"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-400"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Notifications
          </button>
        </div>

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                <span className="text-gray-400 ml-3">Loading tickets...</span>
              </div>
            ) : tickets && tickets.length > 0 ? (
              <>
                {!selectedTicket ? (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="bg-[#141B2D]/40 border-gray-800/30 cursor-pointer hover:bg-[#141B2D]/60 transition-[opacity,transform]"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-white font-medium">{ticket.title}</h3>
                                <span
                                  className={`text-xs px-2 py-1 rounded border ${statusColors[ticket.status] || statusColors.open}`}
                                >
                                  {ticket.status}
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm line-clamp-2">{ticket.description}</p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                <span className={`font-semibold ${priorityColors[ticket.priority]}`}>
                                  {ticket.priority.toUpperCase()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(ticket.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Eye className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setSelectedTicket(null)} variant="outline" className="border-gray-700">
                      ← Back to Tickets
                    </Button>

                    <Card className="bg-[#141B2D]/60 border-gray-800/30 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-bold text-white">{selectedTicket.title}</h2>
                          <p className="text-gray-400 text-sm mt-1">Ticket #{selectedTicket.id}</p>
                        </div>
                        <span
                          className={`text-xs px-3 py-1 rounded border ${statusColors[selectedTicket.status] || statusColors.open}`}
                        >
                          {selectedTicket.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Priority</p>
                          <p className={`text-lg font-bold mt-1 ${priorityColors[selectedTicket.priority]}`}>
                            {selectedTicket.priority.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Category</p>
                          <p className="text-lg font-bold text-white mt-1">{selectedTicket.category}</p>
                        </div>
                      </div>

                      <div className="bg-gray-800/20 border border-gray-800/30 rounded-lg p-4 mb-6">
                        <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold mb-2">Description</p>
                        <p className="text-gray-300">{selectedTicket.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Created</p>
                          <p className="text-white">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Last Updated</p>
                          <p className="text-white">{new Date(selectedTicket.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <Card className="bg-[#141B2D]/40 border-gray-800/30 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400/30 mx-auto mb-3" />
                <p className="text-gray-400">No tickets yet. Great job!</p>
              </Card>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && preferences && (
          <Card className="bg-[#141B2D]/60 border-gray-800/30 p-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              Notification Preferences
            </h3>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-800/20 border border-gray-800/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive ticket updates via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => {
                    updatePreferencesMutation.mutate({
                      emailNotifications: e.target.checked,
                    });
                  }}
                  className="w-5 h-5 rounded"
                />
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-800/20 border border-gray-800/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-gray-400 text-sm">Receive urgent updates via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.smsNotifications}
                  onChange={(e) => {
                    updatePreferencesMutation.mutate({
                      smsNotifications: e.target.checked,
                    });
                  }}
                  className="w-5 h-5 rounded"
                />
              </div>

              {/* In-App Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-800/20 border border-gray-800/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">In-App Notifications</p>
                  <p className="text-gray-400 text-sm">See updates in your portal</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.inAppNotifications}
                  onChange={(e) => {
                    updatePreferencesMutation.mutate({
                      inAppNotifications: e.target.checked,
                    });
                  }}
                  className="w-5 h-5 rounded"
                />
              </div>

              {/* Email Frequency */}
              <div className="p-4 bg-gray-800/20 border border-gray-800/30 rounded-lg">
                <p className="text-white font-medium mb-3">Email Frequency</p>
                <select
                  value={preferences.emailFrequency}
                  onChange={(e) => {
                    updatePreferencesMutation.mutate({
                      emailFrequency: e.target.value as any,
                    });
                  }}
                  className="w-full bg-[#0A0E1A] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                </select>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
