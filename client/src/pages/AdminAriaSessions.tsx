import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Eye, MessageSquare, UserCheck, XCircle, Send, Clock,
  Users, Activity, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminAriaSessions() {

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data: sessionsData, refetch: refetchSessions } = trpc.ariaSessions.listAllSessions.useQuery({
    limit: 30,
    offset: 0,
    status: statusFilter,
  });

  const { data: messages, refetch: refetchMessages } = trpc.ariaSessions.getSessionMessages.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: !!selectedSessionId, refetchInterval: 5000 }
  );

  const takeOver = trpc.ariaSessions.takeOverSession.useMutation({
    onSuccess: () => {
      toast.success("Session taken over — you are now responding to this user.");
      refetchSessions();
      refetchMessages();
    },
  });

  const sendMessage = trpc.ariaSessions.sendAdminMessage.useMutation({
    onSuccess: () => {
      setAdminMessage("");
      refetchMessages();
    },
  });

  const closeSession = trpc.ariaSessions.closeSession.useMutation({
    onSuccess: () => {
      toast.success("Session closed");
      setSelectedSessionId(null);
      refetchSessions();
    },
  });

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    taken_over: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  // Detail view
  if (selectedSessionId) {
    const session = sessionsData?.sessions.find((s: any) => s.id === selectedSessionId);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSessionId(null)} className="text-slate-400">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-semibold text-white">
            Session #{selectedSessionId} — {session?.userName || "Unknown"}
          </h2>
          <Badge variant="outline" className={statusColors[session?.status || "active"]}>
            {session?.status}
          </Badge>
          {session?.status === "active" && (
            <Button
              size="sm"
              onClick={() => takeOver.mutate({ sessionId: selectedSessionId })}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" /> Take Over
            </Button>
          )}
          {session?.status !== "closed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => closeSession.mutate({ sessionId: selectedSessionId })}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Close
            </Button>
          )}
        </div>

        {/* Messages */}
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-4">
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {messages?.length === 0 && (
                <p className="text-slate-500 text-center py-8">No messages in this session yet.</p>
              )}
              {messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-cyan-600/20 text-cyan-100 border border-cyan-500/30"
                        : msg.role === "admin"
                        ? "bg-blue-600/20 text-blue-100 border border-blue-500/30"
                        : "bg-slate-800 text-slate-200 border border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        {msg.role === "user" ? "User" : msg.role === "admin" ? `Admin (${msg.senderName || "Admin"})` : "Aria"}
                      </span>
                      {msg.intent && (
                        <span className="text-[9px] bg-slate-700/50 px-1.5 rounded text-slate-400">{msg.intent}</span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content?.substring(0, 500)}</p>
                    <span className="text-[10px] opacity-50 mt-1 block">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Admin reply input */}
            {session?.status === "taken_over" && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
                <Input
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="bg-slate-800 border-slate-700 text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && adminMessage.trim()) {
                      sendMessage.mutate({ sessionId: selectedSessionId, content: adminMessage.trim() });
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (adminMessage.trim()) {
                      sendMessage.mutate({ sessionId: selectedSessionId, content: adminMessage.trim() });
                    }
                  }}
                  disabled={!adminMessage.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" />
          Aria Live Sessions
        </h1>
        <p className="text-slate-400 mt-1">
          Monitor active Aria conversations and take over when needed.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">Active</p>
              <p className="text-xl font-bold text-emerald-400">
                {sessionsData?.sessions.filter((s: any) => s.status === "active").length || 0}
              </p>
            </div>
            <Activity className="w-5 h-5 text-emerald-400" />
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">Taken Over</p>
              <p className="text-xl font-bold text-blue-400">
                {sessionsData?.sessions.filter((s: any) => s.status === "taken_over").length || 0}
              </p>
            </div>
            <UserCheck className="w-5 h-5 text-blue-400" />
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase">Total Sessions</p>
              <p className="text-xl font-bold text-white">{sessionsData?.total || 0}</p>
            </div>
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["active", "taken_over", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? undefined : s)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${
              statusFilter === s ? statusColors[s] : "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600"
            }`}
          >
            {s === "taken_over" ? "Taken Over" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <Card className="bg-slate-900/60 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessionsData?.sessions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No sessions found. Aria conversations will appear here.</p>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {sessionsData?.sessions.map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${session.status === "active" ? "bg-emerald-400 animate-pulse" : session.status === "taken_over" ? "bg-blue-400" : "bg-slate-500"}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{session.userName || "Unknown User"}</p>
                      <p className="text-xs text-slate-400">{session.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {session.messageCount || 0} msgs
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.lastMessageAt ? new Date(session.lastMessageAt).toLocaleString() : "No messages"}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[session.status]}`}>
                      {session.status === "taken_over" ? "Taken Over" : session.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
