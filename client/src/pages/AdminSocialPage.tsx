/**
 * AdminSocialPage — Social Publishing Hub
 * Write once, publish to LinkedIn, Twitter/X, and Facebook simultaneously.
 * Includes OAuth connect/disconnect flow for each platform.
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

export default function AdminSocialPage() {
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [selected, setSelected] = useState<Set<"linkedin" | "twitter" | "facebook">>(
    () => new Set<"linkedin" | "twitter" | "facebook">(["linkedin"])
  );

  const utils = trpc.useUtils();

  // Check for ?connected=<platform> or ?error=... from OAuth callback
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
      toast.error(`${platform ?? "Platform"} connect failed: ${error}`);
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

  const twitterSelected = selected.has("twitter");
  const charLimit = twitterSelected ? TWITTER_MAX : MAX_CHARS;
  const overLimit = content.length > charLimit;

  function handlePublish() {
    if (!content.trim()) return;
    if (overLimit) return;
    publishMutation.mutate({
      content: content.trim(),
      link: link.trim() || undefined,
      platforms: Array.from(selected),
    });
  }

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
                      <button
                        onClick={() => disconnectMutation.mutate({ platform: p.id })}
                        disabled={disconnectMutation.isPending}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Unlink className="w-3 h-3" />
                        Disconnect
                      </button>
                    </>
                  ) : isExpired ? (
                    <>
                      <p className="text-amber-400 text-xs">Token expired — reconnect</p>
                      <a
                        href={p.connectHref}
                        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        Reconnect
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
                  onClick={() => togglePlatform(p.id)}
                  title={!isConnected ? `Connect ${p.label} first` : undefined}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    isActive ? p.active + " " + p.color : p.bg + " text-gray-500 hover:text-gray-300"
                  } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
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
              Twitter/X posts are limited to 280 characters. Content will be truncated if over limit.
            </p>
          )}

          {/* Publish button */}
          <div className="flex justify-end">
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
                return (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#0A0E1A]/60 border border-gray-800/60"
                  >
                    <div className={`p-2 rounded-lg ${platform?.bg ?? "bg-gray-800"} shrink-0`}>
                      <Icon className={`w-4 h-4 ${platform?.color ?? "text-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{post.content}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-gray-600 text-xs">
                          {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {post.status === "published" ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        ) : post.status === "failed" ? (
                          <span className="flex items-center gap-1 text-red-400 text-xs">
                            <XCircle className="w-3 h-3" /> Failed
                          </span>
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
                      {post.errorMessage && (
                        <p className="text-red-400 text-xs mt-1 truncate">{post.errorMessage}</p>
                      )}
                    </div>
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
