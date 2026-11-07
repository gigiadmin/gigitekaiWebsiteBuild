import { Link } from "wouter";
import { getService } from "../site.config";
import { IconCheck } from "../components/Icon";
import { ArrowLink, CtaBlock, Faq, Section, Steps } from "../components/ui";
import { usePageMeta } from "../components/Seo";
import NotFound from "./NotFound";

export default function ServiceDetail({ slug }: { slug: string }) {
  const service = getService(slug);
  if (!service) return <NotFound />;
  return <ServiceView slug={slug} />;
}

function ServiceView({ slug }: { slug: string }) {
  const s = getService(slug)!;
  usePageMeta({ ...s.seo, path: `/services/${s.slug}` });
  return (
    <>
      <section className="section section--hero" style={{ paddingBottom: 96 }}>
        <div className="container">
          <div className="stack stack-24 measure-wide">
            <ArrowLink href="/services" back>
              All services
            </ArrowLink>
            <h1 className="display">{s.headline}</h1>
            <p className="lead measure">{s.intro}</p>
            <div className="cta-row" style={{ marginTop: 8 }}>
              <Link href="/contact" className="btn">
                Talk to GigitekAI
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section alt>
        <div className="split split--13">
          <h2 className="h-sub">Problems we solve</h2>
          <ul className="grid-2" style={{ gap: "36px 32px" }}>
            {s.problems.map((p) => (
              <li key={p.title} className="point">
                <span className="title-md">{p.title}</span>
                <span className="small">{p.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <div className="split split--13">
          <h2 className="h-sub">What’s included</h2>
          <ul className="rows">
            {s.scope.map((item) => (
              <li key={item.title} className="kv">
                <span className="kv__k">{item.title}</span>
                <span className="kv__v">{item.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section alt>
        <div className="split split--13">
          <h2 className="h-sub">What you can expect</h2>
          <ul className="rows">
            {s.outcomes.map((o) => (
              <li key={o} className="list-row list-row--check">
                <IconCheck />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <div className="split split--13">
          <h2 className="h-sub">How we deliver</h2>
          <Steps items={s.approach} />
        </div>
      </Section>

      <Section alt>
        <Faq heading="Common questions" items={s.faqs} />
      </Section>

      <CtaBlock heading={s.ctaHeadline} body={s.ctaBody} />
    </>
  );
}
