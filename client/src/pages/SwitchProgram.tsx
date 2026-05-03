/*
  The Switch Program — 60-Day Migration Guarantee
  Slug: /switch-program
  Target: Clients frustrated with slow legacy Florida MSPs
*/

import { ArrowRight, CheckCircle, Clock, Shield, Zap, Users, Star, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

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
              href="tel:+17273825776"
              className="flex items-center gap-2 btn-outline-cyan text-base px-8 py-3"
            >
              <Phone size={18} /> Call (727) 382-5776
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

      {/* ── Final CTA ── */}
      <section className="py-20 border-t border-white/5">
        <div className="container max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to Make the Switch?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Start with a free IT audit. No commitment, no pressure. Just an honest assessment of your current environment and a clear migration plan.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Link href="/contact" className="btn-cyan text-base px-8 py-3">
              Get My Free IT Audit <ArrowRight size={18} />
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <a href="tel:+17273825776" className="flex items-center gap-2 hover:text-[#00D4FF] transition-colors">
              <Phone size={15} /> (727) 382-5776
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
