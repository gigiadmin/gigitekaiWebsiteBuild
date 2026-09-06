import { CheckCircle2, Globe2, Laptop, Mail, Shield, Wrench } from "lucide-react";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";

const launchLayers = [
  [Globe2, "Domain and digital identity", "Domain strategy, DNS, website launch, analytics, and ownership documentation."],
  [Mail, "Microsoft 365 foundation", "Business email, Teams, SharePoint, OneDrive, licensing, and administrative standards."],
  [Shield, "Security baseline", "MFA, conditional access, endpoint controls, email protection, backup, and recovery planning."],
  [Laptop, "Devices and access", "User onboarding, device enrollment, application access, and standardized configurations."],
  [Wrench, "Support readiness", "Helpdesk access, escalation paths, vendor inventory, documentation, and lifecycle ownership."],
];

export default function SMBLaunchPackage() {
  return (
    <ExpansionPageShell
      eyebrow="New Business Technology Launch"
      title={<>Start with a technology foundation <span className="text-[#00D4FF]">built to scale.</span></>}
      summary="One coordinated launch for your domain, Microsoft 365, website, cybersecurity, backup, devices, and support—without piecing together disconnected vendors."
      primaryLabel="Plan my business launch"
      primaryHref="/web-discovery-intake"
      secondaryLabel="Compare services"
      secondaryHref="/service-comparison"
    >
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading eyebrow="Launch scope" title="Everything your business needs to operate professionally." description="GigitekAI creates the core systems, security controls, documentation, and ownership model your team needs from day one." />
        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {launchLayers.map(([Icon, title, copy], index) => (
            <article key={String(title)} className="grid gap-5 py-7 sm:grid-cols-[3rem_1fr] lg:grid-cols-[4rem_0.65fr_1.35fr] lg:items-center">
              <Icon className="h-7 w-7 text-[#00D4FF]" aria-hidden="true" />
              <h3 className="text-xl font-semibold"><span className="mr-3 font-mono text-xs text-slate-500">0{index + 1}</span>{String(title)}</h3>
              <p className="leading-7 text-slate-400">{String(copy)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#0A1020]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <SectionHeading eyebrow="What you receive" title="A documented operating system—not a pile of accounts." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Administrative ownership register",
              "User and device onboarding standards",
              "Security and recovery baseline",
              "Vendor and subscription inventory",
              "Support and escalation runbook",
              "90-day improvement roadmap",
            ].map((item) => <div key={item} className="flex items-start gap-3 border border-white/10 p-5"><CheckCircle2 className="mt-0.5 h-5 w-5 text-[#00D4FF]" /><span>{item}</span></div>)}
          </div>
        </div>
      </section>
    </ExpansionPageShell>
  );
}
