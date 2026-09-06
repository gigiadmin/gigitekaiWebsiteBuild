import { Building2, CheckCircle2, HardHat, HeartHandshake, Scale, Users } from "lucide-react";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";

const industryData: Record<string, { eyebrow: string; title: string; summary: string; icon: typeof Building2; priorities: string[]; outcomes: string[] }> = {
  legal: { eyebrow: "Legal Technology", title: "Secure, reliable technology for high-trust legal work.", summary: "Protect client information, improve collaboration, strengthen identity, and keep attorneys productive across office, court, and remote environments.", icon: Scale, priorities: ["Microsoft 365 information governance", "Identity and privileged access", "Secure collaboration and mobility", "Business continuity and support"], outcomes: ["Clearer access governance", "More resilient collaboration", "Reduced support friction"] },
  construction: { eyebrow: "Construction Technology", title: "Connect field teams, offices, projects, and vendors.", summary: "Create a practical technology foundation for project delivery, mobile work, document control, security, and dependable support.", icon: HardHat, priorities: ["Field and office collaboration", "Device and identity lifecycle", "Project-data protection", "Vendor and application coordination"], outcomes: ["Faster field support", "Consistent access controls", "Better project continuity"] },
  nonprofits: { eyebrow: "Nonprofit Technology", title: "Modernize the mission without adding operational burden.", summary: "Use Microsoft 365, security, managed support, and practical automation to improve service delivery while respecting staffing and budget realities.", icon: HeartHandshake, priorities: ["Licensing and cloud optimization", "Security and donor-data protection", "Volunteer and staff lifecycle", "Workflow automation"], outcomes: ["Better use of limited resources", "Stronger data safeguards", "Less administrative work"] },
  "professional-services": { eyebrow: "Professional Services", title: "Technology that protects client trust and knowledge work.", summary: "Strengthen collaboration, client-data governance, service continuity, and the daily experience of distributed professional teams.", icon: Users, priorities: ["Secure client collaboration", "Microsoft 365 governance", "Knowledge and document workflows", "Responsive managed support"], outcomes: ["Fewer collaboration barriers", "Clearer information controls", "More consistent service delivery"] },
  "tampa-small-business": { eyebrow: "Tampa Bay Small Business", title: "Local technology leadership for growing Tampa organizations.", summary: "Build, secure, and manage the technology your business needs—without carrying the cost and complexity of a full internal IT department.", icon: Building2, priorities: ["Business launch and modernization", "Microsoft 365 and cybersecurity", "Managed helpdesk and monitoring", "AI workflow automation"], outcomes: ["One accountable technology partner", "A scalable operating foundation", "Faster access to senior expertise"] },
};

export default function IndustryGrowthPage() {
  const slug = window.location.pathname.split("/").filter(Boolean).pop() || "professional-services";
  const data = industryData[slug] || industryData["professional-services"];
  const Icon = data.icon;
  return (
    <ExpansionPageShell eyebrow={data.eyebrow} title={<>{data.title.split(" ").slice(0, -2).join(" ")} <span className="text-[#00D4FF]">{data.title.split(" ").slice(-2).join(" ")}</span></>} summary={data.summary} primaryLabel="Discuss your environment" primaryHref="/web-discovery-intake" secondaryLabel="Compare services" secondaryHref="/service-comparison">
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
          <div><Icon className="h-12 w-12 text-[#00D4FF]" /><SectionHeading eyebrow="Operating priorities" title="Built around the way your organization works." /></div>
          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            {data.priorities.map((priority, index) => <article key={priority} className="bg-[#0A1020] p-7"><span className="font-mono text-xs text-[#00D4FF]">0{index + 1}</span><h3 className="mt-8 text-xl font-semibold">{priority}</h3></article>)}
          </div>
        </div>
      </section>
      <section className="border-y border-white/10 bg-[#0A1020]"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12"><SectionHeading eyebrow="Expected outcomes" title="A stronger operating foundation." /><div className="mt-10 grid gap-4 md:grid-cols-3">{data.outcomes.map((outcome) => <div key={outcome} className="flex items-center gap-3 border border-white/10 p-6"><CheckCircle2 className="h-5 w-5 text-[#00D4FF]" /><span className="font-semibold">{outcome}</span></div>)}</div></div></section>
    </ExpansionPageShell>
  );
}
