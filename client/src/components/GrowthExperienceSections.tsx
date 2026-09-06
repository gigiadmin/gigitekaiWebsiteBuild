import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  CloudCog,
  HeartPulse,
  Landmark,
  LockKeyhole,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const outcomePaths = [
  {
    id: "support",
    icon: Wrench,
    title: "I need reliable IT support",
    summary: "Stabilize day-to-day operations with accountable managed support, monitoring, and lifecycle management.",
    href: "/services/managed",
    cta: "Explore managed IT",
  },
  {
    id: "security",
    icon: ShieldCheck,
    title: "I need to secure Microsoft 365",
    summary: "Strengthen identity, endpoints, email, data protection, and governance around the Microsoft cloud.",
    href: "/services/security",
    cta: "Review security services",
  },
  {
    id: "ai",
    icon: Bot,
    title: "I want to automate with AI",
    summary: "Identify repetitive work and deploy governed AI agents that connect to real business workflows.",
    href: "/services/ai",
    cta: "Explore AI automation",
  },
  {
    id: "launch",
    icon: Rocket,
    title: "I’m launching or scaling a business",
    summary: "Create the domain, Microsoft 365, security, website, support, and automation foundation as one coordinated system.",
    href: "/web-discovery-intake",
    cta: "Plan my technology launch",
  },
];

const industries = [
  {
    icon: Building2,
    title: "Professional Services",
    text: "Secure collaboration, client-data governance, reliable support, and efficient knowledge work.",
    href: "/industries",
  },
  {
    icon: HeartPulse,
    title: "Healthcare",
    text: "Resilient operations, identity safeguards, protected communication, and compliance-minded support.",
    href: "/industries/healthcare",
  },
  {
    icon: Landmark,
    title: "Nonprofits",
    text: "Practical modernization that improves mission delivery while respecting budget and staffing constraints.",
    href: "/industries",
  },
  {
    icon: Users,
    title: "Small & Growing Businesses",
    text: "A scalable technology foundation without the cost or complexity of building a full internal IT department.",
    href: "/industries",
  },
];

const packages = [
  {
    eyebrow: "FOUNDATION",
    title: "Secure Technology Foundation",
    bestFor: "New or growing organizations",
    items: ["Microsoft 365 and identity architecture", "Security baseline and device controls", "Domain, email, backup, and support readiness"],
    href: "/web-discovery-intake",
  },
  {
    eyebrow: "MANAGED",
    title: "Managed IT Operations",
    bestFor: "Teams that need dependable ongoing support",
    items: ["Helpdesk and proactive monitoring", "Security and Microsoft 365 administration", "Lifecycle, vendor, and operational oversight"],
    href: "/services/managed",
  },
  {
    eyebrow: "AI-ENABLED",
    title: "Agentic Operations",
    bestFor: "Organizations ready to automate safely",
    items: ["Workflow and automation discovery", "Governed AI agent implementation", "Integration, measurement, and continuous improvement"],
    href: "/services/ai",
  },
];

const journey = [
  ["01", "Discover", "Clarify risk, friction, priorities, and measurable opportunities."],
  ["02", "Secure", "Establish identity, endpoint, data, and operational guardrails."],
  ["03", "Modernize", "Improve Microsoft 365, cloud, collaboration, and service delivery."],
  ["04", "Automate", "Connect governed AI agents to repeatable business workflows."],
  ["05", "Manage", "Monitor, support, optimize, and continuously improve the environment."],
];

const recommendations: Record<string, { title: string; text: string; href: string }> = {
  support: {
    title: "Managed IT Operations Review",
    text: "Start with service coverage, support demand, monitoring, backup, and ownership gaps.",
    href: "/web-discovery-intake",
  },
  security: {
    title: "Microsoft 365 Security Assessment",
    text: "Start with identity, email, endpoint, data-protection, and recovery controls.",
    href: "/free-audit",
  },
  ai: {
    title: "AI Automation Opportunity Assessment",
    text: "Start by identifying repetitive work, integration constraints, governance needs, and measurable outcomes.",
    href: "/services/ai",
  },
  launch: {
    title: "Business Technology Launch Plan",
    text: "Start with domain, Microsoft 365, security, website, data, support, and automation dependencies.",
    href: "/web-discovery-intake",
  },
};

export default function GrowthExperienceSections() {
  const [selectedOutcome, setSelectedOutcome] = useState("support");
  const [assessmentPriority, setAssessmentPriority] = useState("security");
  const [teamSize, setTeamSize] = useState("11-50");
  const [form, setForm] = useState({ name: "", company: "", email: "" });
  const contactMutation = trpc.contact.submit.useMutation();

  const recommendation = useMemo(
    () => recommendations[assessmentPriority] ?? recommendations.security,
    [assessmentPriority]
  );

  const submitAssessment = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await contactMutation.mutateAsync({
        name: form.name,
        email: form.email,
        subject: `Website AI/IT Assessment - ${form.company}`,
        message: `Company: ${form.company}\nTeam size: ${teamSize}\nPriority: ${assessmentPriority}\nRecommended next step: ${recommendation.title}`,
      });
      toast.success("Assessment received. GigitekAI will follow up with your recommended next step.");
      setForm({ name: "", company: "", email: "" });
    } catch (error) {
      console.error("Assessment submission failed", error);
      toast.error("We could not submit the assessment. Please use the full assessment form or call GigitekAI.");
    }
  };

  return (
    <>
      <section className="border-y border-white/10 bg-[#050810] py-16 sm:py-24" aria-labelledby="outcome-heading">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">START WITH THE OUTCOME</p>
            <h2 id="outcome-heading" className="mt-5 font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
              What does your organization need next?
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Choose the business outcome that matters most. We will connect it to the right service path.</p>
          </div>

          <div className="mt-10 grid gap-3 lg:grid-cols-4" role="tablist" aria-label="Technology outcomes">
            {outcomePaths.map(({ id, icon: Icon, title }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selectedOutcome === id}
                onClick={() => setSelectedOutcome(id)}
                className={`min-h-[112px] border p-5 text-left transition-colors ${
                  selectedOutcome === id
                    ? "border-[#00D4FF] bg-[#00D4FF]/10 text-white"
                    : "border-white/10 bg-[#0A0E1A] text-slate-300 hover:border-[#00D4FF]/50"
                }`}
              >
                <Icon className="h-5 w-5 text-[#00D4FF]" aria-hidden="true" />
                <span className="mt-4 block font-[Space_Grotesk] text-base font-semibold leading-6">{title}</span>
              </button>
            ))}
          </div>

          {outcomePaths.filter(path => path.id === selectedOutcome).map(({ id, title, summary, href, cta }) => (
            <div key={id} role="tabpanel" className="mt-4 grid gap-6 border border-[#00D4FF]/25 bg-[#07111F] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="font-[Space_Grotesk] text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-3 max-w-3xl leading-7 text-slate-300">{summary}</p>
              </div>
              <a href={href} className="btn-cyan min-h-[48px] justify-center px-6 py-3 text-sm">{cta}<ArrowRight className="h-4 w-4" /></a>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#0A0E1A] py-16 sm:py-24" aria-labelledby="assessment-heading">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">AI + IT READINESS CHECK</p>
            <h2 id="assessment-heading" className="mt-5 font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">Get a focused next-step recommendation.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Choose your priority and team size. We will identify the most useful starting point and route your request into the existing GigitekAI intake workflow.</p>
            <div className="mt-8 border-l-2 border-[#00D4FF] pl-5">
              <p className="text-sm font-semibold text-[#00D4FF]">YOUR RECOMMENDATION</p>
              <p className="mt-2 font-[Space_Grotesk] text-2xl font-semibold text-white">{recommendation.title}</p>
              <p className="mt-3 leading-7 text-slate-300">{recommendation.text}</p>
              <a href={recommendation.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#00D4FF]">View the full path <ArrowRight className="h-4 w-4" /></a>
            </div>
          </div>

          <form onSubmit={submitAssessment} className="border border-white/10 bg-[#050810] p-6 sm:p-8">
            <fieldset>
              <legend className="font-[Space_Grotesk] text-lg font-semibold text-white">1. What is your highest priority?</legend>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ["support", "Reliable IT support"],
                  ["security", "Security & Microsoft 365"],
                  ["ai", "AI and workflow automation"],
                  ["launch", "New business technology"],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setAssessmentPriority(value)} className={`min-h-[48px] border px-4 py-3 text-left text-sm ${assessmentPriority === value ? "border-[#00D4FF] bg-[#00D4FF]/10 text-white" : "border-white/10 text-slate-300 hover:border-white/25"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="mt-6 block text-sm font-semibold text-white" htmlFor="assessment-team-size">2. Team size</label>
            <select id="assessment-team-size" value={teamSize} onChange={event => setTeamSize(event.target.value)} className="mt-2 min-h-[48px] w-full border border-white/15 bg-[#0A0E1A] px-4 text-white focus:border-[#00D4FF] focus:outline-none">
              <option value="1-10">1–10 people</option>
              <option value="11-50">11–50 people</option>
              <option value="51-100">51–100 people</option>
              <option value="101-250">101–250 people</option>
              <option value="250+">250+ people</option>
            </select>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-white">Name<input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="mt-2 min-h-[48px] w-full border border-white/15 bg-[#0A0E1A] px-4 text-white focus:border-[#00D4FF] focus:outline-none" autoComplete="name" /></label>
              <label className="text-sm font-semibold text-white">Company<input required value={form.company} onChange={event => setForm(current => ({ ...current, company: event.target.value }))} className="mt-2 min-h-[48px] w-full border border-white/15 bg-[#0A0E1A] px-4 text-white focus:border-[#00D4FF] focus:outline-none" autoComplete="organization" /></label>
            </div>
            <label className="mt-4 block text-sm font-semibold text-white">Work email<input required type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} className="mt-2 min-h-[48px] w-full border border-white/15 bg-[#0A0E1A] px-4 text-white focus:border-[#00D4FF] focus:outline-none" autoComplete="email" inputMode="email" /></label>
            <button type="submit" disabled={contactMutation.isPending} className="btn-cyan mt-6 min-h-[48px] w-full justify-center px-6 py-3 text-sm disabled:opacity-60">
              {contactMutation.isPending ? "Sending…" : "Send my recommended next step"}<ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050810] py-16 sm:py-24" aria-labelledby="packages-heading">
        <div className="container">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">ENGAGEMENT PATHS</p>
          <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <h2 id="packages-heading" className="max-w-3xl font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">Clear scope before the work begins.</h2>
            <p className="max-w-xl leading-7 text-slate-300">Final scope is based on users, systems, risk, integrations, and service requirements—not one-size-fits-all pricing.</p>
          </div>
          <div className="mt-10 grid border-y border-white/10 lg:grid-cols-3 lg:divide-x lg:divide-white/10">
            {packages.map((item, index) => (
              <article key={item.title} className={`py-10 lg:px-8 ${index === 0 ? "lg:pl-0" : ""} ${index === packages.length - 1 ? "lg:pr-0" : ""}`}>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#00D4FF]">{item.eyebrow}</p>
                <h3 className="mt-4 font-[Space_Grotesk] text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-400">Best for: {item.bestFor}</p>
                <ul className="mt-6 space-y-3">
                  {item.items.map(detail => <li key={detail} className="flex gap-3 text-sm leading-6 text-slate-300"><Check className="mt-1 h-4 w-4 shrink-0 text-[#00D4FF]" />{detail}</li>)}
                </ul>
                <a href={item.href} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#00D4FF]">Discuss this engagement <ArrowRight className="h-4 w-4" /></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0A0E1A] py-16 sm:py-24" aria-labelledby="workflow-heading">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">OPERATING MODEL</p>
              <h2 id="workflow-heading" className="mt-5 font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">Turn repetitive work into governed operations.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">AI creates value when it is connected to real systems, ownership, policy, and measurable outcomes.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
              <div className="border border-white/10 bg-[#050810] p-6">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">BEFORE</p>
                <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                  <li>Manual ticket intake and repetitive triage</li>
                  <li>Disconnected approval and onboarding steps</li>
                  <li>Limited visibility into ownership and outcomes</li>
                </ul>
              </div>
              <div className="flex items-center justify-center"><ArrowRight className="h-7 w-7 rotate-90 text-[#00D4FF] sm:rotate-0" /></div>
              <div className="border border-[#00D4FF]/30 bg-[#07111F] p-6">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#00D4FF]">AGENT-ENABLED</p>
                <ul className="mt-5 space-y-4 text-sm leading-6 text-white">
                  <li>AI-assisted classification and routing</li>
                  <li>Policy-aware orchestration across systems</li>
                  <li>Human approval, audit trails, and measurable service improvement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050810] py-16 sm:py-24" aria-labelledby="industry-heading">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">BUILT AROUND YOUR OPERATING REALITY</p>
            <h2 id="industry-heading" className="mt-5 font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">Technology guidance shaped by how your organization works.</h2>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map(({ icon: Icon, title, text, href }) => (
              <a key={title} href={href} className="group min-h-[260px] bg-[#0A0E1A] p-6 transition-colors hover:bg-[#07111F]">
                <Icon className="h-6 w-6 text-[#00D4FF]" />
                <h3 className="mt-12 font-[Space_Grotesk] text-xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-300">{text}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF]">Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0A0E1A] py-16 sm:py-24" aria-labelledby="journey-heading">
        <div className="container">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">CLIENT JOURNEY</p>
          <h2 id="journey-heading" className="mt-5 max-w-3xl font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">One relationship from first assessment to continuous improvement.</h2>
          <div className="mt-10 grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-5">
            {journey.map(([number, title, text], index) => (
              <div key={title} className={`border-b border-white/10 py-7 sm:px-5 lg:border-b-0 lg:border-r ${index === 0 ? "sm:pl-0" : ""} ${index === journey.length - 1 ? "lg:border-r-0 lg:pr-0" : ""}`}>
                <p className="font-[Space_Grotesk] text-sm font-semibold text-[#00D4FF]">{number}</p>
                <h3 className="mt-5 font-[Space_Grotesk] text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050810] py-16 sm:py-24" aria-labelledby="proof-heading">
        <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">OPERATIONAL PROOF</p>
            <h2 id="proof-heading" className="mt-5 font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">Enterprise discipline at MSP speed.</h2>
            <p className="mt-5 leading-7 text-slate-300">A practical operating model grounded in security, service management, measurable automation, and the platforms your business already uses.</p>
          </div>
          <div className="grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2">
            {[
              [ShieldCheck, "Security frameworks", "Zero Trust, NIST, and compliance-ready control design"],
              [CloudCog, "Cloud platforms", "Microsoft 365, Azure, AWS, and Google Cloud"],
              [Network, "Connected operations", "Helpdesk, monitoring, backup, security, and business workflows"],
              [Sparkles, "Governed automation", "AI agents with ownership, auditability, and human approval"],
            ].map(([Icon, title, text]) => {
              const ProofIcon = Icon as typeof ShieldCheck;
              return <div key={title as string} className="bg-[#0A0E1A] p-6 sm:p-8"><ProofIcon className="h-6 w-6 text-[#00D4FF]" /><h3 className="mt-6 font-[Space_Grotesk] text-xl font-semibold text-white">{title as string}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{text as string}</p></div>;
            })}
          </div>
        </div>
      </section>
    </>
  );
}
