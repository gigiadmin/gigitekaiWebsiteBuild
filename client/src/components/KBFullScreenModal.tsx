import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Copy, Mail, Share2, Edit2 } from "lucide-react";
import { KBArticleContent } from "./KBArticleContent";
import { Streamdown } from "streamdown";

interface KBFullScreenModalProps {
  article: any;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (article: any) => void;
  onEmail?: (article: any) => void;
  onEdit?: (article: any) => void;
  isAdmin?: boolean;
}

export function KBFullScreenModal({
  article,
  isOpen,
  onClose,
  onShare,
  onEmail,
  onEdit,
  isAdmin = false,
}: KBFullScreenModalProps) {
  const [copied, setCopied] = useState(false);

  // Guard: never render article content when article is null
  if (!article) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700">
          <div className="py-12 text-center text-gray-500">Loading article...</div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/kb/${article.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMarkdown = () => {
    const markdown = `# ${article.title}\n\n${article.content}\n\n---\n*Shared from GigitekAI Knowledge Base*`;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader className="sticky top-0 bg-slate-900 border-b border-slate-700 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-white mb-2">
                {article.title}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">
                  Category: {article.category}
                </span>
                {article.priority && (
                  <span className="text-xs text-gray-400">
                    Priority: {article.priority}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Article Content */}
        <div className="py-6 px-6">
          <KBArticleContent content={article.content} />
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="border-slate-600 text-gray-300 hover:bg-slate-800"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Link Copied!" : "Copy Link"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMarkdown}
            className="border-slate-600 text-gray-300 hover:bg-slate-800"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy as Markdown
          </Button>

          {onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShare(article)}
              className="border-slate-600 text-gray-300 hover:bg-slate-800"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}

          {onEmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEmail(article)}
              className="border-slate-600 text-gray-300 hover:bg-slate-800"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          )}

          {isAdmin && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(article)}
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/20"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
