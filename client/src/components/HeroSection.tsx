/*
  GigitekAI Hero Section — Deloitte-Style Professional Design
  - Massive whitespace and breathing room
  - +25% larger font sizes for commanding presence
  - Clean, minimal layout with professional simplicity
  - Clear typography hierarchy
  - Professional spacing ratios
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
      className="py-40 lg:py-56 bg-white dark:bg-[#0A0E1A] relative overflow-hidden"
    >
      {/* Subtle background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-32 items-center">
          {/* Left content */}
          <div
            className={`transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            {/* Label */}
            <div className="mb-12">
              <span className="text-[#00D4FF] font-semibold text-xl tracking-widest uppercase">
                Next-Gen Cloud & AI
              </span>
            </div>

            {/* Main headline - +25% larger (7xl to 8xl) */}
            <h1
              className="text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white leading-tight mb-12"
              style={{ fontFamily: "'Space Grotesk', sans-serif", lineHeight: '1.1' }}
            >
              Intelligent Cloud & AI Solutions
            </h1>

            {/* Subheading - +25% larger */}
            <p className="text-2xl lg:text-3xl text-gray-600 dark:text-gray-300 leading-relaxed mb-16 max-w-2xl font-light">
              We architect enterprise-grade cloud infrastructure and AI systems that transform how businesses operate, innovate, and scale.
            </p>

            {/* CTA Buttons - Professional spacing */}
            <div className="flex flex-col sm:flex-row gap-8 mb-20">
              <button className="btn-cyan px-12 py-5 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 inline-flex items-center justify-center gap-3">
                Start Your Transformation
                <ArrowRight size={24} />
              </button>
              <button className="px-12 py-5 text-lg font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-[#00D4FF] hover:text-[#00D4FF] transition-all duration-200 inline-flex items-center justify-center gap-3">
                Book a Free Demo
                <ArrowRight size={24} />
              </button>
            </div>

            {/* Contact info - Professional spacing */}
            <div className="flex flex-col sm:flex-row gap-12 pt-12 border-t border-gray-200 dark:border-gray-800">
              <a href="tel:+17273825776" className="flex items-center gap-4 text-gray-600 dark:text-gray-400 hover:text-[#00D4FF] transition-colors group">
                <div className="w-14 h-14 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center group-hover:border-[#00D4FF]/50 transition-all flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">(727) 382-5776</div>
                  <div className="text-sm text-gray-500">Available 24/7</div>
                </div>
              </a>
              <a href="mailto:support@gigitekai.com" className="flex items-center gap-4 text-gray-600 dark:text-gray-400 hover:text-[#00D4FF] transition-colors group">
                <div className="w-14 h-14 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center group-hover:border-[#00D4FF]/50 transition-all flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">support@gigitekai.com</div>
                  <div className="text-sm text-gray-500">Response in 1 hour</div>
                </div>
              </a>
            </div>
          </div>

          {/* Right side - Status dashboard */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            {/* System Status Card - Clean and minimal */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0F1629] dark:to-[#141B2D] rounded-2xl p-16 border border-gray-200 dark:border-[rgba(0,212,255,0.1)]">
              <div className="mb-12">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">System Status</h3>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-base font-semibold text-green-600 dark:text-green-400">All Systems Operational</span>
                </div>
              </div>

              {/* Status items - +25% larger */}
              <div className="space-y-8 mb-12">
                {[
                  { label: "Cloud Infrastructure", status: "99.9% Uptime" },
                  { label: "AI Services", status: "Fully Operational" },
                  { label: "Support Team", status: "24/7 Available" },
                  { label: "Security", status: "SOC 2 Compliant" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle2 size={24} className="text-[#00D4FF] flex-shrink-0" />
                      <span className="text-lg font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                    </div>
                    <span className="text-base font-semibold text-[#00D4FF]">{item.status}</span>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="pt-12 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-6 uppercase tracking-wide">Trusted by Enterprise Leaders</p>
                <div className="flex flex-wrap gap-4">
                  {["AWS", "Azure", "GCP", "M365"].map((badge) => (
                    <div key={badge} className="px-6 py-3 bg-white dark:bg-[#0A0E1A] border border-gray-300 dark:border-gray-700 rounded-lg text-base font-semibold text-gray-900 dark:text-white">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-8 mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">50+</div>
                  <div className="text-base text-gray-600 dark:text-gray-400">Enterprise Clients</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">280h</div>
                  <div className="text-base text-gray-600 dark:text-gray-400">Hours Saved Monthly</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
