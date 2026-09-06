import { describe, expect, it } from "vitest";
import { isKnownRoute } from "./prerenderMiddleware";

describe("production SPA route allowlist", () => {
  it.each([
    "/",
    "/kb",
    "/qr",
    "/qr/",
    "/connect",
    "/connect/",
  ])("serves %s as a known public route", route => {
    expect(isKnownRoute(route)).toBe(true);
  });

  it("continues to reject unknown paths", () => {
    expect(isKnownRoute("/this-route-does-not-exist")).toBe(false);
  });

  it("keeps current lead-generation entry points in the production allowlist", () => {
    expect(isKnownRoute("/web-discovery-intake")).toBe(true);
    expect(isKnownRoute("/free-audit")).toBe(true);
    expect(isKnownRoute("/contact")).toBe(true);
  });

  it.each([
    "/fractional-cto-ai-strategy",
    "/business-technology-launch",
    "/service-comparison",
    "/roi-calculator",
    "/technology-assessment",
    "/trust-center",
    "/ai-workflows",
    "/resources",
    "/client/onboarding",
    "/assessment/report/example-token",
  ])("serves the website expansion route %s", route => {
    expect(isKnownRoute(route)).toBe(true);
  });

  it.each([
    "/industries/legal",
    "/industries/construction",
    "/industries/nonprofits",
    "/industries/professional-services",
    "/industries/tampa-small-business",
  ])("serves the new industry route %s", route => {
    expect(isKnownRoute(route)).toBe(true);
  });
});
