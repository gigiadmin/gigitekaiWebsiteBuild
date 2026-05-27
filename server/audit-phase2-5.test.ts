import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Phase 2-5 Audit Remediation", () => {
  // Phase 2: Credibility & Content
  describe("Phase 2: Blog Dark Theme", () => {
    it("Blog.tsx should use dark backgrounds, not white", () => {
      const blogPath = path.resolve(__dirname, "../client/src/pages/Blog.tsx");
      const content = fs.readFileSync(blogPath, "utf-8");
      // Should not have bg-white as main background
      expect(content).not.toMatch(/className="[^"]*bg-white[^"]*">\s*<div class/);
      // Should have dark backgrounds
      expect(content).toMatch(/bg-\[#0A0E1A\]|bg-\[#0F1629\]|bg-\[#141B2D\]/);
    });
  });

  describe("Phase 2: CTA Remapping", () => {
    it("ServicesSection should link Explore All Capabilities to /services", () => {
      const servicesPath = path.resolve(__dirname, "../client/src/components/ServicesSection.tsx");
      const content = fs.readFileSync(servicesPath, "utf-8");
      expect(content).toContain('href="/services"');
    });

    it("Service cards should have keyword-rich CTA text", () => {
      const servicesPath = path.resolve(__dirname, "../client/src/components/ServicesSection.tsx");
      const content = fs.readFileSync(servicesPath, "utf-8");
      // Should have specific CTAs, not just generic "Learn More"
      expect(content).toMatch(/Explore|Discover|Get|See|View/);
    });
  });

  describe("Phase 2: Contact Form Anti-Spam", () => {
    it("Contact.tsx should have honeypot field", () => {
      const contactPath = path.resolve(__dirname, "../client/src/pages/Contact.tsx");
      const content = fs.readFileSync(contactPath, "utf-8");
      expect(content).toMatch(/honeypot|website_url|hp_field/i);
    });
  });

  // Phase 3: Technical SEO
  describe("Phase 3: Sitemap", () => {
    it("sitemap.xml should use apex domain gigitekai.com", () => {
      const sitemapPath = path.resolve(__dirname, "../client/public/sitemap.xml");
      const content = fs.readFileSync(sitemapPath, "utf-8");
      expect(content).toContain("https://gigitekai.com");
      // Should not have www prefix (apex domain is canonical)
      expect(content).not.toContain("https://www.gigitekai.com");
    });

    it("sitemap.xml should not contain fragment URLs (#)", () => {
      const sitemapPath = path.resolve(__dirname, "../client/public/sitemap.xml");
      const content = fs.readFileSync(sitemapPath, "utf-8");
      expect(content).not.toMatch(/<loc>[^<]*#[^<]*<\/loc>/);
    });

    it("sitemap.xml should include /services and /services/microsoft-365", () => {
      const sitemapPath = path.resolve(__dirname, "../client/public/sitemap.xml");
      const content = fs.readFileSync(sitemapPath, "utf-8");
      expect(content).toContain("/services</loc>");
      expect(content).toContain("/services/microsoft-365");
    });
  });

  describe("Phase 3: Schema Markup", () => {
    it("index.html should have LocalBusiness schema", () => {
      const indexPath = path.resolve(__dirname, "../client/index.html");
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain("LocalBusiness");
      expect(content).toContain("Tampa");
    });
  });

  describe("Phase 3: Twitter Meta Tags", () => {
    it("index.html should have twitter:site and twitter:creator", () => {
      const indexPath = path.resolve(__dirname, "../client/index.html");
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain('name="twitter:site"');
      expect(content).toContain('name="twitter:creator"');
    });
  });

  describe("Phase 3: Robots.txt", () => {
    it("robots.txt should reference gigitekai.com sitemap", () => {
      const robotsPath = path.resolve(__dirname, "../client/public/robots.txt");
      const content = fs.readFileSync(robotsPath, "utf-8");
      expect(content).toContain("https://gigitekai.com/sitemap.xml");
    });
  });

  // Phase 3: Microsoft 365 Service Page
  describe("Phase 3: Microsoft 365 Service Page", () => {
    it("ServiceDetail.tsx should have microsoft-365 service data", () => {
      const sdPath = path.resolve(__dirname, "../client/src/pages/ServiceDetail.tsx");
      const content = fs.readFileSync(sdPath, "utf-8");
      expect(content).toContain('"microsoft-365"');
      expect(content).toMatch(/Microsoft 365|M365/);
    });
  });

  // Phase 3: /services Overview Page
  describe("Phase 3: Services Overview Page", () => {
    it("Services.tsx page should exist", () => {
      const servicesPath = path.resolve(__dirname, "../client/src/pages/Services.tsx");
      expect(fs.existsSync(servicesPath)).toBe(true);
    });

    it("App.tsx should have /services route", () => {
      const appPath = path.resolve(__dirname, "../client/src/App.tsx");
      const content = fs.readFileSync(appPath, "utf-8");
      expect(content).toContain("/services");
    });
  });

  // Phase 4: Content Expansion
  describe("Phase 4: About Us Expansion", () => {
    it("AboutUs.tsx should have Founder Spotlight section", () => {
      const aboutPath = path.resolve(__dirname, "../client/src/pages/AboutUs.tsx");
      const content = fs.readFileSync(aboutPath, "utf-8");
      expect(content).toContain("Founder Spotlight");
      expect(content).toContain("Harry Henry Santiago");
    });

    it("AboutUs.tsx should have Vendor Ecosystem section", () => {
      const aboutPath = path.resolve(__dirname, "../client/src/pages/AboutUs.tsx");
      const content = fs.readFileSync(aboutPath, "utf-8");
      expect(content).toContain("Vendor Ecosystem");
      expect(content).toContain("Sherweb");
      expect(content).toContain("ConnectSecure");
    });

    it("AboutUs.tsx should have Frameworks & Standards section", () => {
      const aboutPath = path.resolve(__dirname, "../client/src/pages/AboutUs.tsx");
      const content = fs.readFileSync(aboutPath, "utf-8");
      expect(content).toContain("Frameworks");
      expect(content).toContain("NIST");
      expect(content).toContain("Zero Trust");
      expect(content).toContain("ITIL");
    });
  });

  // Phase 5: Unverifiable Claims
  describe("Phase 5: Unverifiable Claims Removed", () => {
    it("AboutUs.tsx should not claim 500+ clients or 50+ team", () => {
      const aboutPath = path.resolve(__dirname, "../client/src/pages/AboutUs.tsx");
      const content = fs.readFileSync(aboutPath, "utf-8");
      expect(content).not.toContain("500+");
      expect(content).not.toMatch(/50\+ specialists|50\+ Team/);
    });

    it("LeadMagnetsSection should not claim 100K downloads or 500+ MSPs", () => {
      const lmPath = path.resolve(__dirname, "../client/src/components/LeadMagnetsSection.tsx");
      const content = fs.readFileSync(lmPath, "utf-8");
      expect(content).not.toContain("100K+");
      expect(content).not.toContain("500+ MSPs");
      expect(content).not.toContain("4.9★");
    });

    it("TestimonialSection should not claim 150+ Happy Clients", () => {
      const tsPath = path.resolve(__dirname, "../client/src/components/TestimonialSection.tsx");
      const content = fs.readFileSync(tsPath, "utf-8");
      expect(content).not.toContain("150+");
      expect(content).not.toContain("Happy Clients");
    });

    it("IndustryBenchmarksWidget should not claim 500+ organizations survey", () => {
      const ibPath = path.resolve(__dirname, "../client/src/components/IndustryBenchmarksWidget.tsx");
      const content = fs.readFileSync(ibPath, "utf-8");
      expect(content).not.toContain("500+ organizations");
    });
  });

  // Phase 3: Font Loading
  describe("Phase 3: Font Loading Optimization", () => {
    it("index.html should have preconnect for Google Fonts", () => {
      const indexPath = path.resolve(__dirname, "../client/index.html");
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain('rel="preconnect"');
      expect(content).toContain("fonts.googleapis.com");
    });
  });

  // SEO Config
  describe("SEO Configuration", () => {
    it("seoConfig.ts should have entries for /services and /services/microsoft-365", () => {
      const seoPath = path.resolve(__dirname, "../client/src/lib/seoConfig.ts");
      const content = fs.readFileSync(seoPath, "utf-8");
      expect(content).toContain('"/services"');
      expect(content).toContain('"/services/microsoft-365"');
    });
  });
});
