import {
  ArrowRight,
  Bot,
  Cloud,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const solutionPillars = [
  {
    icon: ShieldCheck,
    eyebrow: "01 — MANAGE & SECURE",
    title: "Reliable IT, built around your business.",
    body: "A security-first managed IT foundation for the people, devices, data, and operations that keep your organization moving.",
    href: "/services/managed",
  },
  {
    icon: Cloud,
    eyebrow: "02 — MODERNIZE MICROSOFT 365",
    title: "Make your Microsoft investment work harder.",
    body: "Bring identity, collaboration, endpoint management, and cloud operations into a cleaner, better-governed operating model.",
    href: "/services/cloud",
  },
  {
    icon: Bot,
    eyebrow: "03 — GOVERN AI AUTOMATION",
    title: "Put AI to work with control built in.",
    body: "Move from isolated AI experiments to practical automation that respects security, accountability, and the way your team works.",
    href: "/services/ai",
  },
];

const operatingModel = [
  {
    number: "01",
    title: "Discover",
    text: "We clarify your risk, operating priorities, and opportunities before recommending a path forward.",
  },
  {
    number: "02",
    title: "Modernize",
    text: "We strengthen your IT and Microsoft 365 foundation with practical security and governance.",
  },
  {
    number: "03",
    title: "Improve",
    text: "We manage, automate, and continuously refine the technology that supports your business.",
  },
];

export default function EnterpriseHomeSections() {
  return (
    <>
      <section
        aria-label="GigitekAI trust signals"
        className="border-y border-white/10 bg-[#050810]"
      >
        <div className="container grid grid-cols-2 gap-y-6 py-8 sm:grid-cols-4 lg:py-10">
          {[
            "Microsoft 365 Architecture",
            "Security-first Operations",
            "Governed AI Automation",
            "ITIL & NIST Aligned",
          ].map((item, index) => (
            <div
              key={item}
              className={`px-4 text-sm font-medium text-slate-300 sm:px-8 ${
                index % 2 === 1 ? "border-l border-white/10" : ""
              } ${index > 1 ? "sm:border-l sm:border-white/10" : ""}`}
            >
              <span className="mr-2 text-[#00D4FF]">/</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="solutions" className="bg-[#0A0E1A] py-16 sm:py-32">
        <div className="container">
          <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-20">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">WHAT WE DO</p>
              <h2 className="mt-5 max-w-md font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
                Technology that is easier to run—and easier to trust.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              GigitekAI brings managed IT, Microsoft 365 architecture, cybersecurity, and governed AI into one accountable operating model for growing organizations.
            </p>
          </div>

          <div className="mt-4 grid lg:grid-cols-3 lg:divide-x lg:divide-white/10">
            {solutionPillars.map(({ icon: Icon, eyebrow, title, body, href }) => (
              <article key={title} className="group py-12 lg:px-9 lg:first:pl-0 lg:last:pr-0">
                <Icon className="h-6 w-6 text-[#00D4FF]" aria-hidden="true" />
                <p className="mt-10 text-xs font-semibold tracking-[0.18em] text-[#00D4FF]">{eyebrow}</p>
                <h3 className="mt-4 max-w-xs font-[Space_Grotesk] text-2xl font-semibold leading-tight text-white">
                  {title}
                </h3>
                <p className="mt-5 max-w-sm leading-7 text-slate-300">{body}</p>
                <a
                  href={href}
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-[#00D4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0E1A]"
                >
                  Explore solution <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050810] py-16 sm:py-32">
        <div className="container grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">HOW WE WORK</p>
            <h2 className="mt-5 max-w-lg font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
              One clear path from complexity to confident operations.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              You do not need another fragmented technology relationship. You need a team that can understand the whole picture and improve it with you.
            </p>
            <a
              href="/web-discovery-intake"
              className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]"
            >
              Begin an IT discovery <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="divide-y divide-white/10 border-t border-white/10">
            {operatingModel.map((step) => (
              <div key={step.number} className="grid grid-cols-[72px_1fr] gap-5 py-8 sm:grid-cols-[96px_1fr] sm:gap-8">
                <span className="pt-1 font-[Space_Grotesk] text-xl font-semibold text-[#00D4FF]">{step.number}</span>
                <div>
                  <h3 className="font-[Space_Grotesk] text-2xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 max-w-xl leading-7 text-slate-300">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0A0E1A] py-16 sm:py-32">
        <div className="container">
          <div className="grid overflow-hidden border border-[#00D4FF]/25 bg-[linear-gradient(120deg,rgba(0,212,255,0.1),rgba(10,14,26,0)_54%)] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-12 lg:p-16">
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> GOVERNED AI, MADE PRACTICAL
              </p>
              <h2 className="mt-6 max-w-2xl font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
                AI should remove friction—not create a new layer of risk.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                GigitekAI connects automation to your existing operations with an emphasis on identity, security, accountability, and measurable service improvement.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a href="/services/ai" className="btn-cyan px-6 py-3 text-sm">
                  Explore AI Automation <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="/ai-demo"
                  className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#00D4FF] hover:text-[#00D4FF]"
                >
                  View the live demo
                </a>
              </div>
            </div>
            <div className="relative min-h-[280px] border-t border-[#00D4FF]/15 bg-[#07111F] p-8 lg:min-h-0 lg:border-l lg:border-t-0">
              <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)", backgroundSize: "46px 46px" }} />
              <div className="relative flex h-full flex-col justify-end">
                <div className="border-l-2 border-[#00D4FF] pl-5">
                  <p className="text-sm font-semibold text-white">Identity-aware orchestration</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">From service requests to operational workflows, automation stays connected to governance and real-world accountability.</p>
                </div>
                <div className="mt-8 flex items-center gap-3 text-sm text-slate-300">
                  <LockKeyhole className="h-4 w-4 text-[#00D4FF]" aria-hidden="true" />
                  Security and control remain part of the design.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050810] py-16 sm:py-32">
        <div className="container">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">WHERE WE FOCUS</p>
              <h2 className="mt-5 font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">Technology for work that cannot stop.</h2>
            </div>
            <a href="/industries" className="inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF] hover:text-white">
              Explore industries <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="grid divide-y divide-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {[
              ["Healthcare", "Secure, resilient operations for teams balancing service delivery, data sensitivity, and compliance."],
              ["Legal", "Reliable collaboration, identity controls, and support for high-trust professional environments."],
              ["Construction", "Connected field and office operations that make technology a practical advantage rather than a distraction."],
            ].map(([industry, description], index) => (
              <div key={industry} className={`py-10 lg:px-9 ${index === 0 ? "lg:pl-0" : ""} ${index === 2 ? "lg:pr-0" : ""}`}>
                <p className="font-[Space_Grotesk] text-2xl font-semibold text-white">{industry}</p>
                <p className="mt-4 max-w-sm leading-7 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0A0E1A] py-16 sm:py-32">
        <div className="container grid gap-10 border-y border-white/10 py-12 lg:grid-cols-[1fr_auto] lg:items-center lg:py-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#00D4FF]">START WITH CLARITY</p>
            <h2 className="mt-5 max-w-3xl font-[Space_Grotesk] text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
              See what a more secure, capable technology operation can look like.
            </h2>
          </div>
          <div className="flex flex-wrap gap-4 lg:justify-end">
            <a href="/free-audit" className="btn-cyan px-6 py-3 text-sm">
              Start Your IT Assessment <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="/helpdesk" className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#00D4FF] hover:text-[#00D4FF]">
              Existing client support
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
