import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "wouter";
import { NAV, NAV_CTA, SITE } from "../site.config";
import { IconClose, IconMenu } from "./Icon";

export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  // Close the menu on navigation and on Escape.
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isCurrent = (href: string) => (href === "/" ? location === "/" : location === href || location.startsWith(href + "/"));

  return (
    <header className="site-header">
      <nav className="container site-nav" aria-label="Main">
        <Link href="/" className="brand" aria-label={`${SITE.name} home`}>
          <picture>
            <source srcSet={SITE.logo.src} type="image/webp" />
            <img src={SITE.logo.fallback} alt={SITE.logo.alt} width={SITE.logo.width} height={SITE.logo.height} fetchPriority="high" />
          </picture>
        </Link>
        <ul className="nav-links">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href={NAV_CTA.href} className="btn btn--sm nav-cta">
          {NAV_CTA.label}
        </Link>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </nav>
      <div id={menuId} className="mobile-menu" data-open={open ? "true" : "false"}>
        <div className="container">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={NAV_CTA.href} className="btn">
                {NAV_CTA.label}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
