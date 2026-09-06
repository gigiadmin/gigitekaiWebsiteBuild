import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";
import { trpc } from "@/lib/trpc";

const dimensions = [
  ["identity", "Identity and access", "How consistently are MFA, privileged access, joiner/mover/leaver, and conditional access managed?"],
  ["security", "Security operations", "How clearly are endpoint, email, vulnerability, incident, and compliance controls owned and measured?"],
  ["resilience", "Backup and recovery", "How well are business systems and Microsoft 365 data protected, tested, and aligned to recovery objectives?"],
  ["service", "IT service management", "How consistently are support, monitoring, escalation, lifecycle, documentation, and improvement managed?"],
  ["automation", "AI and automation", "How deliberately are workflows selected, governed, integrated, measured, and reviewed by people?"],
] as const;

const answerLabels = ["Not established", "Ad hoc", "Partially managed", "Consistent", "Measured and optimized"];

export default function TechnologyAssessmentPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", company: "", email: "", employees: 25, priority: "Microsoft 365 and security", consent: false });
  const [scores, setScores] = useState<Record<string, number>>({ identity: 1, security: 1, resilience: 1, service: 1, automation: 0 });
  const mutation = trpc.websiteExpansion.submitAssessment.useMutation({ onSuccess: (data) => navigate(`/assessment/report/${data.publicId}`) });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.consent) return;
    mutation.mutate({ name: form.name, company: form.company, email: form.email, employees: form.employees, priority: form.priority, dimensions: scores as { identity: number; security: number; resilience: number; service: number; automation: number } });
  };

  return (
    <ExpansionPageShell eyebrow="Technology Maturity Assessment" title={<>Get a focused, executive-level view of <span className="text-[#00D4FF]">what to improve next.</span></>} summary="Score five operating dimensions, receive a maturity level, and generate a printable executive summary with three priority recommendations." primaryLabel="Compare services" primaryHref="/service-comparison" secondaryLabel="Review our Trust Center" secondaryHref="/trust-center">
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading eyebrow="Five dimensions" title="Answer based on how the organization operates today." description="This is a directional readiness assessment, not a compliance certification, penetration test, or formal audit." />
        <form onSubmit={submit} className="mt-12 space-y-6">
          {dimensions.map(([key, title, copy], index) => (
            <fieldset key={key} className="border border-white/10 bg-[#0A1020] p-6 sm:p-8">
              <legend className="px-2 text-lg font-semibold"><span className="mr-3 font-mono text-xs text-[#00D4FF]">0{index + 1}</span>{title}</legend>
              <p className="mt-2 leading-7 text-slate-400">{copy}</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-5">
                {answerLabels.map((label, value) => <label key={label} className={`cursor-pointer border p-3 text-xs leading-5 ${scores[key] === value ? "border-[#00D4FF] bg-[#00D4FF]/10 text-white" : "border-white/10 text-slate-400"}`}><input className="sr-only" type="radio" name={key} value={value} checked={scores[key] === value} onChange={() => setScores((current) => ({ ...current, [key]: value }))} />{label}</label>)}
              </div>
            </fieldset>
          ))}

          <div className="grid gap-5 border border-white/10 bg-[#0A1020] p-6 sm:grid-cols-2 sm:p-8">
            <label className="text-sm text-slate-300">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 min-h-12 w-full border border-white/15 bg-[#070B14] px-3" /></label>
            <label className="text-sm text-slate-300">Company<input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="mt-2 min-h-12 w-full border border-white/15 bg-[#070B14] px-3" /></label>
            <label className="text-sm text-slate-300">Work email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 min-h-12 w-full border border-white/15 bg-[#070B14] px-3" /></label>
            <label className="text-sm text-slate-300">Employees<input required type="number" min="1" max="100000" value={form.employees} onChange={(e) => setForm({ ...form, employees: Number(e.target.value) })} className="mt-2 min-h-12 w-full border border-white/15 bg-[#070B14] px-3" /></label>
            <label className="text-sm text-slate-300 sm:col-span-2">Primary priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-2 min-h-12 w-full border border-white/15 bg-[#070B14] px-3"><option>Microsoft 365 and security</option><option>Managed IT and support</option><option>AI strategy and automation</option><option>New business technology foundation</option></select></label>
            <label className="flex items-start gap-3 text-sm leading-6 text-slate-300 sm:col-span-2"><input required type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1 h-4 w-4" />I agree that GigitekAI may store these assessment details and contact me about the results. Do not include passwords or confidential system information.</label>
            {mutation.error ? <p className="text-sm text-red-300 sm:col-span-2">{mutation.error.message}</p> : null}
            <button disabled={mutation.isPending || !form.consent} className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#00D4FF] px-6 font-bold text-[#07101A] disabled:opacity-50 sm:col-span-2">{mutation.isPending ? "Generating report…" : "Generate my executive summary"}<ArrowRight className="h-4 w-4" /></button>
          </div>
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Your report link uses a high-entropy identifier. GigitekAI does not display your email address in the public report.</p>
        </form>
      </section>
    </ExpansionPageShell>
  );
}
