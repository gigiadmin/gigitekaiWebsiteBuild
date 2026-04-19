import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ShareKBModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: number;
  articleTitle: string;
  articleUrl?: string;
}

export function ShareKBModal({ isOpen, onClose, articleId, articleTitle, articleUrl }: ShareKBModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [shareMethod, setShareMethod] = useState<"email" | "link">("email");
  const [copied, setCopied] = useState(false);

  const shareArticleMutation = trpc.kbSharing.shareArticle.useMutation({
    onSuccess: () => {
      toast.success("Article shared successfully!");
      setEmail("");
      setMessage("");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to share article");
    },
  });

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    shareArticleMutation.mutate({
      articleId,
      email: email.trim(),
      message: message.trim() || undefined,
    });
  };

  const handleCopyLink = () => {
    const link = articleUrl || `${window.location.origin}/kb/${articleId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0E1A] border border-gray-800/50">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            Share KB Article
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Article Info */}
          <div className="bg-[#141B2D]/40 border border-gray-800/30 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Article</p>
            <p className="text-sm text-white mt-1">{articleTitle}</p>
          </div>

          {/* Share Method Tabs */}
          <div className="flex gap-2 border-b border-gray-800/30">
            <button
              onClick={() => setShareMethod("email")}
              className={`pb-2 px-3 text-sm font-medium transition-colors ${
                shareMethod === "email"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </button>
            <button
              onClick={() => setShareMethod("link")}
              className={`pb-2 px-3 text-sm font-medium transition-colors ${
                shareMethod === "link"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              <Copy className="w-4 h-4 inline mr-1" />
              Link
            </button>
          </div>

          {/* Email Share Form */}
          {shareMethod === "email" && (
            <form onSubmit={handleShare} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-[#141B2D] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full bg-[#141B2D] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={shareArticleMutation.isPending || !email.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {shareArticleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Article
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Link Share */}
          {shareMethod === "link" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={articleUrl || `${window.location.origin}/kb/${articleId}`}
                    readOnly
                    className="flex-1 bg-[#141B2D] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                  <Button
                    onClick={handleCopyLink}
                    className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-3"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                <p className="text-xs text-cyan-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Share this link with customers or colleagues to give them direct access to this article.</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-800/30">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800/50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
