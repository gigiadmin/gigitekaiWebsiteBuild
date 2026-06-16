/*
  GigitekAI Testimonial Section — Placeholder
  Testimonials will be added once real client reviews are collected.
*/
import { useEffect, useRef, useState } from "react";
import { Quote, Star } from "lucide-react";

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

const testimonials: any[] = [];

export default function TestimonialSection() {
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

  // Return empty if no testimonials
  if (testimonials.length === 0) {
    return null;
  }

  const t = testimonials[0];

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
        <div className={`text-center mb-12 transition-[opacity,transform] duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-[#00D4FF] text-xs font-semibold uppercase tracking-widest mb-3">Client Success Stories</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Trusted by Forward-Thinking Teams
          </h2>
          <p className="text-gray-300 mt-3 max-w-xl mx-auto text-sm">
            Real results from organizations that chose GigitekAI to modernize their technology.
          </p>
        </div>

        {/* Carousel */}
        <div className={`max-w-3xl mx-auto transition-[opacity,transform] duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative bg-gradient-to-br from-[#0F1629] to-[#0A0E1A] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8 md:p-10 shadow-xl shadow-black/30">
            {/* Cyan accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-[#00D4FF] via-[#0099CC] to-transparent" />

            {/* Quote icon */}
            <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-5">
              <Quote size={18} className="text-[#00D4FF]" />
            </div>

            {/* Stars */}
            <div className="mb-4"><StarRating count={t?.rating || 5} /></div>

            {/* Quote text */}
            <blockquote
              className="text-lg md:text-xl text-white font-medium leading-relaxed mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              "{t?.quote || "Client testimonials coming soon..."}"
            </blockquote>

            {/* Person row */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF] font-bold text-sm shrink-0`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {t?.initials || "GG"}
                </div>
                <div>
                  <p className="text-white font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t?.name || "Coming Soon"}</p>
                  <p className="text-gray-300 text-xs">{t?.title || ""}, {t?.company || ""}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
