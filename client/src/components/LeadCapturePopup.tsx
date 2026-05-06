/*
  GigitekAI Lead Capture Popup
  Triggers on ANY of these conditions:
  1. After 30 seconds AND 50% scroll depth (both required)
  2. Exit-intent: mouse moves toward top of viewport (browser chrome / close button)
  Offers a free consultation — collects name, email, company, hearAboutUs
  Uses contact.submit tRPC mutation
  Respects session storage so it only shows once per session
*/

import { useState, useEffect, useCallback } from "react";
import { X, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STORAGE_KEY = "gigitekai_lead_popup_dismissed";

interface LeadCapturePopupProps {
  /** Context hint shown in the popup headline, e.g. "Cloud Infrastructure" */
  context?: string;
}

export default function LeadCapturePopup({ context }: LeadCapturePopupProps) {
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", hearAboutUs: "" });

  const dismiss = useCallback(() => {
    setVisible(false);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (_) {}
  }, []);

  useEffect(() => {
    // Don't show if already dismissed this session
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch (_) {}

    let timerFired = false;
    let scrollFired = false;
    let shown = false;

    const show = (reason?: string) => {
      if (shown) return;
      // Exit-intent fires immediately; scroll+timer require both
      if (reason !== "exit-intent" && (!timerFired || !scrollFired)) return;
      shown = true;
      setVisible(true);
    };

    // Condition 1: 30 seconds
    const timer = setTimeout(() => {
      timerFired = true;
      show();
    }, 30_000);

    // Condition 2: 50% scroll depth
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total >= 0.5) {
        scrollFired = true;
        show();
        window.removeEventListener("scroll", handleScroll);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Condition 3: Exit-intent — mouse leaves toward browser chrome
    // Only fires after user has been on page for at least 5 seconds
    let pageAgeMs = 0;
    const pageAgeInterval = setInterval(() => { pageAgeMs += 500; }, 500);
    const handleMouseLeave = (e: MouseEvent) => {
      if (pageAgeMs < 5000) return; // ignore if user just landed
      if (e.clientY <= 20) show("exit-intent"); // heading toward top chrome
    };
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      clearInterval(pageAgeInterval);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("We'll be in touch within 1 business day!");
      setTimeout(dismiss, 3500);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    submitMutation.mutate({
      name: form.name,
      email: form.email,
      company: form.company || undefined,
      hearAboutUs: form.hearAboutUs || undefined,
      message: `Free consultation request via lead popup${context ? ` (${context})` : ""}.`,
    });
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0"
      role="dialog"
      aria-modal="true"
      aria-label="Free consultation offer"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-[#0A0E1A] to-[#0F1629] border border-[rgba(0,212,255,0.25)] rounded-2xl shadow-2xl shadow-[#00D4FF]/10 overflow-hidden">
        {/* Cyan accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00D4FF] via-[#0099CC] to-transparent" />

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="p-6 pt-5">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <CheckCircle2 size={48} className="text-[#00D4FF]" />
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                You're all set!
              </h3>
              <p className="text-gray-400 text-sm">
                Our team will reach out within 1 business day to schedule your free consultation.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/30 flex items-center justify-center shrink-0">
                  <Zap size={20} className="text-[#00D4FF]" />
                </div>
                <div>
                  <p className="text-[#00D4FF] text-xs font-semibold uppercase tracking-widest mb-0.5">
                    Limited Offer
                  </p>
                  <h3 className="text-lg font-bold text-white leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Get a Free{context ? ` ${context}` : ""} Consultation
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    30-minute strategy session with a GigitekAI expert — no commitment required.
                  </p>
                </div>
              </div>

              {/* Bullet points */}
              <ul className="space-y-1.5 mb-5">
                {[
                  "Personalized AI & cloud roadmap",
                  "Identify quick-win automation opportunities",
                  "Transparent pricing — no hidden fees",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 size={14} className="text-[#00D4FF] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00D4FF]/50 focus:bg-white/8 transition-all"
                  />
                  <input
                    type="email"
                    placeholder="Work email *"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00D4FF]/50 focus:bg-white/8 transition-all"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Company name (optional)"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#00D4FF]/50 focus:bg-white/8 transition-all"
                />
                <select
                  value={form.hearAboutUs}
                  onChange={(e) => setForm((f) => ({ ...f, hearAboutUs: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0A0E1A] border border-white/10 text-sm focus:outline-none focus:border-[#00D4FF]/50 transition-all"
                  style={{ color: form.hearAboutUs ? '#fff' : '#6b7280' }}
                >
                  <option value="" disabled>How did you hear about us?</option>
                  <option value="Google Search">Google Search</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Referral / Word of Mouth">Referral / Word of Mouth</option>
                  <option value="Microsoft Partner Network">Microsoft Partner Network</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Blog / Article">Blog / Article</option>
                  <option value="Email Campaign">Email Campaign</option>
                  <option value="Event / Conference">Event / Conference</option>
                  <option value="Other">Other</option>
                </select>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00D4FF] text-[#0A0E1A] font-bold text-sm hover:bg-[#00EEFF] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Booking…
                    </>
                  ) : (
                    "Book My Free Consultation →"
                  )}
                </button>
                <p className="text-center text-gray-400 text-xs">
                  No spam. Unsubscribe anytime. We respect your privacy.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
