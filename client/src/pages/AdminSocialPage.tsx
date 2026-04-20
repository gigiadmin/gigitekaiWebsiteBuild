/**
 * AdminSocialPage — Social Publishing Hub
 * Write once, publish to LinkedIn, Twitter/X, and Facebook simultaneously.
 * Features: OAuth connect/disconnect, per-platform post previews,
 * detailed API error messages, and refresh/reconnect button.
 */
import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ScheduledPostsCalendar from "@/components/ScheduledPostsCalendar";
import {
  Linkedin,
  Twitter,
  Facebook,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Link2,
  Unlink,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Repeat2,
  ThumbsUp,
  Globe,
  Calendar,
  FileText,
  BarChart2,
  Share2,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  CheckCircle,
  Star,
} from "lucide-react";

const PLATFORMS = [
  {
    id: "linkedin" as const,
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    active: "bg-blue-500/20 border-blue-500/60",
    connectHref: "/api/social/linkedin/connect",
    brandColor: "#0A66C2",
  },
  {
    id: "twitter" as const,
    label: "Twitter / X",
    icon: Twitter,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/30",
    active: "bg-sky-500/20 border-sky-500/60",
    connectHref: "/api/social/twitter/connect",
    brandColor: "#1DA1F2",
  },
  {
    id: "facebook" as const,
    label: "Facebook",
    icon: Facebook,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    active: "bg-indigo-500/20 border-indigo-500/60",
    connectHref: "/api/social/facebook/connect",
    brandColor: "#1877F2",
  },
];

const MAX_CHARS = 3000;
const TWITTER_MAX = 280;

// ── Per-platform preview cards ─────────────────────────────────────────────

function LinkedInPreview({ content, link, screenName }: { content: string; link?: string; screenName?: string }) {
  return (
    
    <AdminLayout><div className="rounded-xl border border-blue-500/20 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
          <Linkedin className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{screenName ?? "GigitekAI"}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <Globe className="w-3 h-3" /> Just now · Public
          </p>
        </div>
      </div>
      <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{content || "Your post will appear here..."}</p>
      {link && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <p className="text-[#00D4FF] text-xs truncate">{link}</p>
        </div>
      )}
      <div className="flex items-center gap-5 pt-1 border-t border-gray-800">
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-blue-400 transition-colors">
          <ThumbsUp className="w-3.5 h-3.5" /> Like
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-blue-400 transition-colors">
          <MessageCircle className="w-3.5 h-3.5" /> Comment
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-blue-400 transition-colors">
          <Repeat2 className="w-3.5 h-3.5" /> Repost
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-blue-400 transition-colors">
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </div>
    </div>
  
    </AdminLayout>);
}

function TwitterPreview({ content, screenName }: { content: string; screenName?: string }) {
  const charCount = content.length;
  const overLimit = charCount > TWITTER_MAX;
  const displayContent = overLimit ? content.slice(0, TWITTER_MAX) + "…" : content;
  return (
    <div className="rounded-xl border border-sky-500/20 bg-[#15202B] p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
          <Twitter className="w-5 h-5 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-white text-sm font-bold">{screenName ?? "GigitekAI"}</p>
            <p className="text-gray-500 text-xs">@gigitekai · now</p>
          </div>
          <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed mt-1">
            {displayContent || <span className="text-gray-600">Your tweet will appear here...</span>}
          </p>
          {overLimit && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Content truncated to 280 characters
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-5 pl-12">
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-sky-400 transition-colors">
          <MessageCircle className="w-3.5 h-3.5" /> Reply
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-green-400 transition-colors">
          <Repeat2 className="w-3.5 h-3.5" /> Retweet
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-red-400 transition-colors">
          <Heart className="w-3.5 h-3.5" /> Like
        </button>
      </div>
    </div>
  );
}

function FacebookPreview({ content, link, screenName }: { content: string; link?: string; screenName?: string }) {
  return (
    <div className="rounded-xl border border-indigo-500/20 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Facebook className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{screenName ?? "GigitekAI"}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            Just now · <Globe className="w-3 h-3" />
          </p>
        </div>
      </div>
      <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{content || "Your post will appear here..."}</p>
      {link && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <p className="text-[#00D4FF] text-xs truncate">{link}</p>
        </div>
      )}
      <div className="flex items-center gap-5 pt-1 border-t border-gray-800">
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-indigo-400 transition-colors">
          <ThumbsUp className="w-3.5 h-3.5" /> Like
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-indigo-400 transition-colors">
          <MessageCircle className="w-3.5 h-3.5" /> Comment
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-indigo-400 transition-colors">
          <Repeat2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminSocialPage() {
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [selected, setSelected] = useState<Set<"linkedin" | "twitter" | "facebook">>(
    () => new Set<"linkedin" | "twitter" | "facebook">(["linkedin"])
  );
  const [showPreview, setShowPreview] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(() => new Set<number>());

  // Schedule state
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");

  // Draft editing
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);

  // Auto-save
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const lastSavedContent = useRef("");

  // Engagement date range
  const [engDays, setEngDays] = useState(30);

  // Scheduled posts view mode
  const [scheduledView, setScheduledView] = useState<"list" | "calendar">("list");

  const utils = trpc.useUtils();

  // Handle OAuth callback redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    const platform = params.get("platform");
    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
      utils.social.getConnections.invalidate();
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (error) {
      toast.error(`${platform ?? "Platform"} connect failed: ${decodeURIComponent(error)}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: connections, isLoading: connLoading } = trpc.social.getConnections.useQuery();
  const { data: history, isLoading: histLoading } = trpc.social.history.useQuery();
  const { data: drafts, isLoading: draftsLoading } = trpc.social.getDrafts.useQuery();
  const { data: scheduled, isLoading: scheduledLoading } = trpc.social.getScheduled.useQuery();
  const { data: engagement, isLoading: engLoading } = trpc.social.getEngagement.useQuery({ days: engDays });
  const { data: optimalTimes } = trpc.social.getOptimalPostingTimes.useQuery();

  const disconnectMutation = trpc.social.disconnect.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${vars.platform} disconnected`);
      utils.social.getConnections.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const saveDraftMutation = trpc.social.saveDraft.useMutation({
    onSuccess: () => {
      toast.success(editingDraftId ? "Draft updated" : "Draft saved");
      setContent(""); setLink(""); setEditingDraftId(null);
      utils.social.getDrafts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const schedulePostMutation = trpc.social.schedulePost.useMutation({
    onSuccess: () => {
      toast.success(`Post scheduled for ${scheduledDate} at ${scheduledTime}`);
      setContent(""); setLink(""); setScheduleMode(false); setScheduledDate(""); setScheduledTime("09:00");
      utils.social.getScheduled.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteDraftMutation = trpc.social.deleteDraft.useMutation({
    onSuccess: () => { toast.success("Draft deleted"); utils.social.getDrafts.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const cancelScheduledMutation = trpc.social.cancelScheduled.useMutation({
    onSuccess: () => { toast.success("Scheduled post cancelled — moved to drafts"); utils.social.getScheduled.invalidate(); utils.social.getDrafts.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const publishMutation = trpc.social.publish.useMutation({
    onSuccess: (data) => {
      const successes = data.results.filter((r) => r.success);
      const failures = data.results.filter((r) => !r.success);
      if (successes.length > 0) {
        toast.success(`Published to ${successes.map((r) => r.platform).join(", ")}`);
        setContent("");
        setLink("");
        setShowPreview(false);
      }
      if (failures.length > 0) {
        failures.forEach((f) => toast.error(`${f.platform}: ${f.error}`));
      }
      utils.social.history.invalidate();
      utils.social.getEngagement.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function getConnectionForPlatform(id: string) {
    return connections?.find((c) => c.platform === id) ?? null;
  }

  function loadDraft(draft: any) {
    setContent(draft.content ?? "");
    setLink(draft.link ?? "");
    try {
      const ps = JSON.parse(draft.platforms ?? "[]");
      if (ps.length > 0) setSelected(new Set(ps));
    } catch { /* ignore */ }
    setEditingDraftId(draft.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Auto-save draft while typing (3s debounce)
  useEffect(() => {
    if (!content.trim() || content === lastSavedContent.current) return;
    setAutoSaveStatus("saving");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveDraftMutation.mutateAsync({
        id: editingDraftId ?? undefined,
        content: content.trim(),
        link: link.trim() || undefined,
        platforms: Array.from(selected),
      }).then((result: any) => {
        lastSavedContent.current = content;
        if (!editingDraftId && result?.id) setEditingDraftId(result.id);
        setAutoSaveStatus("saved");
        utils.social.getDrafts.invalidate();
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      }).catch(() => setAutoSaveStatus("idle"));
    }, 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [content, link]);

  function handleSaveDraft() {
    if (!content.trim()) return;
    saveDraftMutation.mutate({ id: editingDraftId ?? undefined, content: content.trim(), link: link.trim() || undefined, platforms: Array.from(selected) });
  }

  function handleSchedule() {
    if (!content.trim() || !scheduledDate) return;
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`);
    schedulePostMutation.mutate({ content: content.trim(), link: link.trim() || undefined, platforms: Array.from(selected), scheduledAt });
  }

  const minDateStr = new Date().toISOString().split("T")[0];

  function togglePlatform(id: "linkedin" | "twitter" | "facebook") {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleError(id: number) {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const twitterSelected = selected.has("twitter");
  const charLimit = twitterSelected ? TWITTER_MAX : MAX_CHARS;
  const overLimit = content.length > charLimit;

  function handlePublish() {
    if (!content.trim() || overLimit) return;
    publishMutation.mutate({
      content: content.trim(),
      link: link.trim() || undefined,
      platforms: Array.from(selected),
    });
  }

  const selectedPlatformsList = PLATFORMS.filter((p) => selected.has(p.id));

  return (
    <AdminLayout title="Social Publishing Hub">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Platform Connection Status */}
        <div className="bg-[#141B2D] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Platform Connections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              const conn = getConnectionForPlatform(p.id);
              const isConnected = !!conn && !conn.isExpired;
              const isExpired = conn?.isExpired;

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${
                    isConnected
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : isExpired
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-gray-700 bg-[#0A0E1A]/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${p.color}`} />
                    <span className="text-white font-semibold text-sm">{p.label}</span>
                    {connLoading ? (
                      <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin ml-auto" />
                    ) : isConnected ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                    ) : isExpired ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 ml-auto" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-gray-600 ml-auto" />
                    )}
                  </div>

                  {isConnected && conn ? (
                    <>
                      <div>
                        <p className="text-emerald-400 text-xs font-medium">Connected</p>
                        {conn.screenName && (
                          <p className="text-gray-400 text-xs mt-0.5 truncate">{conn.screenName}</p>
                        )}
                        <p className="text-gray-600 text-xs mt-0.5">
                          Since {new Date(conn.connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Refresh Connection */}
                        <a
                          href={p.connectHref}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00D4FF] transition-colors"
                          title="Refresh token"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Refresh
                        </a>
                        <button
                          onClick={() => disconnectMutation.mutate({ platform: p.id })}
                          disabled={disconnectMutation.isPending}
                          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Unlink className="w-3 h-3" />
                          Disconnect
                        </button>
                      </div>
                    </>
                  ) : isExpired ? (
                    <>
                      <p className="text-amber-400 text-xs">Token expired</p>
                      <a
                        href={p.connectHref}
                        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Refresh Connection
                      </a>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 text-xs">Not connected</p>
                      <a
                        href={p.connectHref}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${p.color} hover:opacity-80`}
                      >
                        <Link2 className="w-3 h-3" />
                        Connect {p.label}
                      </a>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Compose Card */}
        <div id="social-compose" className="bg-[#141B2D] border border-gray-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Compose Post
          </h2>

          {/* Platform selector */}
          <div className="flex gap-3 flex-wrap">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              const isActive = selected.has(p.id);
              const conn = getConnectionForPlatform(p.id);
              const isConnected = !!conn && !conn.isExpired;
              return (
                <button
                  key={p.id}
                  onClick={() => isConnected && togglePlatform(p.id)}
                  title={!isConnected ? `Connect ${p.label} first` : undefined}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    isActive && isConnected ? p.active + " " + p.color : p.bg + " text-gray-500 hover:text-gray-300"
                  } ${!isConnected ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Icon className="w-4 h-4" />
                  {p.label}
                  {isActive && isConnected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {!isConnected && <XCircle className="w-3.5 h-3.5 text-gray-600" />}
                </button>
              );
            })}
          </div>

          {/* Content textarea */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to share? Write your post here..."
              rows={6}
              className="w-full bg-[#0A0E1A] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-all resize-none"
            />
            <span className={`absolute bottom-3 right-3 text-xs ${overLimit ? "text-red-400 font-bold" : "text-gray-600"}`}>
              {content.length}/{charLimit}
            </span>
          </div>
          {/* Auto-save status */}
          {autoSaveStatus !== "idle" && (
            <div className={`flex items-center gap-1.5 text-xs ${
              autoSaveStatus === "saving" ? "text-amber-400" : "text-emerald-400"
            }`}>
              {autoSaveStatus === "saving" ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Auto-saving...</>
              ) : (
                <><CheckCircle className="w-3 h-3" /> Draft saved</>  
              )}
            </div>
          )}

          {/* Optional link */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
              Link (optional)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://gigitekai.com/blog/..."
              className="w-full bg-[#0A0E1A] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-all"
            />
          </div>

          {/* Twitter character warning */}
          {twitterSelected && content.length > 240 && (
            <p className="text-amber-400 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Twitter/X posts are limited to 280 characters. Content will be truncated.
            </p>
          )}

          {/* Schedule toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScheduleMode(!scheduleMode)}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                scheduleMode ? "border-cyan-500/60 text-cyan-400 bg-cyan-500/10" : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {scheduleMode ? "Scheduling for later" : "Schedule for later"}
            </button>
          </div>

          {scheduleMode && (
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  min={minDateStr}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                />
                {/* Best days of week suggestions */}
                {optimalTimes && optimalTimes.bestDays && optimalTimes.bestDays.length > 0 && (() => {
                  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                  const selectedDayOfWeek = scheduledDate ? new Date(scheduledDate + "T12:00:00").getDay() : -1;
                  const isBestDay = optimalTimes.bestDays.includes(selectedDayOfWeek);
                  return (
                    <div className="mt-1.5">
                      {isBestDay ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                          <Star className="w-3 h-3 fill-amber-400" /> Best day for engagement
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">
                          Best days:{" "}
                          {optimalTimes.bestDays.map((d) => {
                            // Find the next occurrence of this day of week from today
                            const today = new Date();
                            const daysUntil = (d - today.getDay() + 7) % 7 || 7;
                            const nextDate = new Date(today);
                            nextDate.setDate(today.getDate() + daysUntil);
                            const dateStr = nextDate.toISOString().split("T")[0];
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setScheduledDate(dateStr)}
                                className="inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 font-medium transition-colors mr-1"
                              >
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                {DAY_NAMES[d]}
                              </button>
                            );
                          })}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
                />
                {/* Optimal posting time suggestions */}
                {optimalTimes && optimalTimes.bestHours.length > 0 && (() => {
                  const selectedHour = scheduledTime ? parseInt(scheduledTime.split(":")[0], 10) : -1;
                  const isBest = optimalTimes.bestHours.includes(selectedHour);
                  return (
                    <div className="mt-1.5">
                      {isBest ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                          <Star className="w-3 h-3 fill-amber-400" /> Best time for engagement
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">
                          Best hours:{" "}
                          {optimalTimes.bestHours.map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setScheduledTime(`${String(h).padStart(2, "0")}:00`)}
                              className="inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 font-medium transition-colors mr-1"
                            >
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                            </button>
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {editingDraftId && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              <Edit2 className="w-3 h-3" /> Editing draft #{editingDraftId} — publish or save to update
            </div>
          )}

          {/* Preview toggle + Publish */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#00D4FF] transition-colors"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Hide Preview" : "Preview Post"}
            </button>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!content.trim() || saveDraftMutation.isPending}
                className="border-gray-600 text-gray-300 hover:text-white rounded-xl text-sm"
              >
                {saveDraftMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
                {editingDraftId ? "Update Draft" : "Save Draft"}
              </Button>
              {scheduleMode ? (
                <Button
                  onClick={handleSchedule}
                  disabled={!content.trim() || !scheduledDate || schedulePostMutation.isPending}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#0A0E1A] font-bold rounded-xl px-6"
                >
                  {schedulePostMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                  {schedulePostMutation.isPending ? "Scheduling..." : "Schedule Post"}
                </Button>
              ) : (
                <Button
                  onClick={handlePublish}
                  disabled={!content.trim() || overLimit || publishMutation.isPending || selected.size === 0}
                  className="bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold rounded-xl px-6"
                >
                  {publishMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {publishMutation.isPending ? "Publishing..." : `Publish to ${selected.size} platform${selected.size > 1 ? "s" : ""}`}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Per-platform post previews */}
        {showPreview && content.trim() && (
          <div className="space-y-4">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider px-1">Post Previews</h3>
            {selectedPlatformsList.map((p) => {
              const conn = getConnectionForPlatform(p.id);
              const screenName = conn?.screenName ?? undefined;
              return (
                <div key={p.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <p.icon className={`w-4 h-4 ${p.color}`} />
                    <span className="text-gray-400 text-xs font-medium">{p.label} Preview</span>
                  </div>
                  {p.id === "linkedin" && (
                    <LinkedInPreview content={content} link={link || undefined} screenName={screenName} />
                  )}
                  {p.id === "twitter" && (
                    <TwitterPreview content={content} screenName={screenName} />
                  )}
                  {p.id === "facebook" && (
                    <FacebookPreview content={content} link={link || undefined} screenName={screenName} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Drafts */}
        {(drafts?.length ?? 0) > 0 && (
          <div className="bg-[#141B2D] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Drafts ({drafts?.length ?? 0})
            </h2>
            {draftsLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-14 bg-gray-800/40 rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="space-y-3">
                {drafts?.map((draft: any) => {
                  const ps: string[] = (() => { try { return JSON.parse(draft.platforms ?? "[]"); } catch { return [draft.platform]; } })();
                  return (
                    <div key={draft.id} className="rounded-xl bg-[#0A0E1A]/60 border border-gray-800/60 p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {ps.map((pid) => {
                            const plat = PLATFORMS.find(p => p.id === pid);
                            if (!plat) return null;
                            const Icon = plat.icon;
                            return <Icon key={pid} className={`w-3.5 h-3.5 ${plat.color}`} />;
                          })}
                          <span className="text-gray-500 text-xs">{new Date(draft.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-2">{draft.content}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => loadDraft(draft)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-1 rounded border border-cyan-500/30 hover:border-cyan-500/60 transition-colors">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => deleteDraftMutation.mutate({ id: draft.id })} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-800/40 hover:border-red-500/40 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Scheduled Posts */}
        {(scheduled?.length ?? 0) > 0 && (
          <div className="bg-[#141B2D] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Scheduled Posts ({scheduled?.length ?? 0})
              </h2>
              {/* List / Calendar toggle */}
              <div className="flex items-center gap-1 bg-[#0A0E1A] border border-gray-800 rounded-lg p-0.5">
                <button
                  onClick={() => setScheduledView("list")}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    scheduledView === "list" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <List className="w-3.5 h-3.5" /> List
                </button>
                <button
                  onClick={() => setScheduledView("calendar")}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    scheduledView === "calendar" ? "bg-cyan-500/20 text-cyan-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Calendar
                </button>
              </div>
            </div>
            {scheduledLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-14 bg-gray-800/40 rounded-xl animate-pulse" />)}</div>
            ) : scheduledView === "calendar" ? (
              <ScheduledPostsCalendar
                scheduled={scheduled ?? []}
                onCancel={(id) => cancelScheduledMutation.mutate({ id })}
                cancelPending={cancelScheduledMutation.isPending}
                onDraftFromDay={(dateStr) => {
                  // Pre-fill compose form with this date and open schedule mode
                  setScheduledDate(dateStr);
                  setScheduleMode(true);
                  // Scroll to compose section
                  setTimeout(() => {
                    document.getElementById("social-compose")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
                }}
              />
            ) : (
              <div className="space-y-3">
                {scheduled?.map((post: any) => {
                  const ps: string[] = (() => { try { return JSON.parse(post.platforms ?? "[]"); } catch { return [post.platform]; } })();
                  return (
                    <div key={post.id} className="rounded-xl bg-[#0A0E1A]/60 border border-cyan-500/20 p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {ps.map((pid) => {
                            const plat = PLATFORMS.find(p => p.id === pid);
                            if (!plat) return null;
                            const Icon = plat.icon;
                            return <Icon key={pid} className={`w-3.5 h-3.5 ${plat.color}`} />;
                          })}
                          <span className="flex items-center gap-1 text-cyan-400 text-xs">
                            <Clock className="w-3 h-3" />
                            {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "—"}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-2">{post.content}</p>
                      </div>
                      <button
                        onClick={() => cancelScheduledMutation.mutate({ id: post.id })}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-800/40 hover:border-red-500/40 transition-colors shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Engagement Analytics */}
        <div className="bg-[#141B2D] border border-gray-800 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Engagement Analytics
            </h2>
            <div className="flex items-center gap-2">
              {/* Date range presets */}
              <div className="flex items-center gap-1 bg-[#0A0E1A] border border-gray-800 rounded-lg p-0.5">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setEngDays(d)}
                    className={`text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                      engDays === d ? "bg-cyan-500/20 text-cyan-400" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <button onClick={() => utils.social.getEngagement.invalidate()} className="text-gray-500 hover:text-[#00D4FF] transition-colors p-1.5 rounded-lg hover:bg-gray-800" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {engLoading ? (
            <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-800/40 rounded-xl animate-pulse" />)}</div>
          ) : !engagement || engagement.posts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No published posts yet. Engagement data refreshes hourly after publishing.</p>
          ) : (
            <>
              {/* Totals */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Likes", value: engagement.totals.likes, icon: ThumbsUp, color: "text-pink-400" },
                  { label: "Comments", value: engagement.totals.comments, icon: MessageCircle, color: "text-blue-400" },
                  { label: "Shares", value: engagement.totals.shares, icon: Share2, color: "text-green-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-[#0A0E1A]/60 rounded-xl border border-gray-800 p-4 text-center">
                    <Icon className={`w-6 h-6 mx-auto mb-1.5 ${color}`} />
                    <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {/* Per-post */}
              <div className="space-y-2">
                {engagement.posts.map((post: any) => {
                  const plat = PLATFORMS.find(p => p.id === post.platform);
                  const Icon = plat?.icon ?? BarChart2;
                  return (
                    <div key={post.id} className="rounded-xl bg-[#0A0E1A]/60 border border-gray-800/60 p-3 flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${plat?.bg ?? "bg-gray-800"} shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${plat?.color ?? "text-gray-400"}`} />
                      </div>
                      <p className="text-gray-300 text-sm flex-1 min-w-0 truncate">{post.content}</p>
                      <div className="flex gap-3 shrink-0 text-xs">
                        <span className="flex items-center gap-1 text-pink-400"><ThumbsUp className="w-3 h-3" />{post.engagementLikes ?? 0}</span>
                        <span className="flex items-center gap-1 text-blue-400"><MessageCircle className="w-3 h-3" />{post.engagementComments ?? 0}</span>
                        <span className="flex items-center gap-1 text-green-400"><Share2 className="w-3 h-3" />{post.engagementShares ?? 0}</span>
                      </div>
                      {post.url && (
                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-[#00D4FF] hover:text-cyan-300 shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* History */}
        <div className="bg-[#141B2D] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Recent Posts
            </h2>
            <button
              onClick={() => utils.social.history.invalidate()}
              className="text-gray-500 hover:text-[#00D4FF] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {histLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-800/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No posts yet. Connect a platform and publish something above!</p>
          ) : (
            <div className="space-y-3">
              {history.map((post: any) => {
                const platform = PLATFORMS.find((p) => p.id === post.platform);
                const Icon = platform?.icon ?? Send;
                const isExpanded = expandedErrors.has(post.id);
                return (
                  <div
                    key={post.id}
                    className="rounded-xl bg-[#0A0E1A]/60 border border-gray-800/60 overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-3">
                      <div className={`p-2 rounded-lg ${platform?.bg ?? "bg-gray-800"} shrink-0`}>
                        <Icon className={`w-4 h-4 ${platform?.color ?? "text-gray-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{post.content}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-gray-600 text-xs">
                            {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          {post.status === "published" ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs">
                              <CheckCircle2 className="w-3 h-3" /> Published
                            </span>
                          ) : post.status === "failed" ? (
                            <button
                              onClick={() => toggleError(post.id)}
                              className="flex items-center gap-1 text-red-400 text-xs hover:text-red-300 transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> Failed
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400 text-xs">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {post.url && (
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[#00D4FF] text-xs hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Expanded error detail panel */}
                    {post.status === "failed" && post.errorMessage && isExpanded && (
                      <div className="mx-3 mb-3 rounded-lg bg-red-950/40 border border-red-500/20 p-3">
                        <p className="text-red-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> API Error Details
                        </p>
                        <pre className="text-red-300 text-xs whitespace-pre-wrap break-all font-mono leading-relaxed">
                          {post.errorMessage}
                        </pre>
                        {post.errorMessage.includes("not connected") && (
                          <p className="text-amber-400 text-xs mt-2 flex items-center gap-1.5">
                            <Link2 className="w-3 h-3" />
                            Go to Platform Connections above to reconnect this platform.
                          </p>
                        )}
                        {(post.errorMessage.includes("401") || post.errorMessage.includes("token")) && (
                          <p className="text-amber-400 text-xs mt-2 flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3" />
                            Token may be expired — use the Refresh Connection button above.
                          </p>
                        )}
                        {post.errorMessage.includes("429") && (
                          <p className="text-amber-400 text-xs mt-2 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            Rate limit hit — wait a few minutes before retrying.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
