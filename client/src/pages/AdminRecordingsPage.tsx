/**
 * AdminRecordingsPage — Session Recordings Library
 * Fortune 500-grade admin page for browsing, searching, filtering,
 * and managing all WebRTC session recordings stored in S3.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";
import {
  Search,
  Video,
  Play,
  Trash2,
  Download,
  Calendar,
  Clock,
  HardDrive,
  User,
  Filter,
  RefreshCw,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Recording {
  id: number;
  roomId: string;
  recordedBy: string;
  url: string;
  durationSeconds: number;
  sizeMb: number;
  createdAt: Date;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatFileSize(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
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

export default function AdminRecordingsPage() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<"createdAt" | "durationSeconds" | "sizeMb">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterTechnicianId, setFilterTechnicianId] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<number[] | null>(null);

  // Fetch all recordings (admin only)
  const { data: recordings, isLoading, refetch } = trpc.sessionRecording.getAllRecordings.useQuery(
    { limit: 200, offset: 0 },
    { enabled: user?.role === "admin" }
  );

  const deleteRecording = trpc.sessionRecording.deleteRecording.useMutation({
    onSuccess: () => {
      toast.success("Recording deleted");
      setConfirmDeleteIds(null);
      setSelectedIds(new Set());
      refetch();
    },
    onError: (err) => toast.error(`Delete failed: ${err.message}`),
  });

  // Filtered + sorted recordings
  const filtered = useMemo(() => {
    let list: Recording[] = (recordings as Recording[]) ?? [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.roomId.toLowerCase().includes(q) ||
          r.recordedBy.toLowerCase().includes(q)
      );
    }

    if (filterTechnicianId.trim()) {
      list = list.filter((r) =>
        r.recordedBy.toLowerCase().includes(filterTechnicianId.toLowerCase())
      );
    }

    list = [...list].sort((a, b) => {
      let av: number, bv: number;
      if (sortField === "createdAt") {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      } else if (sortField === "durationSeconds") {
        av = a.durationSeconds;
        bv = b.durationSeconds;
      } else {
        av = a.sizeMb;
        bv = b.sizeMb;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });

    return list;
  }, [recordings, searchQuery, filterTechnicianId, sortField, sortDir]);

  const totalDuration = filtered.reduce((acc, r) => acc + r.durationSeconds, 0);
  const totalSize = filtered.reduce((acc, r) => acc + r.sizeMb, 0);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  };

  const handleBulkDelete = () => {
    setConfirmDeleteIds(Array.from(selectedIds));
  };

  const confirmDelete = async () => {
    if (!confirmDeleteIds) return;
    for (const id of confirmDeleteIds) {
      await deleteRecording.mutateAsync({ id });
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3.5 h-3.5 text-gray-600" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
      : <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />;
  };

  if (user?.role !== "admin") {
    return (
      <AdminLayout title="Session Recordings">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Shield className="w-12 h-12 text-red-400" />
          <p className="text-red-300 font-semibold">Admin access required</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Session Recordings">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-cyan-400" />
              Session Recordings Library
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              All WebRTC remote assistance session recordings — AES-256 encrypted, stored in S3
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-gray-600 text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Recordings",
              value: filtered.length,
              icon: <Video className="w-4 h-4" />,
              color: "text-cyan-400",
            },
            {
              label: "Total Duration",
              value: formatDuration(totalDuration),
              icon: <Clock className="w-4 h-4" />,
              color: "text-blue-400",
            },
            {
              label: "Storage Used",
              value: formatFileSize(totalSize),
              icon: <HardDrive className="w-4 h-4" />,
              color: "text-purple-400",
            },
            {
              label: "Selected",
              value: selectedIds.size,
              icon: <Filter className="w-4 h-4" />,
              color: "text-amber-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`${stat.color} bg-gray-800/60 p-2 rounded-lg`}>{stat.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by room ID or technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-900/60 border-gray-700/50 text-white placeholder-gray-500 focus:border-cyan-500/50"
            />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Filter by technician ID..."
              value={filterTechnicianId}
              onChange={(e) => setFilterTechnicianId(e.target.value)}
              className="pl-9 w-full sm:w-56 bg-gray-900/60 border-gray-700/50 text-white placeholder-gray-500 focus:border-cyan-500/50"
            />
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete {selectedIds.size} selected
            </Button>
          )}
        </div>

        {/* Compliance Notice */}
        <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-lg p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-cyan-300/80">
            All recordings are encrypted with AES-256 and stored in compliance with GDPR Article 13, HIPAA §164.528, and SOC 2 Type II audit trail requirements.
            Recordings are retained for 90 days by default. Clients are notified via consent banner when recording begins.
          </p>
        </div>

        {/* Recordings Table */}
        <div className="bg-gray-900/40 border border-gray-700/40 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 px-4 py-3 bg-gray-800/40 border-b border-gray-700/40 text-xs text-gray-500 font-medium">
            <div>
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={selectAll}
                className="rounded border-gray-600 bg-gray-800 accent-cyan-500"
              />
            </div>
            <div>Room / Session</div>
            <button
              className="flex items-center gap-1 hover:text-gray-300"
              onClick={() => toggleSort("createdAt")}
            >
              <Calendar className="w-3.5 h-3.5" />
              Date
              <SortIcon field="createdAt" />
            </button>
            <button
              className="flex items-center gap-1 hover:text-gray-300"
              onClick={() => toggleSort("durationSeconds")}
            >
              <Clock className="w-3.5 h-3.5" />
              Duration
              <SortIcon field="durationSeconds" />
            </button>
            <button
              className="flex items-center gap-1 hover:text-gray-300"
              onClick={() => toggleSort("sizeMb")}
            >
              <HardDrive className="w-3.5 h-3.5" />
              Size
              <SortIcon field="sizeMb" />
            </button>
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Technician
            </div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading recordings...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <Video className="w-10 h-10 text-gray-700" />
              <p className="text-sm">No recordings found</p>
              {searchQuery && (
                <button
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {filtered.map((rec) => (
                <div
                  key={rec.id}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 px-4 py-3 items-center hover:bg-gray-800/30 transition-colors ${
                    selectedIds.has(rec.id) ? "bg-cyan-900/10" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(rec.id)}
                      onChange={() => toggleSelect(rec.id)}
                      className="rounded border-gray-600 bg-gray-800 accent-cyan-500"
                    />
                  </div>

                  {/* Room ID */}
                  <div className="min-w-0">
                    <p className="text-sm text-white font-mono truncate">{rec.roomId}</p>
                    <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400 mt-0.5">
                      ID #{rec.id}
                    </Badge>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(rec.createdAt)}
                  </div>

                  {/* Duration */}
                  <div className="text-xs text-gray-300 whitespace-nowrap">
                    {formatDuration(rec.durationSeconds)}
                  </div>

                  {/* Size */}
                  <div className="text-xs text-gray-300 whitespace-nowrap">
                    {formatFileSize(rec.sizeMb)}
                  </div>

                  {/* Technician */}
                  <div className="text-xs text-gray-400 font-mono truncate max-w-[120px]">
                    {rec.recordedBy}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewUrl(rec.url)}
                      title="Preview"
                      className="p-1.5 rounded text-cyan-400 hover:bg-cyan-900/30 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in new tab"
                      className="p-1.5 rounded text-blue-400 hover:bg-blue-900/30 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={rec.url}
                      download
                      title="Download"
                      className="p-1.5 rounded text-green-400 hover:bg-green-900/30 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setConfirmDeleteIds([rec.id])}
                      title="Delete"
                      className="p-1.5 rounded text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video Preview Modal */}
        {previewUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div
              className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Session Recording Preview</span>
                </div>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="text-gray-400 hover:text-white text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <video
                  src={previewUrl}
                  controls
                  autoPlay
                  className="w-full rounded-lg bg-black max-h-[60vh]"
                />
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <a
                  href={previewUrl}
                  download
                  className="flex items-center gap-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 rounded"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteIds && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-red-500/40 rounded-xl p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <p className="text-white font-semibold">Delete {confirmDeleteIds.length} Recording{confirmDeleteIds.length > 1 ? "s" : ""}?</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    This action is permanent and cannot be undone. The recording file will be removed from S3.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDeleteIds(null)}
                  className="border-gray-600 text-gray-400"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={confirmDelete}
                  disabled={deleteRecording.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteRecording.isPending ? "Deleting..." : "Delete Permanently"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
