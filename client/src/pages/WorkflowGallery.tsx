import { useState } from "react";
import { ArrowRight, Bot, CheckCircle2, GitBranch, UserCheck } from "lucide-react";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";
import { useConversionTracking } from "@/hooks/useConversionTracking";

const workflows = [
  { id: "ticket-triage", title: "Helpdesk triage", trigger: "A support request arrives", agents: ["Classify intent and urgency", "Search approved knowledge", "Draft a response or route to a technician"], approval: "Human approval for sensitive, uncertain, or account-changing actions", outcome: "Faster intake with consistent escalation" },
  { id: "employee-onboarding", title: "Employee onboarding", trigger: "An approved hire is submitted", agents: ["Validate required fields", "Create a role-based task plan", "Coordinate identity, device, applications, and training"], approval: "Manager and IT approvals before access is granted", outcome: "Repeatable onboarding with an auditable checklist" },
  { id: "security-response", title: "Security alert response", trigger: "A monitored control produces an alert", agents: ["Enrich the signal", "Check asset and identity context", "Recommend containment and open an incident"], approval: "Authorized responder approves disruptive actions", outcome: "Quicker investigation without unmanaged autonomy" },
  { id: "client-provisioning", title: "Client provisioning", trigger: "A signed engagement enters onboarding", agents: ["Create records across approved systems", "Generate checklists and communications", "Track completion and exceptions"], approval: "Operations verifies contractual scope and owner assignments", outcome: "Less duplicate entry and fewer missed steps" },
];

export default function WorkflowGallery() {
  const [selected, setSelected] = useState(workflows[0]);
  const track = useConversionTracking();
  return (
    <ExpansionPageShell eyebrow="AI Workflow Gallery" title={<>See how governed agents transform <span className="text-[#00D4FF]">real operating work.</span></>} summary="Each example separates the trigger, agent tasks, human approval, and business outcome. The design goal is controlled automation—not uncontrolled replacement of judgment." primaryLabel="Map my workflow" primaryHref="/web-discovery-intake" secondaryLabel="Review AI governance" secondaryHref="/trust-center">
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading eyebrow="Interactive examples" title="Select a workflow to inspect its control path." />
        <div className="mt-10 grid gap-8 lg:grid-cols-[0.55fr_1.45fr]">
          <div className="space-y-2">{workflows.map((workflow) => <button key={workflow.id} onClick={() => { setSelected(workflow); track("workflow_demo_viewed", workflow.id); }} className={`min-h-14 w-full border px-5 text-left font-semibold ${selected.id === workflow.id ? "border-[#00D4FF] bg-[#00D4FF]/10 text-white" : "border-white/10 text-slate-400 hover:border-white/30"}`}>{workflow.title}</button>)}</div>
          <div className="border border-white/10 bg-[#0A1020] p-6 sm:p-8">
            <div className="grid gap-4 md:grid-cols-4 md:items-stretch">
              <article className="border border-white/10 p-5"><GitBranch className="h-5 w-5 text-[#00D4FF]" /><p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">Trigger</p><p className="mt-2 text-sm leading-6 text-slate-200">{selected.trigger}</p></article>
              <article className="border border-white/10 p-5 md:col-span-2"><Bot className="h-5 w-5 text-[#00D4FF]" /><p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">Agent actions</p><ul className="mt-3 space-y-2">{selected.agents.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#00D4FF]" />{item}</li>)}</ul></article>
              <article className="border border-white/10 p-5"><UserCheck className="h-5 w-5 text-[#00D4FF]" /><p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">Human control</p><p className="mt-2 text-sm leading-6 text-slate-200">{selected.approval}</p></article>
            </div>
            <div className="mt-4 flex items-center gap-3 border border-[#00D4FF]/25 bg-[#00D4FF]/5 p-5"><ArrowRight className="h-5 w-5 text-[#00D4FF]" /><div><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Intended outcome</p><p className="mt-1 font-semibold">{selected.outcome}</p></div></div>
          </div>
        </div>
      </section>
    </ExpansionPageShell>
  );
}
