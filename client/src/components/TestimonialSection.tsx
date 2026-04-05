/*
  GigitekAI Testimonial Section — Dark background, quote + person
  Mirrors appliedtech.us testimonial section
*/

import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "GigitekAI transformed our entire cloud infrastructure in under 90 days. Their AI-driven monitoring caught and resolved issues before they ever impacted our customers. It's not just a vendor relationship — they're a true technology partner.",
    name: "Sarah Chen",
    title: "CTO, NovaBridge Financial",
    initials: "SC",
  },
  {
    quote: "We went from a fragmented, on-premise setup to a fully managed multi-cloud environment with AI analytics. Our operational costs dropped 35% in the first year. GigitekAI delivered exactly what they promised.",
    name: "Marcus Williams",
    title: "VP of Technology, HealthPath Systems",
    initials: "MW",
  },
  {
    quote: "The AI automation GigitekAI implemented eliminated 60% of our manual data processing tasks. Our team now focuses on strategy instead of firefighting. The ROI was evident within the first quarter.",
    name: "Priya Sharma",
    title: "Director of Operations, LogiCore Inc.",
    initials: "PS",
  },
];

export default function TestimonialSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const t = testimonials[active];

  return (
    <section
      className="py-20 relative overflow-hidden bg-gray-100 dark:bg-[#0A0E1A]"
      ref={ref}
    >
      {/* Background accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,212,255,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="container relative z-10">
        <div
          className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Quote icon */}
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
              <Quote size={24} className="text-[#00D4FF]" />
            </div>
          </div>

          {/* Quote text */}
          <blockquote
            key={active}
            className="text-xl md:text-2xl text-gray-900 dark:text-white font-medium leading-relaxed mb-8 fade-in-up"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            "{t.quote}"
          </blockquote>

          {/* Person */}
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF] font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t.initials}
            </div>
            <div className="text-left">
              <p className="text-gray-900 dark:text-white font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t.name}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t.title}</p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === active ? "bg-[#00D4FF] w-6" : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
