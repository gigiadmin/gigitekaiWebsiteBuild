/*
  GigitekAI Stats Section — Deloitte-Style Professional Design
  - Professional metrics display with animations
  - +25% larger font sizes for better hierarchy
  - Massive whitespace and professional spacing
  - Clean minimal design
*/
import { useEffect, useRef, useState } from "react";
import { Star, Shield, Award, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";

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
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-40 lg:py-56 bg-white dark:bg-[#0A0E1A]" ref={ref}>
      <div className="container">
        {/* Header - +25% larger */}
        <div
          className={`text-center mb-24 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2
            className="text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            You Deserve Expert Cloud & AI Strategy
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Numbers that reflect our commitment to delivering measurable results for every client we serve.
          </p>
        </div>

        {/* Stat cards - Professional grid with generous spacing */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`relative bg-white dark:bg-[#0F1629] rounded-xl p-10 text-center border border-gray-200 dark:border-[rgba(0,212,255,0.15)] hover:border-gray-300 dark:hover:border-[rgba(0,212,255,0.3)] hover:shadow-lg transition-all duration-300 group ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Content */}
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mx-auto mb-6 group-hover:border-[#00D4FF]/50 transition-all duration-300">
                    <Icon size={28} className="text-[#00D4FF]" />
                  </div>
                  <div
                    className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#00D4FF] transition-colors duration-300"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    <StatNumber target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="w-8 h-1 bg-gradient-to-r from-[#00D4FF]/0 via-[#00D4FF] to-[#00D4FF]/0 mx-auto mb-6" />
                  <p className="text-gray-900 dark:text-white text-base font-semibold leading-snug mb-2">{stat.label}</p>
                  <p className="text-gray-600 dark:text-gray-500 text-sm">{stat.sublabel}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Social proof bar - Clean and minimal */}
        <div
          className={`flex flex-col md:flex-row items-center justify-between gap-8 rounded-xl border border-gray-200 dark:border-[rgba(0,212,255,0.2)] bg-gray-50 dark:bg-[#0F1629] px-12 py-10 mb-32 transition-all duration-700 delay-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            {trustBadges.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold border transition-all duration-300 hover:scale-105"
                style={{ color: badge.color, borderColor: `${badge.color}33`, backgroundColor: `${badge.color}10` }}
              >
                <Award size={16} />
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32">
          <div
            className={`text-center mb-24 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label justify-center mb-8">HOW IT WORKS</div>
            <h2
              className="text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Discover New Capabilities with GigitekAI
            </h2>
          </div>

          {/* Process steps grid - +25% larger */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Assess & Strategize", desc: "We begin with a comprehensive audit of your current infrastructure and business goals to build a tailored cloud and AI roadmap." },
              { num: "02", title: "Design & Architect", desc: "Our engineers design scalable, secure cloud architectures and AI pipelines optimized for your specific workloads and compliance requirements." },
              { num: "03", title: "Deploy & Integrate", desc: "Seamless migration and deployment with zero-downtime strategies, ensuring your business continues operating throughout the transition." },
              { num: "04", title: "Monitor & Optimize", desc: "Continuous 24/7 monitoring, cost optimization, and performance tuning to ensure your cloud and AI investments deliver maximum ROI." },
              { num: "05", title: "Protect & Secure", desc: "Enterprise-grade cybersecurity woven into every layer of your cloud environment, with real-time threat detection and automated response." },
              { num: "06", title: "Scale & Innovate", desc: "As your business grows, we scale your infrastructure and introduce new AI capabilities to keep you ahead of the competition." },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`flex gap-6 p-8 rounded-lg border border-gray-200 dark:border-[rgba(0,212,255,0.15)] bg-white dark:bg-[#0F1629] hover:border-gray-300 dark:hover:border-[rgba(0,212,255,0.3)] hover:shadow-md transition-all duration-300 group ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${400 + i * 80}ms` }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="text-4xl font-bold text-gray-300 dark:text-[#00D4FF]/40 group-hover:text-gray-400 dark:group-hover:text-[#00D4FF]/60 transition-colors duration-300 leading-none"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {step.num}
                  </div>
                </div>
                <div className="flex-1">
                  <h3
                    className="text-gray-900 dark:text-white font-bold text-lg mb-3 group-hover:text-[#00D4FF] transition-colors duration-300"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
