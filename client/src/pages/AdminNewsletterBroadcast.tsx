/**
 * AdminNewsletterBroadcast — compose and send newsletter campaigns
 * Features: subject + TipTap body editor, live HTML preview, send to all active
 * subscribers, campaign history table with status badges.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Send, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Clock, History } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

const EMPTY_FORM = { subject: "", bodyHtml: "" };

export default function AdminNewsletterBroadcast() {
  const utils = trpc.useUtils();
  const { data: stats } = trpc.newsletter.subscriberStats.useQuery();
  const { data: campaigns, isLoading: campaignsLoading } = trpc.newsletter.listCampaigns.useQuery();

  const sendCampaign = trpc.newsletter.sendCampaign.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Campaign sent! ${result.sentCount} delivered${result.failedCount > 0 ? `, ${result.failedCount} failed` : ""}.`
      );
      setForm(EMPTY_FORM);
      setConfirmOpen(false);
      utils.newsletter.listCampaigns.invalidate();
      utils.newsletter.subscriberStats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send campaign.");
      setConfirmOpen(false);
    },
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSend() {
    if (!form.subject.trim()) { toast.error("Subject is required."); return; }
    if (!form.bodyHtml.trim() || form.bodyHtml === "<p></p>") { toast.error("Email body is required."); return; }
    setConfirmOpen(true);
  }

  function statusBadge(status: string) {
    if (status === "completed") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"><CheckCircle2 size={11} className="mr-1" />Sent</Badge>;
    if (status === "failed") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs"><XCircle size={11} className="mr-1" />Failed</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"><Clock size={11} className="mr-1" />Sending</Badge>;
  }

  return (
    <div className="space-y-8">
      {/* Compose form */}
      <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.15)] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Send size={18} className="text-[#00D4FF]" />
              Compose Campaign
            </h3>
            {stats && (
              <p className="text-gray-400 text-sm mt-0.5">
                Will be sent to <span className="text-[#00D4FF] font-semibold">{stats.active}</span> active subscriber{stats.active !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="border-[rgba(0,212,255,0.3)] text-[#00D4FF] hover:bg-[rgba(0,212,255,0.1)]"
          >
            {showPreview ? <><EyeOff size={14} className="mr-1.5" />Hide Preview</> : <><Eye size={14} className="mr-1.5" />Preview</>}
          </Button>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject Line</label>
          <Input
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="e.g. This Month in AI: What Every Business Needs to Know"
            className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600 focus:border-[#00D4FF]"
            maxLength={500}
          />
          <p className="text-xs text-gray-600 mt-1">{form.subject.length}/500 characters</p>
        </div>

        {/* Body editor */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Body</label>
          <RichTextEditor
            value={form.bodyHtml}
            onChange={(html) => setForm((f) => ({ ...f, bodyHtml: html }))}
            placeholder="Write your newsletter content here. Use headings, bullet lists, bold text, and links to make it engaging…"
          />
        </div>

        {/* Live preview */}
        {showPreview && form.bodyHtml && form.bodyHtml !== "<p></p>" && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email Preview</p>
            <div className="rounded-xl border border-[rgba(0,212,255,0.15)] overflow-hidden bg-white">
              {/* Branded header preview */}
              <div style={{ background: "linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%)", padding: "20px 24px", borderBottom: "3px solid #00D4FF" }}>
                <span style={{ color: "#00D4FF", fontWeight: 700, fontSize: 18 }}>GigitekAI</span>
                <span style={{ color: "#8899AA", fontSize: 11, display: "block", marginTop: 2 }}>Cloud &amp; AI Solutions</span>
              </div>
              <div
                className="prose prose-sm max-w-none p-6 text-gray-800"
                dangerouslySetInnerHTML={{ __html: form.bodyHtml }}
              />
              <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "14px 24px", textAlign: "center", fontSize: 11, color: "#718096" }}>
                GigitekAI · Cloud &amp; AI Solutions · gigitekai.com<br />
                You're receiving this because you subscribed. <span style={{ textDecoration: "underline" }}>Unsubscribe</span>
              </div>
            </div>
          </div>
        )}

        {/* Send button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSend}
            disabled={sendCampaign.isPending || !form.subject.trim() || !form.bodyHtml.trim()}
            className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-bold px-8"
          >
            {sendCampaign.isPending ? (
              <><Loader2 size={14} className="mr-2 animate-spin" />Sending…</>
            ) : (
              <><Send size={14} className="mr-2" />Send Campaign</>
            )}
          </Button>
        </div>
      </div>

      {/* Campaign history */}
      <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.15)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[rgba(0,212,255,0.1)]">
          <History size={16} className="text-[#00D4FF]" />
          <h3 className="text-base font-semibold text-white">Campaign History</h3>
        </div>

        {campaignsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#00D4FF] mr-3" size={22} />
            <span className="text-gray-400">Loading campaigns…</span>
          </div>
        ) : !campaigns || campaigns.length === 0 ? (
          <div className="text-center py-12">
            <History className="mx-auto text-gray-600 mb-3" size={36} />
            <p className="text-gray-400">No campaigns sent yet.</p>
            <p className="text-gray-500 text-sm mt-1">Your first campaign will appear here after sending.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Sent By</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Recipients</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Delivered</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.03)] transition-colors"
                >
                  <td className="px-5 py-3">
                    <span className="text-white font-medium line-clamp-1">{c.subject}</span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-gray-400 text-xs">{c.sentBy ?? "—"}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-gray-300">{c.recipientCount}</td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="text-green-400">{c.sentCount}</span>
                    {c.failedCount > 0 && <span className="text-red-400 ml-1">/ {c.failedCount} failed</span>}
                  </td>
                  <td className="px-5 py-3">{statusBadge(c.status)}</td>
                  <td className="px-5 py-3 hidden md:table-cell text-gray-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm send dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={(o) => !sendCampaign.isPending && setConfirmOpen(o)}>
        <AlertDialogContent className="bg-[#141B2D] border-[rgba(0,212,255,0.2)] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Send Campaign?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will immediately send <strong className="text-white">"{form.subject}"</strong> to{" "}
              <strong className="text-[#00D4FF]">{stats?.active ?? "all"} active subscriber{(stats?.active ?? 0) !== 1 ? "s" : ""}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={sendCampaign.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                sendCampaign.mutate({
                  subject: form.subject,
                  bodyHtml: form.bodyHtml,
                  siteUrl: window.location.origin,
                })
              }
              disabled={sendCampaign.isPending}
              className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-bold"
            >
              {sendCampaign.isPending ? (
                <><Loader2 size={14} className="mr-2 animate-spin" />Sending…</>
              ) : (
                "Yes, Send Now"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
