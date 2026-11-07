import { Link } from "wouter";
import { PAGE_SEO, SERVICES } from "../site.config";
import { IconChevron, ServiceIcon } from "../components/Icon";
import { CtaBlock, Section } from "../components/ui";
import { usePageMeta } from "../components/Seo";

export default function Services() {
  usePageMeta({ ...PAGE_SEO["/services"], path: "/services" });
  return (
    <>
      <section className="section section--hero" style={{ paddingBottom: 72 }}>
        <div className="container">
          <div className="stack stack-24 measure-wide">
            <p className="eyebrow">Services</p>
            <h1 className="display">Everything your business runs on, handled by one team.</h1>
            <p className="lead measure">
              Most businesses don’t need more vendors. They need support, Microsoft 365, security, cloud, and automation planned together —
              with one partner accountable for the result.
            </p>
          </div>
        </div>
      </section>

      <Section alt>
        <ul className="rows">
          {SERVICES.map((s) => (
            <li key={s.slug}>
              <Link href={`/services/${s.slug}`} className="service-row">
                <span className="service-row__icon">
                  <ServiceIcon name={s.icon} />
                </span>
                <span className="service-row__name">{s.name}</span>
                <span className="service-row__desc">{s.summary}</span>
                <IconChevron className="chev" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="split split--13">
          <h2 className="h-sub">Where to start</h2>
          <div className="stack stack-24">
            <p className="body-lg">
              <strong style={{ color: "var(--fg)" }}>If nobody owns your IT today,</strong> start with Managed IT Services. We document the environment,
              standardize devices and access, and take on support.
            </p>
            <p className="body-lg">
              <strong style={{ color: "var(--fg)" }}>If you already have IT support but Microsoft 365 is a mess,</strong> start with a Microsoft 365
              assessment. Identity, licensing, and collaboration structure usually hold the quickest wins.
            </p>
            <p className="body-lg">
              <strong style={{ color: "var(--fg)" }}>If you’re worried about security or a compliance requirement,</strong> start with Cybersecurity &amp;
              Backup. Identity and email protection come first; tested recovery follows.
            </p>
            <p className="body-lg">
              <strong style={{ color: "var(--fg)" }}>If a repetitive process is eating your team’s time,</strong> start with AI Agents &amp; Automation.
              One workflow, a measurable outcome, human approval where it matters.
            </p>
            <p className="body-lg">
              <strong style={{ color: "var(--fg)" }}>If servers are aging out or cloud bills don’t add up,</strong> start with Cloud Infrastructure. We plan
              before we move anything.
            </p>
            <p className="body">
              Technology strategy and fractional CTO support are available within any of these engagements for businesses that need a senior
              technical lead without a full-time hire.
            </p>
          </div>
        </div>
      </Section>

      <CtaBlock alt heading="Not sure which service fits?" body="Describe what’s going wrong — or what you want to improve — and we’ll point you to a sensible first step." />
    </>
  );
}
