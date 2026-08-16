/*
  GigitekAI Premium Stats — Blackstone-style oversized metrics
  Single large number per stat. Minimal. Authoritative.
*/

const STATS = [
  { value: "40%", label: "Reduction in operational costs" },
  { value: "3.4s", label: "Multi-system client provisioning" },
  { value: "280+", label: "Hours freed monthly per 100 employees" },
  { value: "99.9%", label: "Uptime SLA guarantee" },
];

export default function PremiumStats() {
  return (
    <section className="bg-[#0A0A0A] py-24 lg:py-32 border-y border-white/5">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {STATS.map((stat) => (
            <div key={stat.value} className="text-center lg:text-left">
              <div className="font-['Space_Grotesk'] text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-[#00D4FF] leading-none mb-3">
                {stat.value}
              </div>
              <p className="text-[#F5F5F5]/50 text-sm lg:text-base font-['DM_Sans']">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
