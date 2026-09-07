import { ArrowRight, Bot, Building2, Headphones, ShieldCheck } from "lucide-react";
import { useConversionTracking, type ConversionEventName } from "@/hooks/useConversionTracking";

const pathways = [
  { id: "managed-it", icon: Headphones, title: "Run IT more reliably", copy: "Managed helpdesk, monitoring, Microsoft 365 administration, device lifecycle, and continuous improvement.", href: "/services/managed" },
  { id: "security", icon: ShieldCheck, title: "Secure Microsoft 365", copy: "Identity, endpoint, email, backup, recovery, and Zero Trust architecture grounded in business risk.", href: "/services/security" },
  { id: "ai-strategy", icon: Bot, title: "Implement AI responsibly", copy: "Fractional technology leadership, workflow discovery, governed agents, integrations, and measurable adoption.", href: "/fractional-cto-ai-strategy" },
  { id: "business-launch", icon: Building2, title: "Launch or modernize a business", copy: "Domain, website, Microsoft 365, cybersecurity, devices, backup, and support in one coordinated plan.", href: "/business-technology-launch" },
];

export default function HomeDecisionGateway() {
  const track = useConversionTracking();
  return (
    <>
      <section className="border-y border-white/10 bg-[#08101D]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#00D4FF]">Start with the outcome</p><h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.025em] text-white sm:text-5xl">What needs to work better?</h2></div>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">Choose the business outcome that matters now. GigitekAI will connect it to the right managed service, architecture, security, or AI implementation path.</p>
          </div>
          <div className="mt-12 grid gap-px bg-white/10 md:grid-cols-2">
            {pathways.map((pathway) => <a key={pathway.id} href={pathway.href} onClick={() => track("homepage_pathway_selected", pathway.id)} className="group bg-[#0A1020] p-7 hover:bg-[#0D1728] sm:p-9"><pathway.icon className="h-7 w-7 text-[#00D4FF]" /><h3 className="mt-8 text-2xl font-semibold">{pathway.title}</h3><p className="mt-3 max-w-xl leading-7 text-slate-400">{pathway.copy}</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF]">Explore this path <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></a>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#00D4FF]">Make the next decision with evidence</p><h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.025em] text-white sm:text-5xl">Assess readiness. Model value. Review the control path.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Use the planning tools before a sales conversation, or move directly into discovery when the problem is already clear.</p></div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {[
              ["Technology maturity assessment", "Receive a score and three prioritized actions.", "/technology-assessment", "assessment_opened"],
              ["ROI scenario calculator", "Model operational value using your own assumptions.", "/roi-calculator", "roi_opened"],
              ["AI workflow gallery", "Inspect agent actions, human approvals, and intended outcomes.", "/ai-workflows", "workflow_gallery_opened"],
              ["Trust Center", "Review security, resilience, privacy, and responsible AI principles.", "/trust-center", "trust_center_opened"],
              ["Insights", "Read daily AI, Microsoft 365, cybersecurity, and managed-service analysis.", "/insights", "insights_opened"],
            ].map(([title, copy, href, event]) => <a key={title} href={href} onClick={() => track(event as ConversionEventName, title)} className="group grid min-h-24 grid-cols-[1fr_auto] items-center gap-5 py-5"><div><h3 className="font-semibold text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{copy}</p></div><ArrowRight className="h-5 w-5 text-[#00D4FF] transition-transform group-hover:translate-x-1" /></a>)}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0A1020]"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12"><div><p className="text-sm font-semibold text-white">Microsoft 365 architecture · Managed IT · Cybersecurity · Governed AI automation</p><p className="mt-2 text-sm text-slate-400">Delivered through an ITIL-informed, Zero Trust operating approach with NIST-aligned control thinking.</p></div><div className="flex flex-col gap-3 sm:flex-row"><a href="/service-comparison" className="inline-flex min-h-12 items-center justify-center border border-white/20 px-5 font-semibold hover:border-[#00D4FF]">Compare services</a><a href="/web-discovery-intake" className="inline-flex min-h-12 items-center justify-center bg-[#00D4FF] px-5 font-bold text-[#07101A]">Start discovery</a></div></div></section>
    </>
  );
}
