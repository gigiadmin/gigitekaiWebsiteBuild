/**
 * Tests for prerenderMiddleware SEO enhancements:
 * - Real HTTP 404 status codes for unknown routes
 * - Noindex for Daily Recap blog posts
 * - /about metadata in ROUTE_SEO
 * - Industry pages in route validation
 */
import { describe, it, expect } from "vitest";

// Import the exported utilities from prerenderMiddleware
import {
  ROUTE_SEO,
  SERVICE_SLUGS,
  INDUSTRY_SLUGS,
  isKnownRoute,
  getRouteSEO,
} from "../server/_core/prerenderMiddleware";

describe("prerenderMiddleware SEO", () => {
  describe("ROUTE_SEO map", () => {
    it("should have unique metadata for /about", () => {
      expect(ROUTE_SEO["/about"]).toBeDefined();
      expect(ROUTE_SEO["/about"].title).toContain("About");
      expect(ROUTE_SEO["/about"].description.length).toBeGreaterThan(50);
    });

    it("should have metadata for all core marketing pages", () => {
      const corePages = ["/", "/services", "/pricing", "/contact", "/blog", "/ai-news"];
      for (const page of corePages) {
        expect(ROUTE_SEO[page]).toBeDefined();
        expect(ROUTE_SEO[page].title).toBeTruthy();
        expect(ROUTE_SEO[page].description).toBeTruthy();
      }
    });
  });

  describe("SERVICE_SLUGS", () => {
    it("should contain all 7 service slugs", () => {
      const expected = ["microsoft-365", "cloud", "ai", "security", "managed", "data", "strategy"];
      for (const slug of expected) {
        expect(SERVICE_SLUGS[slug]).toBeDefined();
      }
    });
  });

  describe("INDUSTRY_SLUGS", () => {
    it("should contain all 6 industry slugs", () => {
      const expected = ["healthcare", "financial", "manufacturing", "retail", "government", "education"];
      for (const slug of expected) {
        expect(INDUSTRY_SLUGS[slug]).toBeDefined();
      }
    });
  });

  describe("isKnownRoute (sync)", () => {
    it("should return true for known static routes", () => {
      expect(isKnownRoute("/")).toBe(true);
      expect(isKnownRoute("/services")).toBe(true);
      expect(isKnownRoute("/about")).toBe(true);
      expect(isKnownRoute("/search")).toBe(true);
      expect(isKnownRoute("/industries")).toBe(true);
    });

    it("should return true for valid service sub-routes", () => {
      expect(isKnownRoute("/services/ai")).toBe(true);
      expect(isKnownRoute("/services/cloud")).toBe(true);
      expect(isKnownRoute("/services/microsoft-365")).toBe(true);
    });

    it("should return false for invalid service sub-routes", () => {
      expect(isKnownRoute("/services/nonexistent")).toBe(false);
      expect(isKnownRoute("/services/hacking")).toBe(false);
    });

    it("should return true for valid industry sub-routes", () => {
      expect(isKnownRoute("/industries/healthcare")).toBe(true);
      expect(isKnownRoute("/industries/financial")).toBe(true);
      expect(isKnownRoute("/industries/education")).toBe(true);
    });

    it("should return false for invalid industry sub-routes", () => {
      expect(isKnownRoute("/industries/automotive")).toBe(false);
      expect(isKnownRoute("/industries/crypto")).toBe(false);
    });

    it("should return false for completely unknown routes", () => {
      expect(isKnownRoute("/this-page-does-not-exist")).toBe(false);
      expect(isKnownRoute("/random-garbage-xyz123")).toBe(false);
      expect(isKnownRoute("/admin-fake")).toBe(false);
    });

    it("should return true for admin/helpdesk prefixes (always-200)", () => {
      expect(isKnownRoute("/admin")).toBe(true);
      expect(isKnownRoute("/admin/dashboard")).toBe(true);
      expect(isKnownRoute("/helpdesk")).toBe(true);
      expect(isKnownRoute("/helpdesk/ticket/123")).toBe(true);
    });

    it("should return true for blog sub-paths (sync can't validate DB)", () => {
      expect(isKnownRoute("/blog/some-article-slug")).toBe(true);
    });

    it("should return true for ai-news numeric IDs (sync can't validate DB)", () => {
      expect(isKnownRoute("/ai-news/42")).toBe(true);
    });

    it("should return false for ai-news non-numeric paths", () => {
      expect(isKnownRoute("/ai-news/not-a-number")).toBe(false);
    });
  });

  describe("getRouteSEO", () => {
    it("should return noindex for daily-recap blog slugs", async () => {
      const seo = await getRouteSEO("/blog/daily-recap-july-18-2026");
      expect(seo).toBeDefined();
      expect(seo!.noindex).toBe(true);
    });

    it("should return noindex for daily-ai-recap blog slugs", async () => {
      const seo = await getRouteSEO("/blog/daily-ai-recap-2026-07-18");
      expect(seo).toBeDefined();
      expect(seo!.noindex).toBe(true);
    });

    it("should NOT set noindex for regular blog slugs", async () => {
      const seo = await getRouteSEO("/blog/how-to-secure-microsoft-365");
      expect(seo).toBeDefined();
      expect(seo!.noindex).toBeFalsy();
    });

    it("should generate title from blog slug", async () => {
      const seo = await getRouteSEO("/blog/managed-it-services-guide");
      expect(seo).toBeDefined();
      expect(seo!.title).toContain("Managed It Services Guide");
      expect(seo!.title).toContain("GigitekAI Blog");
    });

    it("should return SEO for service detail pages", async () => {
      const seo = await getRouteSEO("/services/ai");
      expect(seo).toBeDefined();
      expect(seo!.title).toContain("AI");
    });

    it("should return SEO for industry pages", async () => {
      const seo = await getRouteSEO("/industries/healthcare");
      expect(seo).toBeDefined();
      expect(seo!.title).toContain("Healthcare");
    });

    it("should return null for unknown routes", async () => {
      const seo = await getRouteSEO("/completely-unknown-page");
      expect(seo).toBeNull();
    });
  });
});
