import { Printer, ShieldCheck } from "lucide-react";
import { useParams } from "wouter";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";
import { trpc } from "@/lib/trpc";

export default function AssessmentReportPage() {
  const params = useParams<{ publicId: string }>();
  const query = trpc.websiteExpansion.getAssessment.useQuery({ publicId: params.publicId || "" }, { enabled: Boolean(params.publicId) });
  if (query.isLoading) return <div className="min-h-screen bg-[#070B14] p-12 text-white">Preparing executive summary…</div>;
  if (!query.data) return <div className="min-h-screen bg-[#070B14] p-12 text-white">Assessment report not found.</div>;
  const report = query.data;
  const recommendations = Array.isArray(report.recommendations) ? report.recommendations as Array<{ title: string; detail: string; route: string }> : [];
  return (
    <ExpansionPageShell eyebrow="Executive Technology Summary" title={<>{report.company}: <span className="text-[#00D4FF]">{report.maturityLevel}</span></>} summary={`Directional technology maturity score: ${report.overallScore}/100. Primary business priority: ${report.priority}.`} primaryLabel="Discuss the roadmap" primaryHref="/web-discovery-intake" secondaryLabel="Compare services" secondaryHref="/service-comparison">
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
          <aside className="border border-[#00D4FF]/30 bg-[#00D4FF]/5 p-8 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-[#00D4FF]" /><p className="mt-5 text-sm uppercase tracking-[0.2em] text-slate-400">Overall score</p><p className="mt-3 text-7xl font-semibold text-white">{report.overallScore}</p><p className="mt-2 text-[#00D4FF]">{report.maturityLevel}</p></aside>
          <div><SectionHeading eyebrow="Priority actions" title="Focus the next 90 days on the weakest controls." description="These recommendations are generated from the lowest-scoring assessment dimensions and should be validated through discovery." /><div className="mt-8 space-y-4">{recommendations.map((item, index) => <article key={item.title} className="border border-white/10 bg-[#0A1020] p-6"><p className="font-mono text-xs text-[#00D4FF]">0{index + 1}</p><h3 className="mt-4 text-xl font-semibold">{item.title}</h3><p className="mt-3 leading-7 text-slate-400">{item.detail}</p><a href={item.route} className="mt-4 inline-block text-sm font-semibold text-[#00D4FF]">Explore the related service</a></article>)}</div></div>
        </div>
        <div className="mt-10 border border-white/10 p-6 text-sm leading-7 text-slate-400">This report is a directional planning tool based solely on submitted answers. It is not a security certification, legal opinion, compliance attestation, vulnerability assessment, or guarantee of future outcomes.</div>
        <button onClick={() => window.print()} className="mt-6 inline-flex min-h-12 items-center gap-2 border border-white/20 px-5 font-semibold hover:border-[#00D4FF]"><Printer className="h-4 w-4" /> Print or save executive summary</button>
      </section>
    </ExpansionPageShell>
  );
}
