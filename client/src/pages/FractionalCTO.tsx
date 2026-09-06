import { BrainCircuit, Compass, Landmark, Network, ShieldCheck, Workflow } from "lucide-react";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";

const responsibilities = [
  [Compass, "Technology direction", "Translate business priorities into a sequenced Microsoft 365, cloud, security, data, and AI roadmap."],
  [Landmark, "Executive decision support", "Give leadership a clear view of risk, investment tradeoffs, operating constraints, and measurable outcomes."],
  [ShieldCheck, "Governance by design", "Apply Zero Trust, NIST-aligned controls, responsible AI guardrails, ownership, and auditability from the beginning."],
  [Workflow, "Implementation leadership", "Move strategy into delivery by coordinating vendors, internal teams, milestones, integrations, and adoption."],
  [Network, "Architecture oversight", "Reduce tool sprawl and create a coherent operating model across identity, endpoints, cloud, support, and automation."],
  [BrainCircuit, "AI portfolio management", "Prioritize workflows where AI agents can remove friction without creating unmanaged operational risk."],
];

export default function FractionalCTO() {
  return (
    <ExpansionPageShell
      eyebrow="Fractional CTO + AI Strategy"
      title={<>Senior technology leadership <span className="text-[#00D4FF]">without a full-time executive hire.</span></>}
      summary="GigitekAI helps growing organizations make better technology decisions, modernize Microsoft environments, govern AI adoption, and turn strategy into accountable implementation."
      primaryLabel="Request a strategy session"
      primaryHref="/web-discovery-intake"
      secondaryLabel="Run the readiness assessment"
      secondaryHref="/technology-assessment"
    >
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading eyebrow="The mandate" title="One accountable technology strategy across the business." description="Use fractional leadership when technology decisions are becoming too important, interconnected, or risky to manage through disconnected vendors and isolated projects." />
        <div className="mt-12 grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {responsibilities.map(([Icon, title, copy]) => (
            <article key={String(title)} className="bg-[#0A1020] p-7 sm:p-8">
              <Icon className="h-7 w-7 text-[#00D4FF]" aria-hidden="true" />
              <h3 className="mt-8 text-xl font-semibold">{String(title)}</h3>
              <p className="mt-3 leading-7 text-slate-400">{String(copy)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y border-white/10 bg-[#0A1020]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-28">
          <SectionHeading eyebrow="Engagement model" title="Lead the roadmap. Stay through implementation." description="The engagement can begin with a focused executive advisory sprint and expand into implementation governance or ongoing technology leadership." />
          <ol className="space-y-8">
            {[
              ["01", "Executive discovery", "Clarify objectives, operating pain, constraints, risk appetite, and success measures."],
              ["02", "Architecture and roadmap", "Define target-state decisions, priorities, dependencies, investment ranges, and sequencing."],
              ["03", "Implementation governance", "Direct the work, validate designs, manage vendors, and protect business outcomes."],
              ["04", "Continuous advisory", "Review metrics, emerging risk, AI opportunities, and technology portfolio decisions."],
            ].map(([number, title, copy]) => (
              <li key={number} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-white/10 pt-6">
                <span className="font-mono text-sm text-[#00D4FF]">{number}</span>
                <div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 leading-7 text-slate-400">{copy}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </ExpansionPageShell>
  );
}
