import { DatabaseBackup, Eye, KeyRound, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";

const controls = [
  [KeyRound, "Identity-first access", "MFA, least privilege, privileged-role separation, conditional access, and lifecycle governance form the access baseline."],
  [LockKeyhole, "Data protection", "Encryption, data minimization, retention awareness, secure collaboration, and recovery requirements are considered in solution design."],
  [DatabaseBackup, "Resilience and recovery", "Backups, recovery objectives, restoration testing, incident ownership, and continuity plans are documented with the customer."],
  [Eye, "Operational visibility", "Monitoring, alerting, audit trails, change records, and service reporting support accountable operations."],
  [Scale, "Responsible AI", "AI workflows use defined purpose, approved data, human oversight, least-privilege tools, evaluation, and escalation controls."],
  [ShieldCheck, "Framework-aligned delivery", "Architecture can be mapped to Zero Trust, NIST, ITIL, and customer-specific regulatory requirements during discovery."],
];

export default function TrustCenter() {
  return (
    <ExpansionPageShell eyebrow="GigitekAI Trust Center" title={<>Security, privacy, resilience, and AI governance <span className="text-[#00D4FF]">by design.</span></>} summary="This page explains how GigitekAI approaches secure service delivery. Specific controls, responsibilities, and compliance requirements are confirmed in each customer agreement and solution design." primaryLabel="Request a security review" primaryHref="/free-audit" secondaryLabel="View service status" secondaryHref="/status">
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading eyebrow="Control principles" title="A practical Zero Trust operating model." description="Trust is not a logo or a one-time assessment. It is the combination of identity, data, resilience, observability, governance, and clearly assigned responsibility." />
        <div className="mt-12 grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {controls.map(([Icon, title, copy]) => <article key={String(title)} className="bg-[#0A1020] p-7 sm:p-8"><Icon className="h-7 w-7 text-[#00D4FF]" /><h3 className="mt-8 text-xl font-semibold">{String(title)}</h3><p className="mt-3 leading-7 text-slate-400">{String(copy)}</p></article>)}
        </div>
      </section>
      <section className="border-y border-white/10 bg-[#0A1020]"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12"><div className="grid gap-12 lg:grid-cols-2"><SectionHeading eyebrow="Assurance boundaries" title="Clear language. No unsupported compliance claims." description="GigitekAI supports compliance readiness and control implementation. Certification or attestation status depends on the customer environment, scope, evidence, and independent assessor where required." /><div className="space-y-4 text-sm leading-7 text-slate-300"><p className="border-l-2 border-[#00D4FF] pl-5">HIPAA, SOC 2, PCI DSS, CMMC, and similar programs require scoped evidence and customer-specific validation. GigitekAI does not represent a customer as certified solely because aligned controls are implemented.</p><p className="border-l-2 border-white/15 pl-5">Shared responsibility is documented for identities, data, configuration, vendors, backups, incidents, and administrative access.</p><p className="border-l-2 border-white/15 pl-5">Security questionnaires, architecture documentation, and control-mapping support can be provided during a qualified sales or onboarding process.</p></div></div></div></section>
    </ExpansionPageShell>
  );
}
