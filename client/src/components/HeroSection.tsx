/*
  GigitekAI Hero Section — Static background image
  - Shows a prominent "Click Contact Us" button on mobile (navigates to /contact)
  - Video moved to AI Live Demo section for better performance
*/

import { useEffect, useState } from "react";
import { ArrowRight, Bot, LifeBuoy } from "lucide-react";
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
    <section data-hero-mounted="" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-[#0A0E1A] sm:min-h-[82vh]">

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
          className="absolute inset-0 h-full w-full object-cover object-[62%_center] sm:object-center"
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
      <div className="container relative z-10 pb-16 pt-28 sm:py-32">
        <div className="max-w-3xl">

          {/* Label */}
          <div className="section-label mb-5 text-[10px] sm:mb-6">
            MANAGED IT + GOVERNED AI FOR TAMPA BAY
          </div>

          {/* Headline — visible immediately (no fade-in) to make it the LCP element */}
          <h1
            className="mb-6 text-[2.65rem] font-bold leading-[0.98] text-white sm:text-6xl sm:leading-[1.05] lg:text-7xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Managed IT + Governed AI,{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #00D4FF, #00EEFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              without the complexity.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`mb-8 max-w-xl text-base leading-7 text-gray-300 transition-[opacity,transform] delay-200 duration-700 sm:mb-10 sm:text-xl sm:leading-relaxed ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Build a more secure, efficient technology foundation with Microsoft 365 expertise, practical AI automation, and managed support that scales with your business.
          </p>

          {/* CTA Buttons */}
          <div
            className={`mb-6 flex flex-col gap-3 transition-[opacity,transform] delay-300 duration-700 sm:flex-row sm:gap-4 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a href="/free-audit" className="btn-cyan w-full justify-center px-6 py-3 text-base sm:w-auto">
              Start Your IT Assessment
              <ArrowRight size={18} />
            </a>
            <a
              href="/services/ai"
              className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-[opacity,transform] duration-200 sm:w-auto"
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
              Explore AI Automation
            </a>
          </div>

          <div className="mb-7 grid grid-cols-2 gap-3 sm:hidden">
            <a
              href="/ai-demo"
              className="flex min-h-[76px] flex-col justify-between border border-[#00D4FF]/35 bg-[#07111F]/85 p-4 text-left text-sm font-semibold text-white transition-colors active:bg-[#00D4FF]/10"
            >
              <Bot className="h-5 w-5 text-[#00D4FF]" aria-hidden="true" />
              <span>Watch AI Work Live</span>
            </a>
            <a
              href="/helpdesk"
              className="flex min-h-[76px] flex-col justify-between border border-white/15 bg-[#07111F]/85 p-4 text-left text-sm font-semibold text-white transition-colors active:border-[#00D4FF]/50"
            >
              <LifeBuoy className="h-5 w-5 text-[#00D4FF]" aria-hidden="true" />
              <span>Client Support</span>
            </a>
          </div>

          {/* Quiet client access paths */}
          <div
            className={`mb-6 hidden flex-wrap items-center gap-4 text-sm transition-[opacity,transform] delay-[350ms] duration-700 sm:flex ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a
              href="tel:+1727-382-6909"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Speak with GigitekAI
            </a>
            <span className="text-gray-300 hidden sm:block">|</span>
            <a
              href="mailto:support@gigitekai.com"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Existing client support
            </a>
          </div>

          {/* Operating signals */}
          <div
            className={`grid grid-cols-3 gap-3 border-t border-white/10 pt-5 transition-[opacity,transform] delay-[400ms] duration-700 sm:flex sm:flex-wrap sm:gap-8 sm:border-0 sm:pt-0 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div>
              <div className="text-[10px] font-semibold tracking-[0.12em] text-[#00D4FF] sm:text-sm">SECURE</div>
              <div className="mt-1 text-xs text-gray-200 sm:text-sm">Zero Trust mindset</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-[0.12em] text-[#00D4FF] sm:text-sm">GOVERNED</div>
              <div className="mt-1 text-xs text-gray-200 sm:text-sm">AI built for control</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-[0.12em] text-[#00D4FF] sm:text-sm">ACCOUNTABLE</div>
              <div className="mt-1 text-xs text-gray-200 sm:text-sm">Human expertise, always</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
