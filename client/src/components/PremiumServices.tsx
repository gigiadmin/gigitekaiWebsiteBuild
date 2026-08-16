/*
  GigitekAI Premium Services — 4 pillars, full-width alternating layout
  Blackstone-style: minimal, large type, no cards with borders
*/

import { Brain, Shield, Server, Users } from "lucide-react";

const PILLARS = [
  {
    icon: Users,
    title: "Fractional CTO & AI Strategy",
    points: [
      "Senior technology leadership on demand",
      "AI readiness assessment and implementation roadmap",
      "Board-level technology advisory",
      "Vendor evaluation and architecture decisions",
    ],
  },
  {
    icon: Server,
    title: "Microsoft 365 Architecture",
    points: [
      "Enterprise Exchange Online, SharePoint, Teams, OneDrive",
      "Entra ID, Conditional Access, Zero Trust identity",
      "Purview compliance, DLP, and information governance",
      "Hybrid migrations and tenant consolidation",
    ],
  },
  {
    icon: Brain,
    title: "AI Helpdesk Automation",
    points: [
      "Agentic AI workflows that resolve tickets autonomously",
      "Intelligent routing, classification, and escalation",
      "Knowledge Base grounding and self-service automation",
      "280+ hours freed monthly for a typical 100-employee company",
    ],
  },
  {
    icon: Shield,
    title: "Secure Managed Infrastructure",
    points: [
      "24/7 monitoring with 99.9% uptime SLA",
      "HIPAA, SOC 2, PCI-DSS, CMMC compliance-ready",
      "Zero Trust architecture and endpoint protection",
      "Cloud infrastructure across Azure, AWS, and Google Cloud",
    ],
  },
];

export default function PremiumServices() {
  return (
    <section className="bg-black py-28 lg:py-40">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="section-label">WHAT WE DO</div>
        <h2 className="font-['Space_Grotesk'] text-3xl lg:text-5xl font-bold text-white tracking-tight mb-20">
          <span className="text-[#00D4FF]">Architect</span> secure foundations.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-20">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="group">
              <div className="flex items-center gap-4 mb-5">
                <pillar.icon size={24} className="text-[#00D4FF]" strokeWidth={1.5} />
                <h3 className="font-['Space_Grotesk'] text-xl lg:text-2xl font-semibold text-white">
                  {pillar.title}
                </h3>
              </div>
              <div className="border-t border-white/8 pt-5 pl-10">
                {pillar.points.map((point) => (
                  <p key={point} className="text-[#F5F5F5]/60 text-base leading-relaxed font-['DM_Sans'] mb-2">
                    {point}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
