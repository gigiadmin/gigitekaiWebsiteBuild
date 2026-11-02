import type { ReactNode } from "react";
import { Link } from "wouter";
import { CONTACT } from "../site.config";
import type { ServiceFaq } from "../site.config";
import { IconArrow, IconBack, IconPlus } from "./Icon";

/* Section wrapper */
export function Section({
  children,
  alt,
  tight,
  id,
  className = "",
}: {
  children: ReactNode;
  alt?: boolean;
  tight?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`section${alt ? " section--alt" : ""}${tight ? " section--tight" : ""} ${className}`.trim()}>
      <div className="container">{children}</div>
    </section>
  );
}

/* Arrow text link */
export function ArrowLink({ href, children, back }: { href: string; children: ReactNode; back?: boolean }) {
  return (
    <Link href={href} className={`link-arrow${back ? " link-arrow--back" : ""}`}>
      {back && <IconBack />}
      {children}
      {!back && <IconArrow />}
    </Link>
  );
}

/* FAQ list using native disclosure elements */
export function Faq({ items, heading }: { items: ServiceFaq[]; heading: string }) {
  return (
    <div className="stack stack-40 measure" style={{ maxWidth: 760 }}>
      <h2 className="h-section">{heading}</h2>
      <div className="rows">
        {items.map((f, i) => (
          <details key={i} className="faq">
            <summary>
              {f.q}
              <IconPlus />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

/* Final CTA block — email + phone only (no forms or booking widgets) */
export function CtaBlock({ heading, body, alt }: { heading: string; body: string; alt?: boolean }) {
  return (
    <section className={`section section--cta${alt ? " section--alt" : ""}`}>
      <div className="container">
        <div className="stack stack-20 center measure mx-auto">
          <h2 className="h-cta">{heading}</h2>
          <p className="body-lg">{body}</p>
          <div className="cta-row" style={{ justifyContent: "center", marginTop: 12 }}>
            <a className="btn" href={`mailto:${CONTACT.email}`}>
              Email GigitekAI
            </a>
            <a href={CONTACT.phoneHref} style={{ color: "var(--fg)", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
              {CONTACT.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Numbered steps */
export function Steps({ items }: { items: ReadonlyArray<{ title: string; body: string }> }) {
  return (
    <ol className="grid-3">
      {items.map((s, i) => (
        <li key={s.title} className="step">
          <span className="step__n">{String(i + 1).padStart(2, "0")}</span>
          <span className="title-lg">{s.title}</span>
          <span className="body">{s.body}</span>
        </li>
      ))}
    </ol>
  );
}

/* Two-column heading + body intro */
export function Intro({ heading, children, as = "h2" }: { heading: string; children?: ReactNode; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <div className="stack stack-12 measure">
      <H className={as === "h1" ? "display" : "h-section"}>{heading}</H>
      {children}
    </div>
  );
}
