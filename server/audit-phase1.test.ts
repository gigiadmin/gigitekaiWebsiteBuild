import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const CLIENT_DIR = resolve(__dirname, "../client");
const PAGES_DIR = resolve(CLIENT_DIR, "src/pages");
const COMPONENTS_DIR = resolve(CLIENT_DIR, "src/components");

/**
 * Phase 1 Audit Remediation Tests
 * Validates all launch-blocker fixes from the QA audit.
 */
describe("Phase 1 Audit: SEO & Credibility Fixes", () => {
  // 1.1 — Canonical tags
  it("index.html canonical uses gigitekai.com (non-www)", () => {
    const html = readFileSync(resolve(CLIENT_DIR, "index.html"), "utf-8");
    expect(html).toContain('href="https://gigitekai.com"');
    expect(html).not.toContain('href="https://www.gigitekai.com"');
  });

  // 1.2 — useSEO hook exists
  it("useSEO hook file exists", () => {
    const hook = readFileSync(resolve(CLIENT_DIR, "src/hooks/useSEO.ts"), "utf-8");
    expect(hook).toContain("export function useSEO");
    expect(hook).toContain("gigitekai.com");
  });

  // 1.3 — SEO config has unique entries for all major pages
  it("seoConfig.ts has unique titles for all public pages", () => {
    const config = readFileSync(resolve(CLIENT_DIR, "src/lib/seoConfig.ts"), "utf-8");
    const requiredPaths = [
      "/",
      "/about-us",
      "/blog",
      "/contact",
      "/pricing",
      "/helpdesk-pricing",
      "/helpdesk",
      "/partners",
      "/privacy-policy",
      "/terms-of-service",
    ];
    for (const path of requiredPaths) {
      expect(config).toContain(`"${path}"`);
    }
  });

  // 1.4 — SLA stat is 99.9%, not 79.99% or 99.99%
  it("StatsSection shows 99.9% SLA (not 99.99% or 79.99%)", () => {
    const stats = readFileSync(resolve(COMPONENTS_DIR, "StatsSection.tsx"), "utf-8");
    expect(stats).toContain("value: 99.9");
    expect(stats).not.toContain("value: 99.99");
    expect(stats).not.toContain("value: 79.99");
  });

  // 1.5 — Founding year: no "since 2004" in StatsSection
  it("StatsSection does not reference 'since 2004'", () => {
    const stats = readFileSync(resolve(COMPONENTS_DIR, "StatsSection.tsx"), "utf-8");
    expect(stats).not.toContain("since 2004");
  });

  // 1.6 — No notification bell in public SiteNavBar2024
  it("SiteNavBar2024 does not contain notification bell linking to /admin", () => {
    const nav = readFileSync(resolve(COMPONENTS_DIR, "SiteNavBar2024.tsx"), "utf-8");
    expect(nav).not.toContain("/admin/notifications");
    expect(nav).not.toContain("Bell");
  });

  // 1.7 — Geographic service area is consistent
  it("CTASection uses 'North America & Canada' (not South Pacific)", () => {
    const cta = readFileSync(resolve(COMPONENTS_DIR, "CTASection.tsx"), "utf-8");
    expect(cta).not.toContain("South Pacific");
    expect(cta).toContain("North America & Canada");
  });

  // 1.8 — iOS PWA start URL is /, not /admin
  it("manifest.json start_url is / (not /admin)", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(CLIENT_DIR, "public/manifest.json"), "utf-8")
    );
    expect(manifest.start_url).toBe("/");
  });

  it("index.html apple-mobile-web-app-start-url is /", () => {
    const html = readFileSync(resolve(CLIENT_DIR, "index.html"), "utf-8");
    expect(html).toContain('content="/"');
    expect(html).not.toContain('apple-mobile-web-app-start-url" content="/admin"');
  });

  it("index.html apple-mobile-web-app-title is GigitekAI (not Admin)", () => {
    const html = readFileSync(resolve(CLIENT_DIR, "index.html"), "utf-8");
    expect(html).toContain('apple-mobile-web-app-title" content="GigitekAI"');
    expect(html).not.toContain('apple-mobile-web-app-title" content="GigitekAI Admin"');
  });

  // 1.9 — Animated counters initialize with target value for Googlebot
  it("AnimatedCounter initializes with target value for SEO", () => {
    const stats = readFileSync(resolve(COMPONENTS_DIR, "StatsSection.tsx"), "utf-8");
    expect(stats).toContain("useState(target)");
  });

  // Key public pages have useSEO imported
  const pagesToCheck = [
    "Home.tsx",
    "AboutUs.tsx",
    "Blog.tsx",
    "Contact.tsx",
    "Pricing.tsx",
    "Partners.tsx",
  ];
  for (const page of pagesToCheck) {
    it(`${page} imports useSEO hook`, () => {
      const content = readFileSync(resolve(PAGES_DIR, page), "utf-8");
      expect(content).toContain("useSEO");
      expect(content).toContain("SEO_CONFIG");
    });
  }
});
