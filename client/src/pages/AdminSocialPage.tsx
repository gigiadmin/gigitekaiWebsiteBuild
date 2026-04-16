/**
 * AdminSocialPage — Social Publishing Hub
 * Write once, publish to LinkedIn, Twitter/X, and Facebook simultaneously.
 */
import { useState } from "react";
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
} from "lucide-react";

const PLATFORMS = [
  { id: "linkedin" as const, label: "LinkedIn", icon: Linkedin, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", active: "bg-blue-500/20 border-blue-500/60" },
  { id: "twitter" as const, label: "Twitter / X", icon: Twitter, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30", active: "bg-sky-500/20 border-sky-500/60" },
  { id: "facebook" as const, label: "Facebook", icon: Facebook, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30", active: "bg-indigo-500/20 border-indigo-500/60" },
];

const MAX_CHARS = 3000;
const TWITTER_MAX = 280;

export default function AdminSocialPage() {
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [selected, setSelected] = useState<Set<"linkedin" | "twitter" | "facebook">>(() => new Set<"linkedin" | "twitter" | "facebook">(["linkedin"]));

  const utils = trpc.useUtils();
  const { data: history, isLoading: histLoading } = trpc.social.history.useQuery();

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
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    isActive ? p.active + " " + p.color : p.bg + " text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {p.label}
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
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
            <p className="text-gray-500 text-sm text-center py-8">No posts yet. Publish something above!</p>
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
