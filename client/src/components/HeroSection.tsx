/*
  GigitekAI Hero Section — Deloitte-Inspired Professional Design
  - Clean, spacious layout with proper breathing room
  - Professional font sizes (not oversized)
  - Proper container usage with padding
  - Minimal, elegant design
*/

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="pt-24 pb-28 lg:pt-32 lg:pb-36 bg-[#0A0E1A] relative overflow-hidden"
    >
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00D4FF]/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div
            className={`transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Label */}
            <div className="mb-6">
              <span className="text-[#00D4FF] font-semibold text-sm tracking-[0.2em] uppercase">
                Next-Gen Cloud & AI Solutions
              </span>
            </div>

            {/* Main headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.15] mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Intelligent Cloud & AI Solutions
            </h1>

            {/* Subheading */}
            <p className="text-lg lg:text-xl text-gray-400 leading-relaxed mb-10 max-w-xl">
              We architect enterprise-grade cloud infrastructure and AI systems that transform how businesses operate, innovate, and scale.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a href="/contact" className="btn-cyan px-8 py-4 text-base font-semibold rounded-lg inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                Start Your Transformation
                <ArrowRight size={18} />
              </a>
              <a href="/contact" className="px-8 py-4 text-base font-semibold rounded-lg border border-gray-600 text-white hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors inline-flex items-center justify-center gap-2">
                Book a Free Demo
                <ArrowRight size={18} />
              </a>
            </div>

            {/* Contact info */}
            <div className="flex flex-col sm:flex-row gap-8 pt-8 border-t border-gray-800">
              <a href="tel:+17273825776" className="flex items-center gap-3 text-gray-400 hover:text-[#00D4FF] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">(727) 382-5776</div>
                  <div className="text-xs text-gray-500">Available 24/7</div>
                </div>
              </a>
              <a href="mailto:support@gigitekai.com" className="flex items-center gap-3 text-gray-400 hover:text-[#00D4FF] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">support@gigitekai.com</div>
                  <div className="text-xs text-gray-500">Response in 1 hour</div>
                </div>
              </a>
            </div>
          </div>

          {/* Right side - System Status */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="bg-[#0F1629] rounded-2xl p-8 lg:p-10 border border-[rgba(0,212,255,0.08)]">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>System Status</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-green-400">All Systems Operational</span>
                </div>
              </div>

              {/* Status items */}
              <div className="space-y-5 mb-8">
                {[
                  { label: "Cloud Infrastructure", status: "99.9% Uptime" },
                  { label: "AI Services", status: "Fully Operational" },
                  { label: "Support Team", status: "24/7 Available" },
                  { label: "Security", status: "SOC 2 Compliant" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-[#00D4FF] flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-300">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#00D4FF]">{item.status}</span>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="pt-6 border-t border-gray-700/50">
                <p className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">Trusted by Enterprise Leaders</p>
                <div className="flex flex-wrap gap-3">
                  {["AWS", "Azure", "GCP", "M365"].map((badge) => (
                    <div key={badge} className="px-4 py-2 bg-[#0A0E1A] border border-gray-700 rounded-md text-xs font-semibold text-white">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-700/50">
                <div>
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-xs text-gray-500">Enterprise Clients</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">280h</div>
                  <div className="text-xs text-gray-500">Hours Saved Monthly</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
