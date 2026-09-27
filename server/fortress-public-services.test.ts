import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Fortress public services announcement", () => {
  it("presents Fortress as a coming-soon CMMC readiness solution on the app services page", () => {
    const servicesPage = read("client/src/pages/Services.tsx");

    expect(servicesPage).toContain("Fortress");
    expect(servicesPage).toContain("CMMC Readiness");
    expect(servicesPage).toContain("Coming Soon");
    expect(servicesPage).toContain('href: "/contact"');
  });

  it("keeps the static services page aligned with the app services page", () => {
    const staticServicesPage = read("client/public/services.html");

    expect(staticServicesPage).toContain("Fortress");
    expect(staticServicesPage).toContain("CMMC Readiness");
    expect(staticServicesPage).toContain("Coming Soon");
    expect(staticServicesPage).toContain(
      'href="https://gigitekai.com/contact"'
    );
  });

  it("does not claim that Fortress is CMMC certified or compliant", () => {
    const publicServicesContent = [
      read("client/src/pages/Services.tsx"),
      read("client/public/services.html"),
    ].join("\n");

    expect(publicServicesContent).not.toMatch(/CMMC[- ]certified/i);
    expect(publicServicesContent).not.toMatch(/CMMC[- ]compliant/i);
  });
});
