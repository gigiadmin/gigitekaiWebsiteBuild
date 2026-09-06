import { ArrowUpRight, BookOpen, Calculator, FileCheck2, Newspaper, Route, ScrollText, TerminalSquare } from "lucide-react";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";

const resources = [
  [Newspaper, "Insights", "Daily analysis on AI, Microsoft 365, cybersecurity, and managed operations.", "/insights", "Latest thinking"],
  [BookOpen, "Knowledge Base", "Practical troubleshooting and technology guidance for users and IT teams.", "/kb", "Technical help"],
  [Calculator, "ROI Scenario Calculator", "Model potential operational value with transparent, adjustable assumptions.", "/roi-calculator", "Business case"],
  [FileCheck2, "Technology Assessment", "Generate a maturity score and three prioritized recommendations.", "/technology-assessment", "Executive summary"],
  [Route, "Roadmap Generator", "Structure a phased improvement plan around business priorities.", "/roadmap-generator", "Planning tool"],
  [ScrollText, "Compliance Scorecard", "Explore readiness dimensions and evidence expectations.", "/compliance-scorecard", "Risk readiness"],
  [TerminalSquare, "Scripts Portal", "Access approved automation and administration resources.", "/scripts", "Technical library"],
  [BookOpen, "Trust Center", "Review GigitekAI security, privacy, resilience, and responsible AI principles.", "/trust-center", "Assurance"],
];

export default function ResourceCenter() {
  return (
    <ExpansionPageShell eyebrow="GigitekAI Resource Center" title={<>Practical guidance for <span className="text-[#00D4FF]">better technology decisions.</span></>} summary="Explore current Insights, technical Knowledge Base content, planning tools, security guidance, and implementation resources in one place." primaryLabel="Start with the assessment" primaryHref="/technology-assessment" secondaryLabel="Ask Aria" secondaryHref="/?openAria=true">
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading eyebrow="Explore by purpose" title="Learn, assess, plan, and implement." />
        <div className="mt-12 grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-4">
          {resources.map(([Icon, title, copy, href, label]) => <a key={String(title)} href={String(href)} className="group bg-[#0A1020] p-7 hover:bg-[#0D1628]"><Icon className="h-7 w-7 text-[#00D4FF]" /><p className="mt-8 text-xs uppercase tracking-[0.16em] text-slate-500">{String(label)}</p><h3 className="mt-3 text-xl font-semibold">{String(title)}</h3><p className="mt-3 min-h-24 leading-7 text-slate-400">{String(copy)}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF]">Open resource <ArrowUpRight className="h-4 w-4" /></span></a>)}
        </div>
      </section>
    </ExpansionPageShell>
  );
}
