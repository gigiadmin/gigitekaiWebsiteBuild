/*
  GigitekAI Stats Section — Professional Enterprise Layout
  Full-width centering, social proof, Fortune 100 quality
*/

import { useEffect, useRef, useState } from "react";
import { TrendingUp, Users, Shield, Clock } from "lucide-react";

const stats = [
  { icon: TrendingUp, value: 10, suffix: "+", label: "Years of Enterprise IT", sublabel: "Founder's hands-on experience" },
  { icon: Users, value: 50, suffix: "+", label: "Businesses Transformed", sublabel: "Across North America & Canada" },
  { icon: Shield, value: 99.9, suffix: "%", label: "Managed Uptime SLA", sublabel: "Guaranteed availability" },
  { icon: Clock, value: 48, suffix: "hr", label: "Avg. Client Onboarding", sublabel: "From contract to live" },
];

const trustBadges = [
  { label: "Microsoft Partner", color: "#00A4EF" },
  { label: "NIST Framework", color: "#00D4FF" },
  { label: "Zero Trust Ready", color: "#7C3AED" },
  { label: "ITIL Aligned", color: "#059669" },
];

const formatValue = (value: number, target: number) => {
  if (value >= target) return target % 1 !== 0 ? target.toFixed(2) : target.toString();
  return value % 1 !== 0 ? value.toFixed(2) : Math.floor(value).toString();
};

function StatNumber({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          setDisplayValue(0);
          const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
              setDisplayValue(target);
              clearInterval(interval);
            } else {
              setDisplayValue(target % 1 !== 0 ? Math.round(current * 100) / 100 : Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {formatValue(displayValue, target)}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative w-full bg-[#0A0E1A] py-20 sm:py-32 lg:py-40" ref={ref}>
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full" style={{ padding: '0 1.5rem' }}>
        <div style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Header */}
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Why Choose GigitekAI
              </span>
            </div>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 max-w-3xl mx-auto"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Proven Results. Enterprise Trust.
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Our track record speaks for itself. We've helped 50+ enterprises transform their cloud and AI infrastructure.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className={`text-center transition-all duration-700 ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="flex justify-center mb-4">
                    <Icon size={32} className="text-[#00D4FF]" />
                  </div>
                  <div className="text-4xl sm:text-5xl font-bold text-[#00D4FF] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <StatNumber target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="font-semibold text-white mb-1">{stat.label}</p>
                  <p className="text-sm text-gray-400">{stat.sublabel}</p>
                </div>
              );
            })}
          </div>

          {/* Trust badges */}
          <div
            className={`flex flex-wrap justify-center gap-4 py-12 border-t border-b border-[#00D4FF]/20 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {trustBadges.map((badge, i) => (
              <div
                key={i}
                className="px-6 py-3 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/5 hover:bg-[#00D4FF]/10 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-300">{badge.label}</span>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div
            className={`mt-16 text-center transition-all duration-700 delay-400 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h3 className="text-3xl font-bold text-white mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              How We Deliver Results
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Assess", desc: "We evaluate your current infrastructure and business goals" },
                { step: "2", title: "Design", desc: "We architect a custom cloud and AI strategy for your needs" },
                { step: "3", title: "Deploy", desc: "We implement and optimize your solution with 24/7 support" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl border border-[#00D4FF]/20 bg-[#0F1629]/50 hover:bg-[#0F1629]/80 transition-colors">
                  <div className="text-4xl font-bold text-[#00D4FF] mb-3">{item.step}</div>
                  <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
