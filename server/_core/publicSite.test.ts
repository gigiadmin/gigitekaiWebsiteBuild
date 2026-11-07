import { describe, expect, it } from "vitest";
import { getPublicRedirect, isProtectedPath, isPublicSiteRoute, PUBLIC_REDIRECTS } from "./publicSite";

describe("public site routing", () => {
  it("serves marketing routes from the public bundle", () => {
    for (const p of ["/", "/services", "/services/ai", "/services/microsoft-365", "/about", "/contact", "/blog", "/blog/some-post", "/services/"]) {
      expect(isPublicSiteRoute(p), p).toBe(true);
    }
  });

  it("never claims admin, API, auth or operational routes", () => {
    for (const p of [
      "/admin",
      "/admin/login",
      "/admin/dashboard",
      "/mainx",
      "/api/trpc/blog.listPosts",
      "/api/oauth/callback",
      "/helpdesk",
      "/helpdesk/tickets/12",
      "/support",
      "/support/lookup",
      "/kb",
      "/kb/123",
      "/client/onboarding",
      "/accept-invite",
      "/logout",
      "/redirect.html",
      "/smart-home",
      "/ai-news",
    ]) {
      expect(isPublicSiteRoute(p), p).toBe(false);
    }
  });

  it("redirects retired marketing URLs to relevant replacements, never to the homepage", () => {
    expect(getPublicRedirect("/ai-demo")).toBe("/services/ai");
    expect(getPublicRedirect("/about-us")).toBe("/about");
    expect(getPublicRedirect("/services/data")).toBe("/services");
    expect(getPublicRedirect("/technology-assessment/")).toBe("/contact");
    expect(getPublicRedirect("/pricing")).toBe("/services");
    expect(getPublicRedirect("/websites/finance")).toBe("/services");
    expect(getPublicRedirect("/industries/healthcare")).toBe("/services");
    expect(getPublicRedirect("/managed-it-services-tampa")).toBe("/services/managed");
    for (const target of Object.values(PUBLIC_REDIRECTS)) {
      expect(target).not.toBe("/");
      expect(getPublicRedirect(target), `redirect loop for ${target}`).toBeNull();
    }
  });

  it("does not redirect protected or retained routes", () => {
    for (const p of ["/admin", "/api/health", "/helpdesk", "/support", "/kb", "/smart-home", "/ai-news", "/blog", "/"]) {
      expect(getPublicRedirect(p), p).toBeNull();
    }
    expect(isProtectedPath("/admin/anything")).toBe(true);
    expect(isProtectedPath("/administrators")).toBe(false);
  });
});
