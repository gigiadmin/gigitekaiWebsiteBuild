/**
 * AdminNewsletterBroadcast — compose, draft, schedule, and send newsletter campaigns.
 * Tabs: Compose | Drafts | Scheduled | Sent History
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Send, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Clock,
  History, FileText, CalendarClock, Save, Trash2, Calendar, Edit,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import AdminLayout from "@/components/AdminLayout";

const EMPTY_FORM = { subject: "", bodyHtml: "", editingId: null as number | null };

type ConfirmAction = "send" | "sendDraft" | "sendScheduled" | null;

export default function AdminNewsletterBroadcast() {
  const utils = trpc.useUtils();
  const { data: stats } = trpc.newsletter.subscriberStats.useQuery();
  const { data: campaigns, isLoading: sentLoading } = trpc.newsletter.listCampaigns.useQuery();
  const { data: drafts, isLoading: draftsLoading } = trpc.newsletter.listDrafts.useQuery();
  const { data: scheduled, isLoading: scheduledLoading } = trpc.newsletter.listScheduled.useQuery();

  const [form, setForm] = useState(EMPTY_FORM);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id?: number; subject?: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");

  function invalidateAll() {
    utils.newsletter.listCampaigns.invalidate();
    utils.newsletter.listDrafts.invalidate();
    utils.newsletter.listScheduled.invalidate();
    utils.newsletter.subscriberStats.invalidate();
  }

  const sendCampaign = trpc.newsletter.sendCampaign.useMutation({
    onSuccess: (result) => {
      toast.success(`Campaign sent! ${result.sentCount} delivered${result.failedCount > 0 ? `, ${result.failedCount} failed` : ""}.`);
      setForm(EMPTY_FORM);
      setConfirmAction(null);
      setConfirmTarget(null);
      invalidateAll();
      setActiveTab("sent");
    },
    onError: (err) => { toast.error(err.message || "Failed to send."); setConfirmAction(null); },
  });

  const saveDraft = trpc.newsletter.saveDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft saved.");
      setForm(EMPTY_FORM);
      invalidateAll();
      setActiveTab("drafts");
    },
    onError: (err) => toast.error(err.message || "Failed to save draft."),
  });

  const updateDraft = trpc.newsletter.updateDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft updated.");
      setForm(EMPTY_FORM);
      invalidateAll();
      setActiveTab("drafts");
    },
    onError: (err) => toast.error(err.message || "Failed to update draft."),
  });

  const deleteDraft = trpc.newsletter.deleteDraft.useMutation({
    onSuccess: () => { toast.success("Deleted."); invalidateAll(); },
    onError: (err) => toast.error(err.message || "Failed to delete."),
  });

  const scheduleCampaign = trpc.newsletter.scheduleCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign scheduled!");
      setForm(EMPTY_FORM);
      setScheduleDate("");
      setShowSchedulePicker(false);
      invalidateAll();
      setActiveTab("scheduled");
    },
    onError: (err) => toast.error(err.message || "Failed to schedule."),
  });

  const cancelSchedule = trpc.newsletter.cancelSchedule.useMutation({
    onSuccess: () => { toast.success("Schedule cancelled — moved to Drafts."); invalidateAll(); },
    onError: (err) => toast.error(err.message || "Failed to cancel."),
  });

  // ─── Compose actions ───────────────────────────────────────────────────────

  function validateForm() {
    if (!form.subject.trim()) { toast.error("Subject is required."); return false; }
    if (!form.bodyHtml.trim() || form.bodyHtml === "<p></p>") { toast.error("Email body is required."); return false; }
    return true;
  }

  function handleSendNow() {
    if (!validateForm()) return;
    setConfirmAction("send");
    setConfirmTarget({ subject: form.subject });
  }

  function handleSaveDraft() {
    if (form.editingId) {
      updateDraft.mutate({ id: form.editingId, subject: form.subject, bodyHtml: form.bodyHtml });
    } else {
      saveDraft.mutate({ subject: form.subject, bodyHtml: form.bodyHtml });
    }
  }

  function handleSchedule() {
    if (!validateForm()) return;
    setShowSchedulePicker(true);
  }

  function confirmSchedule() {
    if (!scheduleDate) { toast.error("Please select a date and time."); return; }
    const dt = new Date(scheduleDate);
    if (dt <= new Date()) { toast.error("Scheduled time must be in the future."); return; }
    scheduleCampaign.mutate({
      id: form.editingId ?? undefined,
      subject: form.subject,
      bodyHtml: form.bodyHtml,
      scheduledAt: dt.toISOString(),
      siteUrl: window.location.origin,
    });
  }

  function loadDraftIntoEditor(draft: { id: number; subject: string; body: string }) {
    setForm({ subject: draft.subject, bodyHtml: draft.body, editingId: draft.id });
    setActiveTab("compose");
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function statusBadge(status: string) {
    if (status === "completed") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"><CheckCircle2 size={11} className="mr-1" />Sent</Badge>;
    if (status === "failed") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs"><XCircle size={11} className="mr-1" />Failed</Badge>;
    if (status === "scheduled") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"><CalendarClock size={11} className="mr-1" />Scheduled</Badge>;
    if (status === "draft") return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs"><FileText size={11} className="mr-1" />Draft</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"><Clock size={11} className="mr-1" />Sending</Badge>;
  }

  function fmtDate(d: Date | string | null | undefined) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const isBusy = sendCampaign.isPending || saveDraft.isPending || updateDraft.isPending || scheduleCampaign.isPending;

  // ─── Min datetime for schedule picker (now + 5 min) ───────────────────────
  const minDateTime = new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16);

  return (
    <AdminLayout>
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#0A0E1A] border border-[rgba(0,212,255,0.15)]">
          {[
            { value: "compose", label: "Compose", icon: <Edit size={13} /> },
            { value: "drafts", label: `Drafts${drafts?.length ? ` (${drafts.length})` : ""}`, icon: <FileText size={13} /> },
            { value: "scheduled", label: `Scheduled${scheduled?.length ? ` (${scheduled.length})` : ""}`, icon: <CalendarClock size={13} /> },
            { value: "sent", label: "Sent", icon: <History size={13} /> },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-[#00D4FF] data-[state=active]:text-[#0A0E1A] text-gray-400 flex items-center gap-1.5"
            >
              {t.icon}{t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── COMPOSE ── */}
        <TabsContent value="compose" className="mt-4">
          <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.15)] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send size={18} className="text-[#00D4FF]" />
                  {form.editingId ? "Edit Draft" : "New Campaign"}
                </h3>
                {stats && (
                  <p className="text-gray-400 text-sm mt-0.5">
                    {stats.active} active subscriber{stats.active !== 1 ? "s" : ""}
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
              <p className="text-xs text-gray-600 mt-1">{form.subject.length}/500</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Body</label>
              <RichTextEditor
                value={form.bodyHtml}
                onChange={(html) => setForm((f) => ({ ...f, bodyHtml: html }))}
                placeholder="Write your newsletter content here…"
              />
            </div>

            {/* Live preview */}
            {showPreview && form.bodyHtml && form.bodyHtml !== "<p></p>" && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email Preview</p>
                <div className="rounded-xl border border-[rgba(0,212,255,0.15)] overflow-hidden bg-white">
                  <div style={{ background: "linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%)", padding: "20px 24px", borderBottom: "3px solid #00D4FF" }}>
                    <span style={{ color: "#00D4FF", fontWeight: 700, fontSize: 18 }}>GigitekAI</span>
                    <span style={{ color: "#8899AA", fontSize: 11, display: "block", marginTop: 2 }}>Cloud &amp; AI Solutions</span>
                  </div>
                  <div className="prose prose-sm max-w-none p-6 text-gray-800" dangerouslySetInnerHTML={{ __html: form.bodyHtml }} />
                  <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "14px 24px", textAlign: "center", fontSize: 11, color: "#718096" }}>
                    GigitekAI · gigitekai.com &nbsp;|&nbsp; <span style={{ textDecoration: "underline" }}>Unsubscribe</span>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule picker */}
            {showSchedulePicker && (
              <div className="bg-[#0A0E1A] rounded-lg border border-[rgba(0,212,255,0.2)] p-4 space-y-3">
                <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Calendar size={14} className="text-[#00D4FF]" />
                  Schedule Send Date &amp; Time
                </p>
                <Input
                  type="datetime-local"
                  min={minDateTime}
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-[#141B2D] border-[rgba(0,212,255,0.2)] text-white focus:border-[#00D4FF] w-full max-w-xs"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={confirmSchedule}
                    disabled={!scheduleDate || scheduleCampaign.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {scheduleCampaign.isPending ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <CalendarClock size={13} className="mr-1.5" />}
                    Confirm Schedule
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setShowSchedulePicker(false); setScheduleDate(""); }}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isBusy}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {saveDraft.isPending || updateDraft.isPending ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
                {form.editingId ? "Update Draft" : "Save as Draft"}
              </Button>
              {!showSchedulePicker && (
                <Button
                  variant="outline"
                  onClick={handleSchedule}
                  disabled={isBusy}
                  className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                >
                  <CalendarClock size={13} className="mr-1.5" />
                  Schedule
                </Button>
              )}
              <Button
                onClick={handleSendNow}
                disabled={isBusy}
                className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-bold px-6"
              >
                {sendCampaign.isPending ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Send size={13} className="mr-1.5" />}
                Send Now
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── DRAFTS ── */}
        <TabsContent value="drafts" className="mt-4">
          <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.15)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[rgba(0,212,255,0.1)]">
              <FileText size={16} className="text-[#00D4FF]" />
              <h3 className="text-base font-semibold text-white">Saved Drafts</h3>
            </div>
            {draftsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-[#00D4FF] mr-3" size={22} /><span className="text-gray-400">Loading…</span></div>
            ) : !drafts?.length ? (
              <div className="text-center py-12"><FileText className="mx-auto text-gray-600 mb-3" size={36} /><p className="text-gray-400">No drafts yet.</p><p className="text-gray-500 text-sm mt-1">Click "Save as Draft" in the Compose tab.</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 text-left"><th className="px-5 py-3 font-medium">Subject</th><th className="px-5 py-3 font-medium hidden md:table-cell">Last Updated</th><th className="px-5 py-3 font-medium text-right">Actions</th></tr></thead>
                <tbody>
                  {drafts.map((d) => (
                    <tr key={d.id} className="border-t border-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.03)]">
                      <td className="px-5 py-3 text-white font-medium">{d.subject || <span className="text-gray-500 italic">Untitled</span>}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-gray-400 text-xs">{fmtDate(d.updatedAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => loadDraftIntoEditor({ id: d.id, subject: d.subject, body: d.body })} className="border-[rgba(0,212,255,0.3)] text-[#00D4FF] hover:bg-[rgba(0,212,255,0.1)] h-7 px-2 text-xs">
                            <Edit size={11} className="mr-1" />Edit
                          </Button>
                          <Button size="sm" onClick={() => { setConfirmAction("sendDraft"); setConfirmTarget({ id: d.id, subject: d.subject }); }} className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-bold h-7 px-2 text-xs">
                            <Send size={11} className="mr-1" />Send
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteDraft.mutate({ id: d.id })} disabled={deleteDraft.isPending} className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 px-2 text-xs">
                            <Trash2 size={11} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* ── SCHEDULED ── */}
        <TabsContent value="scheduled" className="mt-4">
          <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.15)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[rgba(0,212,255,0.1)]">
              <CalendarClock size={16} className="text-[#00D4FF]" />
              <h3 className="text-base font-semibold text-white">Scheduled Campaigns</h3>
            </div>
            {scheduledLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-[#00D4FF] mr-3" size={22} /><span className="text-gray-400">Loading…</span></div>
            ) : !scheduled?.length ? (
              <div className="text-center py-12"><CalendarClock className="mx-auto text-gray-600 mb-3" size={36} /><p className="text-gray-400">No scheduled campaigns.</p><p className="text-gray-500 text-sm mt-1">Use the "Schedule" button in Compose to queue a campaign.</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 text-left"><th className="px-5 py-3 font-medium">Subject</th><th className="px-5 py-3 font-medium">Scheduled For</th><th className="px-5 py-3 font-medium text-right">Actions</th></tr></thead>
                <tbody>
                  {scheduled.map((s) => (
                    <tr key={s.id} className="border-t border-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.03)]">
                      <td className="px-5 py-3 text-white font-medium">{s.subject}</td>
                      <td className="px-5 py-3 text-blue-400 text-xs font-medium">{fmtDate(s.scheduledAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => { setConfirmAction("sendScheduled"); setConfirmTarget({ id: s.id, subject: s.subject }); }} className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-bold h-7 px-2 text-xs">
                            <Send size={11} className="mr-1" />Send Now
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => cancelSchedule.mutate({ id: s.id })} disabled={cancelSchedule.isPending} className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 h-7 px-2 text-xs">
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* ── SENT HISTORY ── */}
        <TabsContent value="sent" className="mt-4">
          <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.15)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[rgba(0,212,255,0.1)]">
              <History size={16} className="text-[#00D4FF]" />
              <h3 className="text-base font-semibold text-white">Sent Campaigns</h3>
            </div>
            {sentLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-[#00D4FF] mr-3" size={22} /><span className="text-gray-400">Loading…</span></div>
            ) : !campaigns?.length ? (
              <div className="text-center py-12"><History className="mx-auto text-gray-600 mb-3" size={36} /><p className="text-gray-400">No campaigns sent yet.</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 text-left"><th className="px-5 py-3 font-medium">Subject</th><th className="px-5 py-3 font-medium hidden md:table-cell">Sent By</th><th className="px-5 py-3 font-medium hidden lg:table-cell">Recipients</th><th className="px-5 py-3 font-medium hidden lg:table-cell">Delivered</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium hidden md:table-cell">Date</th></tr></thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-t border-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.03)]">
                      <td className="px-5 py-3 text-white font-medium line-clamp-1">{c.subject}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-gray-400 text-xs">{c.sentBy ?? "—"}</td>
                      <td className="px-5 py-3 hidden lg:table-cell text-gray-300">{c.recipientCount}</td>
                      <td className="px-5 py-3 hidden lg:table-cell"><span className="text-green-400">{c.sentCount}</span>{c.failedCount > 0 && <span className="text-red-400 ml-1">/ {c.failedCount} failed</span>}</td>
                      <td className="px-5 py-3">{statusBadge(c.status)}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-gray-400 text-xs">{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Confirm Send Dialog ── */}
      <AlertDialog
        open={confirmAction === "send" || confirmAction === "sendDraft" || confirmAction === "sendScheduled"}
        onOpenChange={(o) => !sendCampaign.isPending && !o && setConfirmAction(null)}
      >
        <AlertDialogContent className="bg-[#141B2D] border-[rgba(0,212,255,0.2)] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Send Campaign Now?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will immediately send{" "}
              <strong className="text-white">"{confirmTarget?.subject || form.subject}"</strong>{" "}
              to <strong className="text-[#00D4FF]">{stats?.active ?? "all"} active subscriber{(stats?.active ?? 0) !== 1 ? "s" : ""}</strong>.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700" disabled={sendCampaign.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction === "send") {
                  sendCampaign.mutate({ subject: form.subject, bodyHtml: form.bodyHtml, siteUrl: window.location.origin });
                } else {
                  // sendDraft or sendScheduled — load the campaign by id
                  const target = confirmAction === "sendDraft"
                    ? drafts?.find((d) => d.id === confirmTarget?.id)
                    : scheduled?.find((s) => s.id === confirmTarget?.id);
                  if (target) {
                    sendCampaign.mutate({ campaignId: target.id, subject: target.subject, bodyHtml: target.body, siteUrl: window.location.origin });
                  }
                }
              }}
              disabled={sendCampaign.isPending}
              className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-bold"
            >
              {sendCampaign.isPending ? <><Loader2 size={14} className="mr-2 animate-spin" />Sending…</> : "Yes, Send Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  
    </AdminLayout>);
}
