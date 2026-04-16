/**
 * AdminSocialPage — Social Publishing Hub
 * Write once, publish to LinkedIn, Twitter/X, and Facebook simultaneously.
 * Features: OAuth connect/disconnect, per-platform post previews,
 * detailed API error messages, and refresh/reconnect button.
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
    <div className="rounded-xl border border-blue-500/20 bg-white/5 p-4 space-y-3">
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
  );
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

  const disconnectMutation = trpc.social.disconnect.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${vars.platform} disconnected`);
      utils.social.getConnections.invalidate();
    },
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
    },
    onError: (err) => toast.error(err.message),
  });

  function getConnectionForPlatform(id: string) {
    return connections?.find((c) => c.platform === id) ?? null;
  }

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
        <div className="bg-[#141B2D] border border-gray-800 rounded-2xl p-6 space-y-5">
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

          {/* Preview toggle + Publish */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#00D4FF] transition-colors"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Hide Preview" : "Preview Post"}
            </button>
            <Button
              onClick={handlePublish}
              disabled={!content.trim() || overLimit || publishMutation.isPending || selected.size === 0}
              className="bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold rounded-xl px-6"
            >
              {publishMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {publishMutation.isPending ? "Publishing..." : `Publish to ${selected.size} platform${selected.size > 1 ? "s" : ""}`}
            </Button>
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
