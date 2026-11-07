import { Link } from "wouter";
import { AI_USE_CASES, HOME_FAQ, HOW_WE_WORK, PAGE_SEO, SERVICES, VENDORS, WHY_POINTS } from "../site.config";
import { IconChevron, ServiceIcon } from "../components/Icon";
import { ArrowLink, CtaBlock, Faq, Section, Steps } from "../components/ui";
import { usePageMeta } from "../components/Seo";

export default function Home() {
  usePageMeta({ ...PAGE_SEO["/"], path: "/" });
  return (
    <>
      {/* Hero */}
      <section className="section section--hero">
        <div className="container">
          <div className="stack stack-24 center measure-wide mx-auto">
            <p className="eyebrow">AI-first managed IT. Built around your business.</p>
            <h1 className="display">Reliable IT. Secure Microsoft&nbsp;365. AI that gets work done.</h1>
            <p className="lead measure-narrow">
              GigitekAI helps businesses run dependable IT, strengthen security, and automate repetitive work — with experienced
              Microsoft 365 guidance from one accountable technology partner.
            </p>
            <div className="cta-row" style={{ justifyContent: "center", marginTop: 8 }}>
              <Link href="/contact" className="btn">
                Talk to GigitekAI
              </Link>
              <ArrowLink href="/services">Explore our services</ArrowLink>
            </div>
            <p className="caption" style={{ marginTop: 20 }}>
              Veteran-led. Enterprise IT experience. Human accountability.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <Section alt id="services">
        <div className="stack stack-56">
          <div className="stack stack-12 measure">
            <h2 className="h-section">Five services. One partner.</h2>
            <p className="body-lg">Support, Microsoft 365, automation, security, and cloud — planned together so nothing falls between vendors.</p>
          </div>
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
        </div>
      </Section>

      {/* Why */}
      <Section>
        <div className="split">
          <div className="stack stack-20">
            <h2 className="h-section">One partner for the systems your business depends on.</h2>
            <p className="body-lg">
              Technology works better when support, security, cloud, and automation are planned together. We help you make sensible
              decisions, fix the right problems first, and build an environment your team can rely on.
            </p>
          </div>
          <ul className="grid-2" style={{ paddingTop: 12 }}>
            {WHY_POINTS.map((p) => (
              <li key={p.title} className="point">
                <span className="title-md">{p.title}</span>
                <span className="small">{p.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Practical AI */}
      <Section alt>
        <div className="split">
          <div className="stack stack-20">
            <h2 className="h-section">Put AI to work on the tasks that slow your team down.</h2>
            <p className="body-lg">
              Start with the repetitive work. GigitekAI designs automation around your process, with access controls and human approval
              where the work requires it.
            </p>
            <ArrowLink href="/contact">Discuss an automation opportunity</ArrowLink>
          </div>
          <ul className="rows">
            {AI_USE_CASES.map((u) => (
              <li key={u} className="list-row">
                <span>{u}</span>
                <span className="caption">Example use case</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* How we work */}
      <Section>
        <div className="stack stack-56">
          <h2 className="h-section">How we work.</h2>
          <Steps items={HOW_WE_WORK} />
        </div>
      </Section>

      {/* Ecosystem */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container stack stack-24 center">
          <p className="caption">Technology we work with</p>
          <p className="vendors">{VENDORS.join("  ·  ")}</p>
        </div>
      </section>

      {/* FAQ */}
      <Section alt>
        <Faq heading="Questions, answered." items={HOME_FAQ} />
      </Section>

      <CtaBlock heading="Let’s make your technology work better." body="Tell us what is slowing your business down. We’ll help you identify a practical next step." />
    </>
  );
}
