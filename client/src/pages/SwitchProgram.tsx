/*
  The Switch Program — 60-Day Migration Guarantee
  Slug: /switch-program
  Target: Clients frustrated with slow legacy Florida MSPs
*/

import { ArrowRight, CheckCircle, Clock, Shield, Zap, Users, Star, Phone, Mail, Building2, UserCheck } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { trpc } from "@/lib/trpc";

const STEPS = [
  { step: "01", title: "Free IT Audit", desc: "We assess your current environment, identify gaps, and build a migration plan — at no cost to you." },
  { step: "02", title: "Zero-Downtime Migration", desc: "Our team handles the full migration. Your users keep working. No weekend outages, no lost data." },
  { step: "03", title: "60-Day Guarantee", desc: "If we don't deliver the agreed service quality within 60 days, your migration is completely free." },
  { step: "04", title: "AI-Powered Onboarding", desc: "Aria, our AI agent, trains on your environment and starts resolving tickets from day one." },
];

const PAIN_POINTS = [
  "Waiting 4+ hours for a callback on critical issues",
  "Paying per-ticket fees that punish you for having problems",
  "Your MSP doesn't understand Florida's FIPA or hurricane risks",
  "No proactive monitoring — they only show up when things break",
  "Slow response times that cost you real revenue",
  "No AI or automation — still doing everything manually",
];

const GUARANTEES = [
  { icon: <Clock size={22} />, title: "< 15 Min RTO", desc: "Instant failover if disaster strikes" },
  { icon: <Shield size={22} />, title: "Zero-Downtime Migration", desc: "Your business never stops during the switch" },
  { icon: <Zap size={22} />, title: "60-Day Service Guarantee", desc: "Meet our SLAs or the migration is free" },
  { icon: <Users size={22} />, title: "Dedicated Onboarding Team", desc: "A dedicated engineer for your first 60 days" },
];

export default function SwitchProgram() {
  const [form, setForm] = useState({ name: "", email: "", company: "", currentMsp: "", userCount: "", phone: "", painPoint: "" });
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const submitAudit = trpc.switchProgram.submitAuditRequest.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setFormError(err.message || "Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.email || !form.company) {
      setFormError("Please fill in your name, email, and company.");
      return;
    }
    submitAudit.mutate(form);
  };

  useSEO({
    title: "The Switch Program — 60-Day Migration Guarantee | GigitekAI",
    description: "Frustrated with your current MSP? GigitekAI's Switch Program offers a 60-day migration guarantee, zero downtime, and AI-powered IT from day one. Florida's elite MSP.",
  });

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <SiteNavBar2024 />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="container relative z-10 max-w-4xl text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF" }}
          >
            <Zap size={12} /> The Switch Program
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Done With Your{" "}
            <span style={{ background: "linear-gradient(90deg,#00D4FF,#00EEFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Slow MSP?
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Switch to GigitekAI and get our <strong className="text-white">60-Day Migration Guarantee</strong>. We handle everything — zero downtime, zero risk. If we don't deliver, the migration is on us.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="btn-cyan text-base px-8 py-3">
              Start My Free IT Audit <ArrowRight size={18} />
            </Link>
            <a
              href="tel:+17273826909"
              className="flex items-center gap-2 btn-outline-cyan text-base px-8 py-3"
            >
              <Phone size={18} /> Call (727) 382-6909
            </a>
          </div>
        </div>
      </section>

      {/* ── Pain Points ── */}
      <section className="py-16 border-t border-white/5">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Sound Familiar?
          </h2>
          <p className="text-gray-400 text-center mb-10">
            If you're experiencing any of these with your current MSP, it's time to switch.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {PAIN_POINTS.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span
                  className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                >
                  ✕
                </span>
                <span className="text-gray-300 text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 border-t border-white/5">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            How the Switch Works
          </h2>
          <p className="text-gray-400 text-center mb-12">Four simple steps. Zero disruption to your business.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl p-7"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.12)" }}
              >
                <div
                  className="text-4xl font-black mb-4"
                  style={{ background: "linear-gradient(90deg,#00D4FF,#00EEFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  {s.step}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h3>
                <p className="text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Guarantees ── */}
      <section className="py-16 border-t border-white/5">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Our Guarantees to You
          </h2>
          <p className="text-gray-400 text-center mb-10">We put our money where our mouth is.</p>
          <div className="grid md:grid-cols-2 gap-5">
            {GUARANTEES.map((g) => (
              <div
                key={g.title}
                className="flex items-start gap-4 p-6 rounded-2xl"
                style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-[#00D4FF]"
                  style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}
                >
                  {g.icon}
                </div>
                <div>
                  <div className="font-bold text-white mb-1">{g.title}</div>
                  <div className="text-gray-400 text-sm">{g.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-16 border-t border-white/5">
        <div className="container max-w-3xl">
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(0,212,255,0.02) 100%)", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="#00D4FF" className="text-[#00D4FF]" />)}
            </div>
            <blockquote className="text-xl text-gray-200 italic mb-6 leading-relaxed">
              "We switched from our previous MSP in under 30 days. GigitekAI handled everything — our team didn't notice a single disruption. The AI support bot resolved our first 3 tickets before we even finished onboarding."
            </blockquote>
            <div className="text-[#00D4FF] font-semibold">Florida Healthcare Client</div>
            <div className="text-gray-500 text-sm">Tampa Bay Area • 45 Users</div>
          </div>
        </div>
      </section>

      {/* ── Lead Capture Form ── */}
      <section className="py-20 border-t border-white/5" id="audit-form">
        <div className="container max-w-2xl">
          <h2 className="text-4xl font-bold text-center mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Get Your Free IT Audit
          </h2>
          <p className="text-gray-400 text-center mb-10">
            No commitment, no pressure. We'll assess your current environment and deliver a clear migration plan within 48 hours.
          </p>

          {submitted ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.25)" }}
            >
              <CheckCircle size={48} className="text-[#00D4FF] mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Request Received!</h3>
              <p className="text-gray-300 mb-2">We'll contact you within <strong className="text-white">24 hours</strong> to schedule your free IT audit.</p>
              <p className="text-gray-400 text-sm">Check your inbox for a confirmation email from support@gigitekai.com</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-8 space-y-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.15)" }}
            >
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Harry Henry-Santiago"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#00D4FF]/40"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Work Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="harry@yourcompany.com"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#00D4FF]/40"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#00D4FF]/40"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(727) 555-0100"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#00D4FF]/40"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Current MSP / IT Provider</label>
                  <input
                    type="text"
                    value={form.currentMsp}
                    onChange={e => setForm(f => ({ ...f, currentMsp: e.target.value }))}
                    placeholder="e.g. TechSolutions Inc."
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#00D4FF]/40"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Number of Users</label>
                  <select
                    value={form.userCount}
                    onChange={e => setForm(f => ({ ...f, userCount: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00D4FF]/40"
                    style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <option value="">Select range</option>
                    <option value="1-10">1 – 10 users</option>
                    <option value="11-25">11 – 25 users</option>
                    <option value="26-50">26 – 50 users</option>
                    <option value="51-100">51 – 100 users</option>
                    <option value="100+">100+ users</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Biggest Pain Point with Your Current MSP</label>
                <select
                  value={form.painPoint}
                  onChange={e => setForm(f => ({ ...f, painPoint: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00D4FF]/40"
                  style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="">Select your main issue</option>
                  <option value="slow-response">Slow response times</option>
                  <option value="per-ticket-fees">Per-ticket fees / unexpected charges</option>
                  <option value="no-bcdr">No disaster recovery / BCDR plan</option>
                  <option value="no-fipa">FIPA / compliance gaps</option>
                  <option value="no-ai">No AI or automation</option>
                  <option value="poor-communication">Poor communication</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {formError && (
                <p className="text-red-400 text-sm">{formError}</p>
              )}

              <button
                type="submit"
                disabled={submitAudit.isPending}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base text-black transition-opacity disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00EEFF 100%)", boxShadow: "0 0 24px rgba(0,212,255,0.4)" }}
              >
                {submitAudit.isPending ? "Submitting..." : (<>Get My Free IT Audit <ArrowRight size={18} /></>)}
              </button>
              <p className="text-center text-gray-500 text-xs">No commitment. We'll follow up within 24 hours. Your info is never shared.</p>
            </form>
          )}

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 mt-8">
            <a href="tel:+17273826909" className="flex items-center gap-2 hover:text-[#00D4FF] transition-colors">
              <Phone size={15} /> (727) 382-6909
            </a>
            <a href="mailto:support@gigitekai.com" className="flex items-center gap-2 hover:text-[#00D4FF] transition-colors">
              <Mail size={15} /> support@gigitekai.com
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
