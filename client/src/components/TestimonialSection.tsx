/*
  GigitekAI Testimonial Section — Upgraded
  Features: star ratings, avatar initials, company info, prev/next arrows,
  auto-rotate carousel, fade-in animation, summary stats bar
*/
import { useEffect, useRef, useState } from "react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < count ? "text-amber-400 fill-amber-400" : "text-gray-400"}
        />
      ))}
    </div>
  );
}

const testimonials = [
  {
    quote: "GigitekAI transformed our entire cloud infrastructure in under 90 days. Their AI-driven monitoring caught and resolved issues before they ever impacted our customers. It's not just a vendor relationship — they're a true technology partner.",
    name: "Sarah Chen",
    title: "CTO",
    company: "NovaBridge Financial",
    initials: "SC",
    rating: 5,
    accentClass: "from-cyan-500/20 to-blue-600/20",
  },
  {
    quote: "We went from a fragmented, on-premise setup to a fully managed multi-cloud environment with AI analytics. Our operational costs dropped 35% in the first year. GigitekAI delivered exactly what they promised.",
    name: "Marcus Williams",
    title: "VP of Technology",
    company: "HealthPath Systems",
    initials: "MW",
    rating: 5,
    accentClass: "from-purple-500/20 to-cyan-600/20",
  },
  {
    quote: "The AI automation GigitekAI implemented eliminated 60% of our manual data processing tasks. Our team now focuses on strategy instead of firefighting. The ROI was evident within the first quarter.",
    name: "Priya Sharma",
    title: "Director of Operations",
    company: "LogiCore Inc.",
    initials: "PS",
    rating: 5,
    accentClass: "from-emerald-500/20 to-cyan-600/20",
  },
  {
    quote: "Their Microsoft 365 architecture expertise is unmatched. They migrated our 200-person organization with zero downtime and set up security policies that actually work. Our compliance team was thrilled.",
    name: "David Okafor",
    title: "IT Director",
    company: "Meridian Legal Group",
    initials: "DO",
    rating: 5,
    accentClass: "from-orange-500/20 to-cyan-600/20",
  },
];

export default function TestimonialSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [paused]);

  const prev = () => { setPaused(true); setActive((a) => (a - 1 + testimonials.length) % testimonials.length); };
  const next = () => { setPaused(true); setActive((a) => (a + 1) % testimonials.length); };

  const t = testimonials[active];

  return (
    <section
      className="py-20 relative overflow-hidden bg-[#0A0E1A]"
      ref={ref}
    >
      {/* Background radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,212,255,0.05) 0%, transparent 70%)" }}
      />

      <div className="container relative z-10">
        {/* Section header */}
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-[#00D4FF] text-xs font-semibold uppercase tracking-widest mb-3">Client Success Stories</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Trusted by Forward-Thinking Teams
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm">
            Real results from organizations that chose GigitekAI to modernize their technology.
          </p>
        </div>

        {/* Carousel */}
        <div className={`max-w-3xl mx-auto transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative bg-gradient-to-br from-[#0F1629] to-[#0A0E1A] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 md:p-10 shadow-xl shadow-black/30">
            {/* Cyan accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-[#00D4FF] via-[#0099CC] to-transparent" />

            {/* Quote icon */}
            <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-5">
              <Quote size={18} className="text-[#00D4FF]" />
            </div>

            {/* Stars */}
            <div className="mb-4"><StarRating count={t.rating} /></div>

            {/* Quote text */}
            <blockquote
              key={active}
              className="text-lg md:text-xl text-white font-medium leading-relaxed mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              "{t.quote}"
            </blockquote>

            {/* Person row */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.accentClass} border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF] font-bold text-sm shrink-0`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-white font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.title}, {t.company}</p>
                </div>
              </div>
              {/* Nav arrows */}
              <div className="flex items-center gap-2">
                <button onClick={prev} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#00D4FF]/40 transition-all" aria-label="Previous testimonial">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={next} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#00D4FF]/40 transition-all" aria-label="Next testimonial">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setPaused(true); setActive(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "bg-[#00D4FF] w-8" : "bg-white/20 w-2 hover:bg-white/40"}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          {/* Summary bar */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { value: "24/7", label: "Support Coverage" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "<15min", label: "Response Time" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/3 border border-white/5 rounded-xl py-3 px-2">
                <p className="text-[#00D4FF] font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
