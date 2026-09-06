import type { ReactNode } from "react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";

interface ExpansionPageShellProps {
  eyebrow: string;
  title: ReactNode;
  summary: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  children: ReactNode;
}

export default function ExpansionPageShell({
  eyebrow,
  title,
  summary,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  children,
}: ExpansionPageShellProps) {
  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <SiteNavBar2024 />
      <main>
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_78%_18%,rgba(0,212,255,0.13),transparent_34%)]">
          <div className="mx-auto max-w-7xl px-5 pb-20 pt-24 sm:px-8 lg:px-12 lg:pb-28 lg:pt-32">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.28em] text-[#00D4FF]">{eyebrow}</p>
            <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <h1 className="max-w-5xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
                  {title}
                </h1>
                <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">{summary}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <a href={primaryHref} className="inline-flex min-h-12 items-center justify-center bg-[#00D4FF] px-6 py-3 text-sm font-bold text-[#07101A] hover:bg-white">
                  {primaryLabel}
                </a>
                {secondaryLabel && secondaryHref ? (
                  <a href={secondaryHref} className="inline-flex min-h-12 items-center justify-center border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-[#00D4FF] hover:text-[#00D4FF]">
                    {secondaryLabel}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#00D4FF]">{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.025em] text-white sm:text-5xl">{title}</h2>
      {description ? <p className="mt-5 text-lg leading-8 text-slate-300">{description}</p> : null}
    </div>
  );
}
