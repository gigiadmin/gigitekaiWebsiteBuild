import { ABOUT, HOW_WE_WORK, PAGE_SEO, SITE } from "../site.config";
import { CtaBlock, Section, Steps } from "../components/ui";
import { usePageMeta } from "../components/Seo";

export default function About() {
  usePageMeta({ ...PAGE_SEO["/about"], path: "/about" });
  return (
    <>
      <section className="section section--hero" style={{ paddingBottom: 96 }}>
        <div className="container">
          <div className="stack stack-24 measure-wide">
            <p className="eyebrow">About {SITE.name}</p>
            <h1 className="display">{ABOUT.headline}</h1>
            <p className="lead measure">{ABOUT.intro}</p>
          </div>
        </div>
      </section>

      <Section alt>
        <div className="split split--13">
          <h2 className="h-sub">Who we are</h2>
          <div className="stack stack-24">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} className="body-lg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="split split--13">
          <h2 className="h-sub">How we operate</h2>
          <ul className="grid-2">
            {ABOUT.values.map((v) => (
              <li key={v.title} className="point">
                <span className="title-md">{v.title}</span>
                <span className="small">{v.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section alt>
        <div className="stack stack-56">
          <h2 className="h-section">How we work with you.</h2>
          <Steps items={HOW_WE_WORK} />
        </div>
      </Section>

      <Section>
        <div className="split split--13">
          <h2 className="h-sub">Where we work</h2>
          <div className="stack stack-12">
            <p className="body-lg">
              {SITE.name} is based in {SITE.region} and serves {SITE.serviceArea.toLowerCase()}. Most of our work is delivered remotely; on-site
              support is arranged where it adds value.
            </p>
          </div>
        </div>
      </Section>

      <CtaBlock alt heading="Talk to the people who’ll do the work." body="No sales layer. You’ll speak with the engineer responsible for your environment." />
    </>
  );
}
