import { ArrowRight, CheckCircle2 } from "lucide-react";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";

const offers = [
  { name: "Managed IT", best: "Ongoing support and operations", includes: ["Helpdesk and monitoring", "Microsoft 365 administration", "Device and vendor lifecycle", "Continuous service improvement"], href: "/services/managed" },
  { name: "Microsoft 365 Architecture", best: "Modernization and governance", includes: ["Entra ID and identity", "Exchange and collaboration", "Intune and endpoint strategy", "Migration and tenant design"], href: "/services/microsoft-365" },
  { name: "Cybersecurity", best: "Risk reduction and control maturity", includes: ["Zero Trust baseline", "Email and endpoint security", "Backup and recovery readiness", "Compliance-aligned roadmap"], href: "/services/security" },
  { name: "AI Automation", best: "Repeatable workflows at scale", includes: ["Workflow discovery", "Governed agent design", "System integration", "Measurement and optimization"], href: "/services/ai" },
  { name: "Fractional CTO", best: "Leadership and portfolio direction", includes: ["Executive advisory", "Technology roadmap", "Architecture oversight", "Implementation governance"], href: "/fractional-cto-ai-strategy" },
];

export default function ServiceComparison() {
  return (
    <ExpansionPageShell eyebrow="Service Comparison" title={<>Choose the right operating model for <span className="text-[#00D4FF]">what comes next.</span></>} summary="Compare GigitekAI services by business need, engagement model, and intended outcome. Every engagement begins with discovery and a clearly defined scope." primaryLabel="Start an IT discovery" primaryHref="/web-discovery-intake" secondaryLabel="Run the assessment" secondaryHref="/technology-assessment">
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading eyebrow="Core offers" title="Different mandates. One accountable partner." description="Services can stand alone or combine into an integrated managed, advisory, and automation relationship." />
        <div className="mt-12 grid gap-4 md:hidden">
          {offers.map((offer) => (
            <article key={offer.name} className="border border-white/10 bg-[#0A1020] p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-[#00D4FF]">Best for</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{offer.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{offer.best}</p>
              <ul className="mt-5 space-y-3">{offer.includes.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-400"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />{item}</li>)}</ul>
              <a href={offer.href} className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-[#00D4FF]">Explore {offer.name} <ArrowRight className="h-4 w-4" /></a>
            </article>
          ))}
        </div>
        <div className="mt-12 hidden overflow-x-auto border border-white/10 md:block">
          <table className="min-w-[880px] w-full border-collapse text-left">
            <thead className="bg-[#0A1020] text-xs uppercase tracking-[0.18em] text-slate-400"><tr><th className="p-5">Service</th><th className="p-5">Best when you need</th><th className="p-5">Core scope</th><th className="p-5">Next step</th></tr></thead>
            <tbody className="divide-y divide-white/10">
              {offers.map((offer) => (
                <tr key={offer.name} className="align-top hover:bg-white/[0.025]">
                  <td className="p-5 text-lg font-semibold text-white">{offer.name}</td>
                  <td className="p-5 text-slate-300">{offer.best}</td>
                  <td className="p-5"><ul className="space-y-2">{offer.includes.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-400"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />{item}</li>)}</ul></td>
                  <td className="p-5"><a href={offer.href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF]">Explore <ArrowRight className="h-4 w-4" /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </ExpansionPageShell>
  );
}
