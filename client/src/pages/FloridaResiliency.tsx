/*
  Florida IT Resiliency Page
  Slug: /florida-it-resiliency
  "Cloud-Native. Florida-Hardened. Agentic AI Protection for the Sunshine State."
*/

import { ArrowRight, Shield, Zap, MapPin, Clock, CheckCircle, AlertTriangle, Cloud, Server, ClipboardList } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

const COMPARISON_DATA = [
  { metric: "Recovery Time Objective (RTO)", standard: "4 – 24 Hours", elite: "< 15 Minutes (Instant Failover)", eliteWins: true },
  { metric: "Security Framework", standard: "NIST / Basic Firewall", elite: "Zero-Trust + AI Threat Hunting", eliteWins: true },
  { metric: "Business Value", standard: "Efficiency (Saving Time)", elite: "Transformation (Generating Revenue)", eliteWins: true },
  { metric: "Local Focus", standard: "Generic Support", elite: "Florida Compliance & Disaster Hardening", eliteWins: true },
  { metric: "FIPA Compliance", standard: "Manual / Reactive", elite: "Automated 30-Day Notification Engine", eliteWins: true },
  { metric: "Hurricane Continuity", standard: "Office Goes Dark", elite: "AI Agents Keep Running Remotely", eliteWins: true },
];

const DATA_CENTERS = [
  { city: "Miami", role: "Primary", tier: "Tier 4", lat: 25.77, lng: -80.19, color: "#00D4FF" },
  { city: "Tampa", role: "Secondary", tier: "Tier 4", lat: 27.95, lng: -82.46, color: "#00EEFF" },
  { city: "Atlanta", role: "Out-of-Region DR", tier: "Tier 4", lat: 33.75, lng: -84.39, color: "#7c3aed" },
];

const PILLARS = [
  {
    icon: <Cloud size={28} />,
    title: "Disaster-Proof Agentic Cloud",
    desc: "We don't just back up your data — we replicate your entire business logic into a sovereign AI vault. If your physical office goes dark, your AI Agents keep processing orders, triaging tickets, and serving clients.",
  },
  {
    icon: <Shield size={28} />,
    title: "FIPA Compliance Automation",
    desc: "Florida's Information Protection Act requires breach notification within 30 days. Our agents monitor data flows automatically and trigger notifications before deadlines — no manual tracking required.",
  },
  {
    icon: <Zap size={28} />,
    title: "< 15 Minute RTO",
    desc: "Standard Florida MSPs promise 4–24 hour recovery. We deliver instant failover with sub-15-minute Recovery Time Objectives, keeping your business operational through any disaster.",
  },
  {
    icon: <MapPin size={28} />,
    title: "Florida Sovereign Cloud",
    desc: "Data residency in Tier 4 data centers across Miami (primary), Tampa (secondary), and Atlanta (out-of-region DR). Low latency with geographic redundancy built for Florida's unique risk profile.",
  },
];

export default function FloridaResiliency() {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useSEO({
    title: "Florida IT Resiliency & BCDR | GigitekAI — Cloud-Native. Florida-Hardened.",
    description: "GigitekAI delivers disaster-proof agentic cloud for Florida businesses. FIPA compliance automation, <15 min RTO, and Tier 4 data centers in Miami, Tampa, and Atlanta.",
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
        <div className="container relative z-10 max-w-5xl">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF" }}
          >
            <MapPin size={12} /> Florida Elite MSP
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Cloud-Native.{" "}
            <span style={{ background: "linear-gradient(90deg,#00D4FF,#00EEFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Florida-Hardened.
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mb-8 leading-relaxed">
            Agentic AI Protection for the Sunshine State. Florida businesses face unique threats — from Category 5 hurricanes to FIPA compliance deadlines. Traditional IT "backups" aren't enough when your team needs to work remotely for weeks.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="btn-cyan text-base px-7 py-3">
              Get Florida-Hardened <ArrowRight size={18} />
            </Link>
            <Link href="/switch-program" className="btn-outline-cyan text-base px-7 py-3">
              The 60-Day Switch Guarantee
            </Link>
          </div>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="py-16 border-t border-white/5">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-orange-400" />
                <span className="text-orange-400 font-semibold text-sm uppercase tracking-wider">The Florida Problem</span>
              </div>
              <h2 className="text-3xl font-bold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Your Business Faces Risks Other States Don't
              </h2>
              <ul className="space-y-4 text-gray-300">
                {[
                  "Category 5 hurricanes can destroy physical infrastructure and cut power for weeks",
                  "Florida's FIPA mandates 30-day breach notifications — manual tracking fails under pressure",
                  "Legacy MSPs focus on 'fixing the server' — but what if the server is underwater?",
                  "Traditional backups restore data, not business operations",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center flex-shrink-0 text-orange-400 text-xs font-bold">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-2xl p-8"
              style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(0,212,255,0.02) 100%)", border: "1px solid rgba(0,212,255,0.15)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={20} className="text-[#00D4FF]" />
                <span className="text-[#00D4FF] font-semibold text-sm uppercase tracking-wider">The GigitekAI Solution</span>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Disaster-Proof Agentic Cloud
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                We replicate your entire business logic into a sovereign AI vault. If your physical office goes dark, your AI Agents keep processing orders, triaging tickets, and serving clients — automatically.
              </p>
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
                <Clock size={24} className="text-[#00D4FF] flex-shrink-0" />
                <div>
                  <div className="text-[#00D4FF] font-bold text-2xl">&lt; 15 Min</div>
                  <div className="text-gray-400 text-sm">Recovery Time Objective</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 Pillars ── */}
      <section className="py-16 border-t border-white/5">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The Florida Elite Feature Set
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Four pillars that make GigitekAI the only MSP built specifically for Florida's unique risk environment.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl p-7"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-[#00D4FF]"
                  style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}
                >
                  {p.icon}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.title}</h3>
                <p className="text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Florida Sovereign Cloud Map ── */}
      <section className="py-16 border-t border-white/5">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Florida Sovereign Cloud Map
          </h2>
          <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto">
            Your data stays in Tier 4 data centers across the Southeast — low latency, high availability, with out-of-region disaster recovery.
          </p>
          {/* Map visualization */}
          <div
            className="relative rounded-2xl overflow-hidden mb-8"
            style={{ background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.15)", minHeight: "320px" }}
          >
            {/* SVG map of southeastern US */}
            <svg viewBox="0 0 600 400" className="w-full" style={{ maxHeight: "360px" }}>
              {/* Background */}
              <rect width="600" height="400" fill="#0A0E1A" />
              {/* Grid lines */}
              {[...Array(10)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 40} x2="600" y2={i * 40} stroke="rgba(0,212,255,0.05)" strokeWidth="1" />
              ))}
              {[...Array(15)].map((_, i) => (
                <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="400" stroke="rgba(0,212,255,0.05)" strokeWidth="1" />
              ))}
              {/* Simplified Florida outline */}
              <path d="M 200 120 L 350 120 L 380 160 L 370 200 L 340 240 L 320 290 L 290 320 L 270 340 L 250 330 L 240 300 L 250 270 L 230 250 L 210 230 L 200 200 L 195 170 Z" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.2)" strokeWidth="1.5" />
              {/* Georgia outline */}
              <path d="M 200 120 L 350 120 L 360 80 L 300 60 L 220 65 L 200 80 Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              {/* Connection lines between data centers */}
              <line x1="285" y1="290" x2="245" y2="200" stroke="rgba(0,212,255,0.3)" strokeWidth="1.5" strokeDasharray="6,4" />
              <line x1="285" y1="290" x2="320" y2="90" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5" strokeDasharray="6,4" />
              <line x1="245" y1="200" x2="320" y2="90" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" strokeDasharray="6,4" />
              {/* Miami */}
              <circle cx="285" cy="290" r="10" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" strokeWidth="2" />
              <circle cx="285" cy="290" r="18" fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="1" />
              <circle cx="285" cy="290" r="26" fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="1" />
              <text x="305" y="294" fill="#00D4FF" fontSize="12" fontWeight="bold">Miami</text>
              <text x="305" y="308" fill="rgba(0,212,255,0.6)" fontSize="10">Primary • Tier 4</text>
              {/* Tampa */}
              <circle cx="245" cy="200" r="9" fill="rgba(0,238,255,0.2)" stroke="#00EEFF" strokeWidth="2" />
              <circle cx="245" cy="200" r="16" fill="none" stroke="rgba(0,238,255,0.25)" strokeWidth="1" />
              <text x="262" y="204" fill="#00EEFF" fontSize="12" fontWeight="bold">Tampa</text>
              <text x="262" y="218" fill="rgba(0,238,255,0.6)" fontSize="10">Secondary • Tier 4</text>
              {/* Atlanta */}
              <circle cx="320" cy="90" r="9" fill="rgba(124,58,237,0.2)" stroke="#7c3aed" strokeWidth="2" />
              <circle cx="320" cy="90" r="16" fill="none" stroke="rgba(124,58,237,0.25)" strokeWidth="1" />
              <text x="338" y="94" fill="#a78bfa" fontSize="12" fontWeight="bold">Atlanta</text>
              <text x="338" y="108" fill="rgba(167,139,250,0.6)" fontSize="10">Out-of-Region DR</text>
              {/* Legend */}
              <rect x="20" y="340" width="12" height="12" rx="2" fill="#00D4FF" />
              <text x="38" y="351" fill="rgba(255,255,255,0.6)" fontSize="11">Primary / Secondary</text>
              <rect x="160" y="340" width="12" height="12" rx="2" fill="#7c3aed" />
              <text x="178" y="351" fill="rgba(255,255,255,0.6)" fontSize="11">Out-of-Region DR</text>
            </svg>
          </div>
          {/* Data center cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {DATA_CENTERS.map((dc) => (
              <div
                key={dc.city}
                className="rounded-xl p-5 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${dc.color}30` }}
              >
                <Server size={24} className="mx-auto mb-3" style={{ color: dc.color }} />
                <div className="text-xl font-bold mb-1" style={{ color: dc.color }}>{dc.city}</div>
                <div className="text-gray-400 text-sm mb-1">{dc.role}</div>
                <div
                  className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ background: `${dc.color}15`, color: dc.color }}
                >
                  {dc.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="py-16 border-t border-white/5">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            GigitekAI vs. Standard Florida MSP
          </h2>
          <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto">
            See how we stack up against the legacy MSPs still "fixing servers" while your business needs to survive a hurricane.
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,212,255,0.15)" }}>
            {/* Header */}
            <div className="grid grid-cols-3 text-sm font-bold uppercase tracking-wider" style={{ background: "rgba(0,212,255,0.08)" }}>
              <div className="p-4 text-gray-400">Metric</div>
              <div className="p-4 text-gray-400 text-center border-x border-white/5">Standard FL MSP</div>
              <div className="p-4 text-[#00D4FF] text-center">GigitekAI Elite</div>
            </div>
            {COMPARISON_DATA.map((row, i) => (
              <div
                key={row.metric}
                className="grid grid-cols-3 text-sm"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
              >
                <div className="p-4 text-gray-300 font-medium">{row.metric}</div>
                <div className="p-4 text-gray-500 text-center border-x border-white/5">{row.standard}</div>
                <div className="p-4 text-center">
                  <span
                    className="inline-flex items-center gap-1.5 font-semibold"
                    style={{ color: "#00D4FF" }}
                  >
                    <CheckCircle size={14} />
                    {row.elite}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Free Audit Checklist Download ── */}
      <section className="py-16 border-t border-white/5 bg-gradient-to-r from-[#0D1528] to-[#0F1629]">
        <div className="container max-w-3xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Get Your Free IT Resiliency Audit Checklist
              </h3>
              <p className="text-gray-300 mb-4">
                10-point assessment covering backup, DRP, cloud infrastructure, security, compliance, and hurricane preparedness. Score yourself and identify critical gaps.
              </p>
              <ul className="space-y-2 text-gray-400 text-sm mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#00D4FF] flex-shrink-0" />
                  <span>Disaster Recovery readiness assessment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#00D4FF] flex-shrink-0" />
                  <span>FIPA compliance checklist</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#00D4FF] flex-shrink-0" />
                  <span>Hurricane season preparation guide</span>
                </li>
              </ul>
              <a
                href="/manus-storage/florida-it-audit-checklist_b6957c2d.pdf"
                download
                className="inline-flex items-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-6 py-3 rounded-lg font-bold hover:bg-[#00D4FF]/90 transition-colors"
              >
                Download PDF (Free) <ArrowRight size={18} />
              </a>
            </div>
            <div className="flex-shrink-0 w-32 h-40 bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 rounded-lg border border-[#00D4FF]/30 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#00D4FF] mb-1">10</div>
                <div className="text-xs text-gray-400">Point Assessment</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 border-t border-white/5">
        <div className="container max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to Florida-Harden Your Business?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Join Florida SMBs in healthcare, legal, construction, and fintech who trust GigitekAI to keep their operations running — no matter what the weather brings.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="btn-cyan text-base px-8 py-3">
              Start Your Free Assessment <ArrowRight size={18} />
            </Link>
            <Link href="/switch-program" className="btn-outline-cyan text-base px-8 py-3">
              The 60-Day Switch Guarantee
            </Link>
          </div>
        </div>
      </section>

      {/* ── Related Reading ── */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Related Reading
          </h3>
          <a
            href="/blog/hurricane-it-disaster-recovery-florida-business-guide"
            className="block p-6 bg-gradient-to-r from-[#0D1528] to-[#0F1629] border border-[#00D4FF]/20 rounded-xl hover:border-[#00D4FF]/40 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white group-hover:text-[#00D4FF] transition-colors mb-2">
                  Hurricane IT Preparedness: A Florida Business Owner's Complete Disaster Recovery Guide
                </h4>
                <p className="text-gray-400 text-sm mb-3">
                  Hurricane season starts June 1st. If your IT recovery plan depends on a physical server in your office, you're not prepared. Here's the complete BCDR checklist every Florida business needs.
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[#00D4FF] bg-[#00D4FF]/10 px-2.5 py-1 rounded">9 min read</span>
                  <span className="text-xs text-gray-500">Business Continuity & BCDR</span>
                </div>
              </div>
              <ArrowRight size={20} className="text-[#00D4FF] flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>
      </section>

      {/* ── Sticky Bottom CTA Bar ── */}
      {showSticky && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-6 py-4"
          style={{
            background: "linear-gradient(90deg, #0A0E1A 0%, #0F1629 100%)",
            borderTop: "1px solid rgba(0,212,255,0.3)",
            boxShadow: "0 -4px 24px rgba(0,212,255,0.15)",
          }}
        >
          <div className="hidden sm:flex items-center gap-3">
            <ClipboardList size={20} className="text-[#00D4FF] shrink-0" />
            <span className="text-sm font-medium text-gray-200">
              Is your Florida business hurricane-ready? Get a free IT audit.
            </span>
          </div>
          <a
            href="/switch-program#audit-form"
            className="shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-black transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #00EEFF 100%)",
              boxShadow: "0 0 20px rgba(0,212,255,0.4)",
            }}
          >
            Get My Free IT Audit <ArrowRight size={16} />
          </a>
        </div>
      )}

      <Footer />
    </div>
  );
}
