/*
  GigitekAI Stats Section — "You Deserve Expert Cloud & AI Strategy"
  White background, 4 animated stat counters
  Mirrors appliedtech.us stats section
*/

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 20, suffix: "+", label: "Years delivering enterprise cloud and AI solutions" },
  { value: 150, suffix: "+", label: "Businesses transformed across North America" },
  { value: 99.99, suffix: "%", label: "Average uptime across managed cloud environments" },
  { value: 48, suffix: "hr", label: "Average onboarding time for new clients" },
];

// Ensure final value is always shown correctly
const formatValue = (value: number, target: number) => {
  if (value >= target) return target % 1 !== 0 ? target.toFixed(1) : target.toString();
  return value % 1 !== 0 ? value.toFixed(1) : Math.floor(value).toString();
};

function AnimatedCounter({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const isDecimal = target % 1 !== 0;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(isDecimal ? Math.round(current * 10) / 10 : Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, target, duration]);

  return (
    <span ref={ref}>
      {formatValue(count, target)}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
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
    <section className="py-20 bg-white dark:bg-[#0A0E1A]" ref={ref}>
      <div className="container">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            You Deserve Expert Cloud & AI Strategy
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Numbers that reflect our commitment to delivering measurable results for every client we serve.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`bg-gray-50 dark:bg-[#141B2D] rounded-2xl p-8 text-center border border-gray-100 dark:border-[rgba(0,212,255,0.15)] hover:border-[#00D4FF]/30 hover:shadow-lg transition-all duration-300 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className="text-5xl font-bold text-gray-900 dark:text-white mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="w-8 h-0.5 bg-[#00D4FF] mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-20">
          <div
            className={`text-center mb-12 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label justify-center">How It Works</div>
            <h2
              className="text-4xl font-bold text-gray-900 dark:text-white mt-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Discover New Capabilities with GigitekAI
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className={`flex gap-4 p-6 rounded-xl border border-gray-100 dark:border-[rgba(0,212,255,0.15)] hover:border-[#00D4FF]/30 hover:bg-gray-50 dark:hover:bg-[#141B2D] transition-all duration-300 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${400 + i * 80}ms` }}
              >
                <div
                  className="text-3xl font-bold text-[#00D4FF]/30 flex-shrink-0 leading-none"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {step.num}
                </div>
                <div>
                  <h3
                    className="text-gray-900 dark:text-white font-bold mb-2"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
