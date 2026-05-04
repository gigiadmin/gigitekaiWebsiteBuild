/*
  GigitekAI Hero Section — Professional Enterprise Layout
  Full-width centered, no placeholder boxes, Fortune 100 quality
  Colors: Deep navy (#0A0E1A) + Electric cyan (#00D4FF)
  Typography: Space Grotesk (display) + DM Sans (body)
*/

import { ArrowRight, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative w-full bg-[#0A0E1A] overflow-hidden">
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A]/40 via-transparent to-[#0A0E1A]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content - centered with explicit padding */}
      <div
        className="relative z-10 w-full"
        style={{ padding: "8rem 2rem 6rem 2rem" }}
      >
        <div style={{ maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }}>
          {/* Center-aligned hero content */}
          <div className="text-center max-w-4xl mx-auto">
            {/* Section label */}
            <div
              className={`inline-flex items-center gap-2 mb-8 transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
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
              className={`text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight tracking-tight text-white mb-8 transition-all duration-700 delay-100 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Intelligent Cloud & AI{" "}
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
            <p
              className={`text-lg sm:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-2xl mx-auto mb-12 transition-all duration-700 delay-200 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              We architect enterprise-grade cloud infrastructure and AI systems that transform how businesses operate, innovate, and scale.
            </p>

            {/* CTA buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-700 delay-300 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#00D4FF] text-[#0A0E1A] font-semibold rounded-lg hover:bg-[#00E5CC] transition-colors duration-200 text-lg"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Start Your Transformation
                <ArrowRight size={20} />
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#00D4FF] text-[#00D4FF] font-semibold rounded-lg hover:bg-[#00D4FF]/10 transition-colors duration-200 text-lg"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Calendar size={20} />
                Book a Free Demo
              </a>
            </div>

            {/* Contact info */}
            <div
              className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 transition-all duration-700 delay-400 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
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

            {/* Trust badges - centered */}
            <div
              className={`grid grid-cols-3 gap-8 max-w-lg mx-auto pt-12 border-t border-[#00D4FF]/20 transition-all duration-700 delay-500 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[#00D4FF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>50+</div>
                <div className="text-sm text-gray-400">Enterprise Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[#00D4FF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>99.9%</div>
                <div className="text-sm text-gray-400">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[#00D4FF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>24/7</div>
                <div className="text-sm text-gray-400">AI Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
