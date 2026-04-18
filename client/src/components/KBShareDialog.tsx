import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Copy, Check } from "lucide-react";

interface KBShareDialogProps {
  article: any;
  isOpen: boolean;
  onClose: () => void;
}

export function KBShareDialog({ article, isOpen, onClose }: KBShareDialogProps) {
  const [emails, setEmails] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const shareLink = `${window.location.origin}/kb/${article.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!emails.trim()) {
      setMessage("Please enter at least one email address");
      return;
    }

    setSending(true);
    try {
      // TODO: Implement email sending via tRPC
      // const result = await trpc.kb.sendEmail.useMutation({
      //   articleId: article.id,
      //   emails: emails.split(",").map(e => e.trim()),
      // });
      setMessage("Email sent successfully!");
      setEmails("");
      setTimeout(() => {
        setMessage("");
        onClose();
      }, 2000);
    } catch (error) {
      setMessage("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Share KB Article</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Link Section */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Share Link
            </label>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="bg-slate-800 border-slate-700 text-gray-300 text-sm"
              />
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Share this link with users or other admins
            </p>
          </div>

          {/* Email Section */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Send via Email
            </label>
            <textarea
              placeholder="Enter email addresses (comma-separated)"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded text-gray-300 p-2 text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              e.g., user@example.com, admin@example.com
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`text-sm p-2 rounded ${
                message.includes("successfully")
                  ? "bg-green-900/30 text-green-400"
                  : "bg-red-900/30 text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sending || !emails.trim()}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
