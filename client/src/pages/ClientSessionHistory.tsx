/**
 * ClientSessionHistory — Client-facing session history page
 * Allows end users to view their past remote assistance sessions
 * Shows duration, technician name, date, and session status
 * (no recording playback access - admin only)
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Clock,
  User,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";

interface SessionRecord {
  id: number;
  roomId: string;
  recordedBy: string;
  durationSeconds: number;
  sizeMb: number;
  url: string;
  createdAt: Date;
  status?: "completed" | "interrupted" | "failed";
  resolution?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-900/30 text-green-300 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case "interrupted":
      return (
        <Badge className="bg-amber-900/30 text-amber-300 border-amber-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Interrupted
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-900/30 text-red-300 border-red-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
}

export default function ClientSessionHistory() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"createdAt" | "durationSeconds">(
    "createdAt"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Fetch user's session history (client-only view - no recordings)
  // For now, we'll use a placeholder - in production, add a getUserSessions procedure
  // that filters recordings by the current user's tickets
  const { data: sessions, isLoading } =
    trpc.sessionRecording.getAllRecordings.useQuery(
      { limit: 100, offset: 0 },
      { enabled: isAuthenticated }
    );

  // Filter to only show sessions for this user's tickets
  // This is a client-side filter until we add a dedicated getUserSessions procedure
  const userSessions = (sessions as SessionRecord[])?.filter(
    (s) => s.recordedBy === user?.name || s.recordedBy === user?.email
  ) ?? [];

  // Filtered + sorted sessions
  const filtered = useMemo(() => {
    let list: SessionRecord[] = userSessions ?? [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.roomId.toLowerCase().includes(q) ||
          s.recordedBy.toLowerCase().includes(q) ||
          s.resolution?.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      let av: number, bv: number;
      if (sortField === "createdAt") {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      } else {
        av = a.durationSeconds;
        bv = b.durationSeconds;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });

    return list;
  }, [userSessions, searchQuery, sortField, sortDir]);

  const totalSessions = filtered.length;
  const totalDuration = filtered.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const completedCount = filtered.filter((s) => s.status === "completed").length;

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3.5 h-3.5 text-gray-600" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
      : <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 font-semibold">Authentication required</p>
          <Button
            onClick={() => navigate("/")}
            className="mt-4 bg-cyan-600 hover:bg-cyan-700"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/helpdesk")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Video className="w-6 h-6 text-cyan-400" />
                Your Session History
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                View your past remote assistance sessions with our support team
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total Sessions",
              value: totalSessions,
              icon: <Video className="w-4 h-4" />,
              color: "text-cyan-400",
            },
            {
              label: "Completed",
              value: completedCount,
              icon: <CheckCircle2 className="w-4 h-4" />,
              color: "text-green-400",
            },
            {
              label: "Total Duration",
              value: formatDuration(totalDuration),
              icon: <Clock className="w-4 h-4" />,
              color: "text-blue-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900/60 border border-gray-700/40 rounded-lg p-4 flex items-center gap-3"
            >
              <div className={`${stat.color} bg-gray-800/60 p-2 rounded-lg`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by technician name or session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-900/60 border-gray-700/50 text-white placeholder-gray-500 focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400">Loading sessions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-700/40 rounded-lg p-8 text-center">
              <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No sessions found</p>
              <p className="text-xs text-gray-500 mt-1">
                Your remote assistance sessions will appear here
              </p>
            </div>
          ) : (
            filtered.map((session) => (
              <div
                key={session.id}
                className="bg-gray-900/40 border border-gray-700/40 rounded-lg overflow-hidden hover:border-cyan-500/30 transition-colors"
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === session.id ? null : session.id)
                  }
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium text-white truncate">
                          {session.recordedBy}
                        </span>
                      </div>
                      {session.status && getStatusBadge(session.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(session.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(session.durationSeconds || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 shrink-0">
                    {expandedId === session.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedId === session.id && (
                  <div className="border-t border-gray-700/40 bg-gray-800/20 p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Session ID</p>
                        <p className="text-gray-300 font-mono text-xs">
                          {session.roomId}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="text-gray-300">
                          {formatDuration(session.durationSeconds || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Technician</p>
                        <p className="text-gray-300">{session.recordedBy}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <p className="text-gray-300 capitalize">{session.status || "completed"}</p>
                      </div>
                      {session.resolution && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Resolution</p>
                          <p className="text-gray-300">{session.resolution}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-4 p-3 bg-gray-900/60 rounded border border-gray-700/30">
                      💡 This session was recorded for quality assurance and compliance purposes. Recordings are retained for 90 days and are only accessible to our support team.
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-cyan-900/10 border border-cyan-500/20 rounded-lg p-4">
          <p className="text-xs text-cyan-300/80">
            🔒 Your session data is encrypted and stored securely. For questions about a specific session, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
