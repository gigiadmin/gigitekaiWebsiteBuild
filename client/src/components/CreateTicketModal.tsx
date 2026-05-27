/**
 * CreateTicketModal — Unified ticket creation form for both users and admins.
 *
 * Props:
 *   mode: "user"  → calls helpdesk.createTicket (approvedProcedure, self-service)
 *         "admin" → calls helpdesk.adminCreateTicket (adminProcedure, on-behalf-of)
 *   open / onClose / onSuccess — standard modal controls
 *
 * Admin-only extras: requesterName, requesterEmail, channel selector
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KBSearchWidget } from "@/components/KBSearchWidget";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Send,
  Tag,
  User,
  Mail,
  Phone,
  Zap,
  X,
} from "lucide-react";

// ─── Shared constants ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "general_support", label: "General Support",   icon: "💬", description: "General questions and assistance" },
  { value: "email",           label: "Email",             icon: "📧", description: "Microsoft 365 email & Outlook issues" },
  { value: "printer",         label: "Printer",           icon: "🖨️", description: "Printer connectivity and printing" },
  { value: "internet",        label: "Internet",          icon: "🌐", description: "Network connectivity / internet" },
  { value: "network",         label: "Network",           icon: "🔗", description: "Network configuration & infrastructure" },
  { value: "bug_report",      label: "Bug Report",        icon: "🐛", description: "Report a software issue or defect" },
  { value: "feature_request", label: "Feature Request",   icon: "💡", description: "Suggest a new feature or improvement" },
  { value: "billing",         label: "Billing",           icon: "💳", description: "Billing, invoices & payment inquiries" },
  { value: "other",           label: "Other",             icon: "❓", description: "Other issues not listed above" },
] as const;

const PRIORITIES = [
  { value: "low",      label: "Low",      description: "Non-urgent, general inquiry",          color: "text-green-400",  dot: "bg-green-500",  border: "border-green-500/30" },
  { value: "medium",   label: "Medium",   description: "Standard request, normal response",    color: "text-yellow-400", dot: "bg-yellow-500", border: "border-yellow-500/30" },
  { value: "high",     label: "High",     description: "Urgent, impacts productivity",         color: "text-orange-400", dot: "bg-orange-500", border: "border-orange-500/30" },
  { value: "critical", label: "Critical", description: "System down, immediate attention",     color: "text-red-400",    dot: "bg-red-500",    border: "border-red-500/30" },
] as const;

const CHANNELS = [
  { value: "web",   label: "Web Portal" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "chat",  label: "Chat" },
] as const;

type Category = typeof CATEGORIES[number]["value"];
type Priority = typeof PRIORITIES[number]["value"];
type Channel  = typeof CHANNELS[number]["value"];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CreateTicketModalProps {
  mode: "user" | "admin";
  open: boolean;
  onClose: () => void;
  onSuccess?: (ticketId: number) => void;
  /** Admin-only: pre-fill on-behalf-of customer info */
  defaultRequesterEmail?: string;
  defaultRequesterName?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CreateTicketModal({
  mode,
  open,
  onClose,
  onSuccess,
  defaultRequesterEmail = "",
  defaultRequesterName = "",
}: CreateTicketModalProps) {
  const isAdmin = mode === "admin";

  const [form, setForm] = useState({
    title:            "",
    description:      "",
    stepsAttempted:   "",
    category:         "general_support" as Category,
    priority:         "medium"          as Priority,
    channel:          "web"             as Channel,
    requesterName:    defaultRequesterName,
    requesterEmail:   defaultRequesterEmail,
  });

  const reset = () =>
    setForm({
      title: "", description: "", stepsAttempted: "",
      category: "general_support", priority: "medium", channel: "web",
      requesterName: defaultRequesterName, requesterEmail: defaultRequesterEmail,
    });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const utils = trpc.useUtils();

  const userMutation = trpc.helpdesk.createTicket.useMutation({
    onSuccess: (data) => {
      toast.success(`Ticket #${data.id} created!`, {
        description: "Our support team will review your request shortly.",
      });
      utils.helpdesk.getMyTickets.invalidate();
      reset();
      onClose();
      onSuccess?.(data.id);
    },
    onError: (err: any) => toast.error(err.message || "Failed to create ticket"),
  });

  const adminMutation = trpc.helpdesk.adminCreateTicket.useMutation({
    onSuccess: (data) => {
      toast.success(`Ticket #${data?.id ?? ""} created!`);
      utils.helpdesk.getAllTickets.invalidate();
      reset();
      onClose();
      onSuccess?.(data?.id ?? 0);
    },
    onError: (err: any) => toast.error(err.message || "Failed to create ticket"),
  });

  const isPending = userMutation.isPending || adminMutation.isPending;

  // ── Validation & submit ──────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.title.trim().length < (isAdmin ? 5 : 10)) {
      toast.error(`Subject must be at least ${isAdmin ? 5 : 10} characters`);
      return;
    }
    if (form.description.trim().length < (isAdmin ? 10 : 30)) {
      toast.error(`Description must be at least ${isAdmin ? 10 : 30} characters`);
      return;
    }
    if (!isAdmin && form.stepsAttempted.trim().length < 20) {
      toast.error("Please describe at least 20 characters of steps you've already tried");
      return;
    }

    if (isAdmin) {
      adminMutation.mutate({
        title:          form.title.trim(),
        description:    form.description.trim(),
        stepsAttempted: form.stepsAttempted.trim() || undefined,
        category:       form.category,
        priority:       form.priority,
        channel:        form.channel,
        requesterName:  form.requesterName.trim() || undefined,
        requesterEmail: form.requesterEmail.trim() || undefined,
      });
    } else {
      userMutation.mutate({
        title:          form.title.trim(),
        description:    form.description.trim(),
        stepsAttempted: form.stepsAttempted.trim() || undefined,
        category:       form.category,
        priority:       form.priority,
        channel:        form.channel,
      });
    }
  };

  const handleArticleSelect = useCallback((_id: number, title: string) => {
    toast.info(`KB article selected: ${title}`, { description: "Review the article before submitting." });
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0F1629] border border-gray-800 rounded-2xl shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Full-modal loading overlay ─────────────────────────────────── */}
        {isPending && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-[#0A0E1A]/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-5 px-8 text-center">
              {/* Animated ring */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-[#00D4FF]/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00D4FF] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Send className="w-7 h-7 text-[#00D4FF]" />
                </div>
              </div>
              {/* Status text */}
              <div>
                <p className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {isAdmin ? "Creating Ticket…" : "Submitting Ticket…"}
                </p>
                <p className="text-gray-400 text-sm mt-1">AI is classifying and routing your request</p>
              </div>
              {/* Progress steps */}
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {[
                  { label: "Validating form data",       delay: "0ms" },
                  { label: "AI classifying issue",        delay: "400ms" },
                  { label: "Routing to support team",     delay: "800ms" },
                  { label: "Sending notifications",       delay: "1200ms" },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-sm text-gray-400"
                    style={{ animation: `fadeIn 0.4s ease forwards`, animationDelay: step.delay, opacity: 0 }}
                  >
                    <Loader2 className="w-3.5 h-3.5 text-[#00D4FF] animate-spin shrink-0" />
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0F1629] border-b border-gray-800/60">
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {isAdmin ? "Create Ticket (On Behalf Of)" : "Create Support Ticket"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isAdmin
                ? "Open a ticket on behalf of a customer or for internal tracking"
                : "Describe your issue and our AI will route it to the right team"}
            </p>
          </div>
          <button
            onClick={() => { if (!isPending) { reset(); onClose(); } }}
            disabled={isPending}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* ── Admin-only: Requester info ─────────────────────────────────── */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#141B2D] border border-gray-800/60 rounded-xl">
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-[#00D4FF] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Customer / Requester Info
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />
                  Customer Email <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="customer@company.com"
                  value={form.requesterEmail}
                  onChange={(e) => setForm((f) => ({ ...f, requesterEmail: e.target.value }))}
                  className="w-full bg-[#0F1629] border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  Customer Name <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={form.requesterName}
                  onChange={(e) => setForm((f) => ({ ...f, requesterName: e.target.value }))}
                  className="w-full bg-[#0F1629] border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />
                  Channel / Source
                </label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as Channel }))}
                  className="w-full bg-[#0F1629] border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-colors"
                >
                  {CHANNELS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Category ──────────────────────────────────────────────────── */}
          <div>
            <label className="block text-white font-semibold text-sm mb-2.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Tag className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Issue Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    form.category === cat.value
                      ? "bg-[#00D4FF]/10 border-[#00D4FF]/40"
                      : "bg-[#141B2D] border-gray-800/60 hover:border-gray-700"
                  }`}
                >
                  <span className="text-base mr-1.5">{cat.icon}</span>
                  <span className={`font-semibold text-xs ${form.category === cat.value ? "text-[#00D4FF]" : "text-gray-300"}`}>
                    {cat.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Subject / Title ───────────────────────────────────────────── */}
          <div>
            <label className="block text-white font-semibold text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <FileText className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Subject / Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={isAdmin ? "Brief description of the issue…" : "E.g. Cannot send emails from Outlook since this morning"}
              required
              minLength={5}
              className="w-full bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-colors"
            />
            <p className="text-gray-500 text-xs mt-1">
              {form.title.length} chars (min 5) {form.title.length >= 5 ? "✓" : ""}
            </p>
          </div>

          {/* ── Description ───────────────────────────────────────────────── */}
          <div>
            <label className="block text-white font-semibold text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <AlertTriangle className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Issue Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={
                isAdmin
                  ? "Detailed description of the issue or request…"
                  : "Describe what's happening in detail:\n• What were you trying to do?\n• What error message or behavior did you see?\n• When did it start?"
              }
              required
              minLength={10}
              rows={5}
              className="w-full bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-colors resize-none"
            />
            <p className="text-gray-500 text-xs mt-1">
              {form.description.length} chars (min 10) {form.description.length >= 10 ? "✓" : ""}
            </p>
          </div>

          {/* ── KB Search (shows when enough text entered) ─────────────────── */}
          {(form.title.length >= 5 || form.description.length >= 10) && (
            <KBSearchWidget
              ticketTitle={form.title}
              ticketDescription={form.description}
              onArticleSelect={handleArticleSelect}
            />
          )}

          {/* ── Steps Attempted ───────────────────────────────────────────── */}
          <div>
            <label className="block text-white font-semibold text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <CheckCircle2 className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Steps Already Tried {!isAdmin && <span className="text-red-400">*</span>}
              {isAdmin && <span className="text-gray-500 font-normal text-xs ml-1">(optional)</span>}
            </label>
            <textarea
              value={form.stepsAttempted}
              onChange={(e) => setForm((f) => ({ ...f, stepsAttempted: e.target.value }))}
              placeholder={
                "Help us avoid duplicate troubleshooting:\n\n1. What have you already tried?\n2. What were the results?\n3. Any recent changes to your system?"
              }
              required={!isAdmin}
              minLength={!isAdmin ? 5 : undefined}
              rows={4}
              className="w-full bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-colors resize-none"
            />
            {!isAdmin && (
              <p className="text-gray-500 text-xs mt-1">
                {form.stepsAttempted.length} chars (min 5) {form.stepsAttempted.length >= 5 ? "✓" : ""}
              </p>
            )}
          </div>

          {/* ── Priority ──────────────────────────────────────────────────── */}
          <div>
            <label className="block text-white font-semibold text-sm mb-2.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Zap className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Priority Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    form.priority === p.value
                      ? `bg-[#141B2D] ${p.border} border-2`
                      : "bg-[#141B2D]/60 border-gray-800/60 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />
                    <span className={`font-semibold text-xs ${form.priority === p.value ? p.color : "text-gray-300"}`}>
                      {p.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-tight">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Info banner ───────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 p-4 bg-[#00D4FF]/5 border border-[#00D4FF]/15 rounded-xl">
            <Info className="w-5 h-5 text-[#00D4FF] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300 font-medium">What happens next?</p>
              <p className="text-xs text-gray-400 mt-1">
                {isAdmin
                  ? "The ticket will be created immediately, classified by AI, and routed to the appropriate team. Teams will be notified."
                  : "Our AI will classify and route your ticket. You'll receive a confirmation email and our team will respond within 2 business hours for standard requests."}
              </p>
            </div>
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-1 pb-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold rounded-xl py-6 shadow-lg shadow-[#00D4FF]/15 hover:shadow-[#00D4FF]/30 transition-all"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> {isAdmin ? "Create Ticket" : "Submit Ticket"}</>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => { reset(); onClose(); }}
              variant="outline"
              disabled={isPending}
              className="border-gray-700 text-gray-400 hover:text-white rounded-xl py-6 px-6 disabled:opacity-30"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
