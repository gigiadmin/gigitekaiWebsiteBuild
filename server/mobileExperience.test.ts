import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readSource = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("mobile-first public experience", () => {
  it("keeps the discovery intake optimized for touch, progress, and recoverable phone completion", () => {
    const intake = readSource("client/src/pages/WebDiscoveryIntakePage.tsx");

    expect(intake).toContain('min-h-[100svh]');
    expect(intake).toContain('role="progressbar"');
    expect(intake).toContain('inputMode={field.name === "contactPhone" ? "tel" : undefined}');
    expect(intake).toContain("autoComplete={field.name === \"contactName\"");
    expect(intake).toContain('behavior: "smooth"');
    expect(intake).toContain("submissionError");
    expect(intake).toContain("Your progress is saved privately on this device.");
  });

  it("uses a reduced-motion-safe, mobile-only reveal treatment for new homepage sections", () => {
    const sections = readSource("client/src/components/EnterpriseHomeSections.tsx");
    const css = readSource("client/src/index.css");

    expect(sections).toContain("data-mobile-reveal");
    expect(sections).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("[data-mobile-reveal].is-mobile-revealed");
    expect(css).toContain("@media (max-width: 639px)");
  });
});
