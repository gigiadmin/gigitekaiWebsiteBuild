/*
  GigitekAI Hero Section — Professional Enterprise Layout
  Proper full-width centering, Fortune 100 quality
  Colors: Deep navy (#0A0E1A) + Electric cyan (#00D4FF)
  Typography: Space Grotesk (display) + DM Sans (body)
*/

import { ArrowRight, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

const HERO_BG = "";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center bg-[#0A0E1A] overflow-hidden">
      {/* Background image */}
      {HERO_BG && (
        <img
          src={HERO_BG}
          alt="GigitekAI cloud and AI solutions"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/80 to-[#0A0E1A]/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A]/40 via-transparent to-[#0A0E1A]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content - properly centered */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl">
          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column - text content */}
            <div
              className={`flex flex-col justify-center space-y-8 transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              {/* Section label */}
              <div className="inline-flex items-center gap-2 w-fit">
                <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />
                <span
                  className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Next-Gen Cloud & AI Solutions
                </span>
              </div>

              {/* Main headline */}
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Intelligent
                <br />
                Cloud & AI
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #00D4FF, #00EEFF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Solutions
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-lg">
                We architect enterprise-grade cloud infrastructure and AI systems that transform how businesses operate, innovate, and scale.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#00D4FF] text-[#0A0E1A] font-semibold rounded-lg hover:bg-[#00E5CC] transition-colors duration-200"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Start Your Transformation
                  <ArrowRight size={20} />
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#00D4FF] text-[#00D4FF] font-semibold rounded-lg hover:bg-[#00D4FF]/10 transition-colors duration-200"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Calendar size={20} />
                  Book a Free Demo
                </a>
              </div>

              {/* Contact info */}
              <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t border-[#00D4FF]/20">
                <a
                  href="tel:+17273825776"
                  className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  (727) 382-5776
                </a>
                <span className="text-gray-600 hidden sm:block">|</span>
                <a
                  href="mailto:support@gigitekai.com"
                  className="flex items-center gap-2 text-gray-300 hover:text-[#00D4FF] transition-colors font-medium"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  support@gigitekai.com
                </a>
              </div>
            </div>

            {/* Right column - visual element */}
            <div
              className={`relative hidden lg:flex items-center justify-center transition-all duration-700 delay-200 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="relative w-full aspect-square max-w-md">
                {/* Animated background shapes */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 rounded-2xl blur-3xl" />
                <div className="absolute inset-0 border border-[#00D4FF]/30 rounded-2xl" />

                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-[#00D4FF] mb-4">⚡</div>
                    <p className="text-lg font-semibold text-white mb-2">AI-First MSP</p>
                    <p className="text-sm text-gray-400">Enterprise Solutions at MSP Speed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges - centered */}
          <div
            className={`mt-20 pt-16 border-t border-[#00D4FF]/20 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="grid grid-cols-3 gap-8 max-w-md">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#00D4FF] mb-2">50+</div>
                <div className="text-sm text-gray-400">Enterprise Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#00D4FF] mb-2">99.9%</div>
                <div className="text-sm text-gray-400">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#00D4FF] mb-2">24/7</div>
                <div className="text-sm text-gray-400">AI Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
