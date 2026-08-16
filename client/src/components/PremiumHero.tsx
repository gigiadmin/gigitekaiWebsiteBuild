/*
  GigitekAI Premium Hero — Blackstone-inspired
  Full-viewport black. Bold "Architect" headline. Fractional CTO positioning.
*/

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function PremiumHero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center bg-black overflow-hidden">
      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
        backgroundSize: '48px 48px'
      }} />

      <div className={`relative z-10 mx-auto max-w-[1400px] px-6 lg:px-10 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        {/* Section label */}
        <div className="section-label mb-8">
          FRACTIONAL CTO & AI STRATEGY
        </div>

        {/* Main headline */}
        <h1 className="font-['Space_Grotesk'] text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-tight text-white max-w-[900px]">
          <span className="text-[#00D4FF]">Architect</span> your<br />
          AI advantage.
        </h1>

        {/* Supporting copy */}
        <p className="mt-8 max-w-[620px] text-[#F5F5F5]/70 text-lg lg:text-xl leading-relaxed font-['DM_Sans']">
          Fractional CTO services for organizations ready to operationalize AI,
          modernize Microsoft 365, and secure their infrastructure — without the complexity.
        </p>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap items-center gap-5">
          <a
            href="/contact"
            className="btn-outline-cyan text-base"
          >
            Schedule a Strategy Session
          </a>
          <a
            href="/services"
            className="inline-flex items-center gap-2 text-[#F5F5F5]/60 hover:text-[#00D4FF] text-sm font-medium font-['DM_Sans'] transition-colors no-underline"
          >
            Explore Our Approach <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {/* Bottom fade line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
}
