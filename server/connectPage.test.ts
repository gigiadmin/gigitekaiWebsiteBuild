import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(projectRoot, "client/src/pages/ConnectGigitekAI.tsx"), "utf8");

describe("Connect with GigitekAI page", () => {
  it("gives QR visitors direct no-login contact and conversion options", () => {
    expect(page).toContain("tel:+17273826909");
    expect(page).toContain("mailto:support@gigitekai.com");
    expect(page).toContain('href: "/web-discovery-intake"');
    expect(page).toContain('href: "/free-audit"');
    expect(page).toContain('href: "/contact-card"');
    expect(page).toContain("You do not need a LinkedIn account");
  });
});
