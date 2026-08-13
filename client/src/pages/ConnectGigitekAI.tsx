import { ArrowRight, ClipboardList, Linkedin, Mail, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";

const actions = [
  {
    title: "Start an IT assessment",
    description: "Tell us about your environment and the outcome you need.",
    href: "/web-discovery-intake",
    icon: ClipboardList,
    primary: true,
  },
  {
    title: "Request a security review",
    description: "Start with a focused conversation about risk and resilience.",
    href: "/free-audit",
    icon: ShieldCheck,
  },
  {
    title: "Save our contact details",
    description: "Keep GigitekAI ready when you need technology support.",
    href: "/contact-card",
    icon: UserRound,
  },
];

export default function ConnectGigitekAI() {
  return (
    <div className="min-h-screen bg-[#070C17] text-white">
      <header className="border-b border-white/10 bg-[#070C17]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Gigitek<span className="text-[#00D4FF]">AI</span>
          </a>
          <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#7DD3FC]"><Sparkles className="h-4 w-4" /> LET’S CONNECT</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-12 sm:px-8 sm:pt-20">
        <p className="mb-4 text-xs font-semibold tracking-[0.17em] text-[#00D4FF]">GIGITEKAI LLC</p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Let’s make your technology operation easier to run—and safer to scale.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          You do not need a LinkedIn account to start a conversation. Reach GigitekAI directly, request an assessment, or save our details for later.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a href="tel:+17273826909" className="flex min-h-16 items-center gap-4 border border-[#00D4FF]/30 bg-[#00D4FF]/[0.07] px-5 active:bg-[#00D4FF]/[0.12]">
            <Phone className="h-5 w-5 text-[#00D4FF]" />
            <span><span className="block text-xs font-semibold tracking-[0.13em] text-[#7DD3FC]">CALL GIGITEKAI</span><span className="mt-1 block font-semibold">(727) 382-6909</span></span>
          </a>
          <a href="mailto:support@gigitekai.com" className="flex min-h-16 items-center gap-4 border border-white/15 bg-white/[0.03] px-5 active:bg-white/[0.07]">
            <Mail className="h-5 w-5 text-[#7DD3FC]" />
            <span><span className="block text-xs font-semibold tracking-[0.13em] text-[#7DD3FC]">EMAIL US</span><span className="mt-1 block font-semibold">support@gigitekai.com</span></span>
          </a>
        </div>

        <section className="mt-10" aria-label="Connect with GigitekAI options">
          <p className="mb-4 text-xs font-semibold tracking-[0.15em] text-slate-400">CHOOSE YOUR NEXT STEP</p>
          <div className="grid gap-3">
            {actions.map(action => {
              const Icon = action.icon;
              return (
                <a key={action.title} href={action.href} className={`group flex min-h-24 items-center justify-between gap-4 border px-5 py-5 transition-colors ${action.primary ? "border-[#00D4FF]/45 bg-[#00D4FF]/[0.08] active:bg-[#00D4FF]/[0.14]" : "border-white/12 bg-[#0B1424] active:bg-white/[0.05]"}`}>
                  <span className="flex items-center gap-4">
                    <span className="grid h-11 w-11 place-items-center border border-white/15 bg-[#070C17]"><Icon className="h-5 w-5 text-[#00D4FF]" /></span>
                    <span><span className="block text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{action.title}</span><span className="mt-1 block text-sm leading-6 text-slate-300">{action.description}</span></span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-[#00D4FF] transition-transform group-hover:translate-x-1" />
                </a>
              );
            })}
          </div>
        </section>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          <p>Prefer LinkedIn? You can still visit our profile—LinkedIn may require its own sign-in.</p>
          <a href="https://www.linkedin.com/in/gigitekinc" className="mt-3 inline-flex items-center gap-2 font-semibold text-[#7DD3FC] underline-offset-4 hover:underline"><Linkedin className="h-4 w-4" /> Visit GigitekAI on LinkedIn</a>
        </div>
      </main>
    </div>
  );
}
