import { useState } from "react";
import {
  Bot,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  Globe2,
  Linkedin,
  QrCode,
  ScanLine,
  Share2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type QrDestination = {
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  image: string;
  icon: typeof Globe2;
  accent: string;
};

const destinations: QrDestination[] = [
  {
    title: "GigitekAI Website",
    eyebrow: "Company overview",
    description: "Send a prospect to the complete GigitekAI experience.",
    href: "https://gigitekai.com",
    image: "/manus-storage/01_gigitekai_website_b332511e.png",
    icon: Globe2,
    accent: "#00D4FF",
  },
  {
    title: "Virtual Business Card",
    eyebrow: "Save contact details",
    description: "Lets a prospect save GigitekAI LLC contact information directly to their phone.",
    href: "https://gigitekai.com/contact-card",
    image: "/manus-storage/02_virtual_business_card_c4931cd1.png",
    icon: UserRound,
    accent: "#7DD3FC",
  },
  {
    title: "IT Discovery Intake",
    eyebrow: "New client assessment",
    description: "Start a detailed IT discovery request for a new opportunity.",
    href: "https://gigitekai.com/web-discovery-intake",
    image: "/manus-storage/03_it_discovery_intake_4512bd38.png",
    icon: ClipboardList,
    accent: "#22D3EE",
  },
  {
    title: "Free Security Audit",
    eyebrow: "Security review",
    description: "Give a prospect a direct path to request their security assessment.",
    href: "https://gigitekai.com/free-audit",
    image: "/manus-storage/04_free_security_audit_d8431c37.png",
    icon: ShieldCheck,
    accent: "#34D399",
  },
  {
    title: "AI Automation",
    eyebrow: "Agentic AI services",
    description: "Open GigitekAI’s AI automation and agentic operations services.",
    href: "https://gigitekai.com/services/ai",
    image: "/manus-storage/05_ai_automation_7b206e25.png",
    icon: Bot,
    accent: "#A78BFA",
  },
  {
    title: "Connect With GigitekAI",
    eyebrow: "No-login contact",
    description: "Reach GigitekAI directly—no LinkedIn account required. Call, email, start an assessment, or save our contact details.",
    href: "https://gigitekai.com/connect",
    image: "/manus-storage/06_connect_gigitekai_b614065a.png",
    icon: Linkedin,
    accent: "#60A5FA",
  },
];

export default function QrHub() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = async (destination: QrDestination) => {
    try {
      await navigator.clipboard.writeText(destination.href);
      setCopied(destination.title);
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      window.prompt("Copy this link:", destination.href);
    }
  };

  const shareLink = async (destination: QrDestination) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${destination.title} | GigitekAI`,
          text: destination.description,
          url: destination.href,
        });
        return;
      } catch {
        // The share sheet may be dismissed; preserve a useful fallback without treating it as an error.
      }
    }
    await copyLink(destination);
  };

  return (
    <div className="min-h-screen bg-[#070C17] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070C17]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Gigitek<span className="text-[#00D4FF]">AI</span>
          </a>
          <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#7DD3FC]">
            <QrCode className="h-4 w-4" /> QR HUB
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        <div className="mb-9 max-w-2xl sm:mb-12">
          <p className="mb-3 text-xs font-semibold tracking-[0.17em] text-[#00D4FF]">PROSPECT SHARING TOOL</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The right GigitekAI link, ready to show or share.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Tap a QR code to open its destination on your phone. Show the code to a prospect, copy the link into a text message, or use the share button.
          </p>
        </div>

        <div className="mb-8 flex items-start gap-3 border border-[#00D4FF]/25 bg-[#00D4FF]/[0.06] p-4 text-sm leading-6 text-slate-200">
          <ScanLine className="mt-0.5 h-5 w-5 shrink-0 text-[#00D4FF]" />
          <p><strong className="text-white">Phone tip:</strong> Tap a code to test its destination yourself. To give a prospect the QR, show this screen, share the link, or take a screenshot of the specific card.</p>
        </div>

        <section className="grid gap-5 sm:grid-cols-2" aria-label="GigitekAI QR codes">
          {destinations.map(destination => {
            const Icon = destination.icon;
            const isCopied = copied === destination.title;

            return (
              <article key={destination.title} className="overflow-hidden border border-white/10 bg-[#0B1424]">
                <a
                  href={destination.href}
                  className="group flex min-h-[188px] items-center gap-4 p-5 active:bg-white/[0.03] sm:p-6"
                  aria-label={`Open ${destination.title}`}
                >
                  <div className="shrink-0 border border-white/10 bg-white p-1.5 shadow-[0_0_28px_rgba(0,212,255,0.08)]">
                    <img src={destination.image} alt={`${destination.title} QR code`} className="h-28 w-28 object-contain sm:h-32 sm:w-32" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em]" style={{ color: destination.accent }}>
                      <Icon className="h-4 w-4" /> {destination.eyebrow.toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{destination.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{destination.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF] group-hover:gap-3">
                      Tap code to open <ExternalLink className="h-4 w-4" />
                    </span>
                  </div>
                </a>

                <div className="grid grid-cols-3 border-t border-white/10">
                  <a href={destination.href} className="flex min-h-12 items-center justify-center gap-2 border-r border-white/10 text-xs font-semibold text-slate-200 active:bg-white/[0.05]" aria-label={`Open ${destination.title}`}>
                    <ExternalLink className="h-4 w-4" /> Open
                  </a>
                  <button type="button" onClick={() => void copyLink(destination)} className="flex min-h-12 items-center justify-center gap-2 border-r border-white/10 text-xs font-semibold text-slate-200 active:bg-white/[0.05]" aria-label={`Copy ${destination.title} link`}>
                    {isCopied ? <Check className="h-4 w-4 text-[#34D399]" /> : <Copy className="h-4 w-4" />}
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                  <button type="button" onClick={() => void shareLink(destination)} className="flex min-h-12 items-center justify-center gap-2 text-xs font-semibold text-slate-200 active:bg-white/[0.05]" aria-label={`Share ${destination.title}`}>
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
