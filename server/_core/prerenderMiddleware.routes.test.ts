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
});
