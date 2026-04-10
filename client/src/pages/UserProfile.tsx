import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { User, Mail, Phone, Calendar, Ticket, Star } from "lucide-react";

export default function UserProfile() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user's tickets
  const { data: ticketsData } = trpc.helpdesk.getMyTickets.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Fetch user's feedback
  const { data: feedbackData } = trpc.feedback.getUserFeedback.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Please log in to view your profile</p>
        <Button onClick={() => setLocation("/")}>Back to Home</Button>
      </div>
    );
  }

  const userTickets = ticketsData || [];
  const userFeedback = feedbackData?.feedbackList || [];

  // Calculate stats
  const openTickets = userTickets.filter((t: any) => t.status === "open").length;
  const resolvedTickets = userTickets.filter((t: any) => t.status === "resolved").length;
  const avgRating = userFeedback.length > 0
    ? (userFeedback.reduce((sum: number, f: any) => sum + parseInt(f.rating), 0) / userFeedback.length).toFixed(1)
    : "N/A";

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-slate-400">Manage your account and view ticket history</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg"
          >
            Logout
          </Button>
        </div>

        {/* User Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Card */}
          <Card className="bg-slate-800 border-slate-700 p-6 lg:col-span-1">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-4">{user?.name || "User"}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="break-all">{user?.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="inline-block px-3 py-1 bg-cyan-500 text-white rounded-full text-xs font-semibold">
                  {user?.role || "user"}
                </span>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {/* Total Tickets */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Tickets</p>
                  <p className="text-3xl font-bold text-white">{userTickets.length}</p>
                </div>
                <Ticket className="w-12 h-12 text-cyan-400 opacity-50" />
              </div>
            </Card>

            {/* Open Tickets */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Open Tickets</p>
                  <p className="text-3xl font-bold text-yellow-400">{openTickets}</p>
                </div>
                <Ticket className="w-12 h-12 text-yellow-400 opacity-50" />
              </div>
            </Card>

            {/* Resolved Tickets */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Resolved Tickets</p>
                  <p className="text-3xl font-bold text-green-400">{resolvedTickets}</p>
                </div>
                <Ticket className="w-12 h-12 text-green-400 opacity-50" />
              </div>
            </Card>

            {/* Average Rating */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Avg Rating</p>
                  <p className="text-3xl font-bold text-cyan-400">{avgRating}</p>
                </div>
                <Star className="w-12 h-12 text-cyan-400 opacity-50" />
              </div>
            </Card>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">Your Tickets</h3>
          {userTickets.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <p className="text-slate-400">No tickets yet. Create one to get started!</p>
              <Button
                onClick={() => setLocation("/helpdesk/tickets/new")}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-2 rounded-lg"
              >
                Create Ticket
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {userTickets.map((ticket: any) => (
                <Card
                  key={ticket.id}
                  className="bg-slate-800 border-slate-700 p-4 hover:border-cyan-500 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/helpdesk/tickets/${ticket.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">#{ticket.id} - {ticket.title}</h4>
                      <p className="text-slate-400 text-sm">{ticket.description?.substring(0, 80)}...</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ticket.status === "open"
                          ? "bg-yellow-500 text-white"
                          : ticket.status === "resolved"
                          ? "bg-green-500 text-white"
                          : "bg-slate-600 text-slate-200"
                      }`}>
                        {ticket.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ticket.priority === "critical"
                          ? "bg-red-500 text-white"
                          : ticket.priority === "high"
                          ? "bg-orange-500 text-white"
                          : ticket.priority === "medium"
                          ? "bg-yellow-500 text-white"
                          : "bg-blue-500 text-white"
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className="text-slate-400 text-sm whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Section */}
        {userFeedback.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Your Feedback</h3>
            <div className="space-y-3">
              {userFeedback.map((feedback: any) => (
                <Card key={feedback.id} className="bg-slate-800 border-slate-700 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-semibold">Ticket #{feedback.ticketId}</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < parseInt(feedback.rating)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-slate-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-slate-400 text-sm mb-2">{feedback.comment}</p>
                      )}
                      <p className="text-slate-500 text-xs">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {feedback.wouldRecommend !== null && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                        feedback.wouldRecommend
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}>
                        {feedback.wouldRecommend ? "Would Recommend" : "Won't Recommend"}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
