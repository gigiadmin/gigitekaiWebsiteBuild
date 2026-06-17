/*
  GigitekAI Hero Section — Static background image
  - Shows a prominent "Click Contact Us" button on mobile (navigates to /contact)
  - Video moved to AI Live Demo section for better performance
*/

import { useEffect, useState } from "react";
import { ArrowRight, Calendar } from "lucide-react";
// PERF: Import hero images as Vite assets — served from /assets/ with content hash.
// This bypasses the /manus-storage/ proxy which adds a 307 redirect through Cloudflare edge,
// adding ~1-3s latency to LCP. Static /assets/ files are served directly with immutable cache.
import heroBgDesktop from "@/assets/hero-bg-desktop.webp";
import heroBgMobile from "@/assets/hero-bg-mobile.webp";

// Optimized hero background — Vite asset imports (bypasses /manus-storage/ proxy)
// Desktop: 46KB | Mobile: 34KB — served directly from /assets/ with immutable cache
const HERO_BG_DESKTOP = heroBgDesktop;
const HERO_BG_MOBILE = heroBgMobile;

export default function HeroSection() {
  const [visible, setVisible] = useState(false);

  // Fade-in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section data-hero-mounted="" className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[#0A0E1A]">

      {/* ── Background layer ── */}
      <div className="absolute inset-0 z-0">
        {/* LCP element: img tag with fetchpriority=high for fastest Largest Contentful Paint */}
        <img
          src={HERO_BG_DESKTOP}
          srcSet={`${HERO_BG_MOBILE} 768w, ${HERO_BG_DESKTOP} 1920w`}
          sizes="(max-width: 768px) 768px, 1920px"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgba(10,14,26,0.97) 0%, rgba(10,14,26,0.75) 60%, rgba(10,14,26,0.4) 100%)`,
            zIndex: 1,
          }}
        />
      </div>

      {/* ── Gradient overlays ── */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: "linear-gradient(to right, rgba(10,14,26,0.88) 0%, rgba(10,14,26,0.60) 40%, rgba(10,14,26,0.30) 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[1]"
        style={{ background: "linear-gradient(to top, rgba(10,14,26,1) 0%, transparent 100%)" }}
      />

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 z-[2]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Main content ── */}
      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">

          {/* Label */}
          <div className="section-label mb-6">
            SECURITY-FIRST MANAGED IT FOR TAMPA BAY
          </div>

          {/* Headline — visible immediately (no fade-in) to make it the LCP element */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Managed IT +{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #00D4FF, #00EEFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Governed AI
            </span>
            <br />
            for Tampa Bay SMBs
          </h1>

          {/* Subtitle */}
          <p
            className={`text-lg md:text-xl text-gray-300 max-w-xl mb-10 leading-relaxed transition-[opacity,transform] duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Security-first managed IT with AI done safely. We help healthcare, legal, and construction firms reduce risk, ensure compliance, and automate operations—without the complexity.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-wrap gap-4 mb-6 transition-[opacity,transform] duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a href="/contact" className="btn-cyan text-base px-6 py-3">
              Get Started in Tampa Bay
              <ArrowRight size={18} />
            </a>
            <a
              href="/contact"
              className="flex items-center gap-2 text-base px-6 py-3 rounded-lg font-semibold transition-[opacity,transform] duration-200"
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1.5px solid rgba(0,212,255,0.45)",
                color: "#00D4FF",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,212,255,0.18)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,212,255,0.08)";
              }}
            >
              <Calendar size={18} />
              Schedule Free Audit
            </a>
            <a href="#services" className="btn-outline-cyan text-base px-6 py-3">
              See Our Services
            </a>
          </div>

          {/* Quick contact info */}
          <div
            className={`flex flex-wrap items-center gap-4 text-sm mb-6 transition-[opacity,transform] duration-700 delay-[350ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a
              href="tel:+1727-382-6909"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              (727) 382-6909
            </a>
            <span className="text-gray-300 hidden sm:block">|</span>
            <a
              href="mailto:support@gigitekai.com"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              support@gigitekai.com
            </a>
          </div>

          {/* Stats row */}
          <div
            className={`flex flex-wrap gap-8 transition-[opacity,transform] duration-700 delay-[400ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div>
              <div className="text-3xl font-bold text-[#00D4FF]">30+</div>
              <div className="text-sm text-gray-200">Clients Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00D4FF]">99.9%</div>
              <div className="text-sm text-gray-200">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00D4FF]">24/7</div>
              <div className="text-sm text-gray-200">Local Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
