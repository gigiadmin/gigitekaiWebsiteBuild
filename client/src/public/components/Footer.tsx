import { Link } from "wouter";
import { CONTACT, NAV, OPERATIONAL_LINKS, SERVICES, SITE, SOCIAL } from "../site.config";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <picture>
              <source srcSet={SITE.logo.src} type="image/webp" />
              <img src={SITE.logo.fallback} alt={SITE.logo.alt} width={SITE.logo.width} height={SITE.logo.height} loading="lazy" />
            </picture>
            <span className="muted" style={{ color: "var(--fg-2)" }}>
              {SITE.tagline} {SITE.serviceArea}. Based in {SITE.region}.
            </span>
          </div>
          <div className="footer-col">
            <span className="footer-col__title">Services</span>
            {SERVICES.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`}>
                {s.name}
              </Link>
            ))}
          </div>
          <div className="footer-col">
            <span className="footer-col__title">Company</span>
            {NAV.filter((n) => n.href !== "/").map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
            <Link href="/blog">Insights</Link>
            {OPERATIONAL_LINKS.map((l) => (
              // Operational routes are served by the existing application — use a full navigation.
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="footer-col">
            <span className="footer-col__title">Contact</span>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a>
            <span>{SITE.region}</span>
            {SOCIAL.map((s) => (
              <a key={s.href} href={s.href} rel="noopener noreferrer" target="_blank">
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {year} {SITE.legalName}. All rights reserved.
          </span>
          <span className="footer-bottom__links">
            {/* Legal pages are served as static HTML by the server — full navigation. */}
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-of-service">Terms of Service</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
