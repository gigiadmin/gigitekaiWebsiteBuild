import { CONTACT, PAGE_SEO, SERVICES, SITE } from "../site.config";
import { Section } from "../components/ui";
import { usePageMeta } from "../components/Seo";
import { Link } from "wouter";

export default function Contact() {
  usePageMeta({ ...PAGE_SEO["/contact"], path: "/contact" });
  return (
    <>
      <section className="section section--hero" style={{ paddingBottom: 72 }}>
        <div className="container">
          <div className="stack stack-24 measure-wide">
            <p className="eyebrow">Contact</p>
            <h1 className="display">Tell us what’s slowing your business down.</h1>
            <p className="lead measure">
              Email or call. You’ll reach a person, not a sales sequence. We’ll ask a few questions about your environment and suggest a
              practical next step.
            </p>
          </div>
        </div>
      </section>

      <Section alt>
        <div className="split">
          <div className="stack">
            <div className="contact-card">
              <span className="caption">Email</span>
              <a className="big" href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>
              <span className="small">Best for new enquiries, project questions, and anything you’d like us to review first.</span>
            </div>
            <div className="contact-card">
              <span className="caption">Phone</span>
              <a className="big" href={CONTACT.phoneHref}>
                {CONTACT.phoneDisplay}
              </a>
              <span className="small">If we’re with a client, leave a message and we’ll return your call.</span>
            </div>
            <div className="contact-card">
              <span className="caption">Location</span>
              <span className="title-lg">{SITE.region}</span>
              <span className="small">
                {SITE.legalName}, {SITE.address.street}, {SITE.address.city}, {SITE.address.state} {SITE.address.zip}. {SITE.serviceArea}.
              </span>
            </div>
          </div>
          <div className="stack stack-24">
            <h2 className="h-sub">What to include</h2>
            <ul className="stack stack-12 body-lg">
              <li>Roughly how many people and locations you have</li>
              <li>What you run today (Microsoft 365, servers, cloud, line-of-business apps)</li>
              <li>The problem or goal that prompted you to reach out</li>
              <li>Any deadline, compliance requirement, or constraint we should know about</li>
            </ul>
            <p className="body">
              Existing clients: use the{" "}
              <a href="/support" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                client support portal
              </a>{" "}
              for tickets so your request is tracked.
            </p>
            <div className="stack stack-12" style={{ paddingTop: 12 }}>
              <span className="caption">Looking for a specific service?</span>
              <ul className="stack stack-12">
                {SERVICES.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} style={{ minHeight: 32, display: "inline-flex", alignItems: "center" }}>
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
