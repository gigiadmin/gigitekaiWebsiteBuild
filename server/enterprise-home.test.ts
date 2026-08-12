import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) =>
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("Enterprise homepage redesign", () => {
  it("keeps the simplified homepage composition and its critical conversion paths", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const sections = readProjectFile("client/src/components/EnterpriseHomeSections.tsx");

    expect(home).toContain("<EnterpriseHomeSections />");
    expect(home).not.toContain("<ROIPromotionSection />");
    expect(home).not.toContain("<FAQSection />");

    ["/free-audit", "/web-discovery-intake", "/services/ai", "/helpdesk"].forEach((route) => {
      expect(sections).toContain(`href=\"${route}\"`);
    });
  });

  it("keeps the four-path public navigation with utility support and client access", () => {
    const nav = readProjectFile("client/src/components/SiteNavBar2024.tsx");

    ["Solutions", "Industries", "Insights", "Company", "Support", "Client Access", "Start IT Assessment"].forEach((label) => {
      expect(nav).toContain(label);
    });

    expect(nav).toContain('href="/free-audit"');
    expect(nav).toContain("onClick={() => setServicesOpen(!servicesOpen)}");
    expect(nav).toContain("mobileSolutionsOpen");
    expect(nav).toContain('aria-controls="mobile-solutions"');
    expect(nav).not.toContain('label: "Smart Home & Automation"');
  });

  it("provides mobile-first hero actions instead of relying on compressed desktop utilities", () => {
    const hero = readProjectFile("client/src/components/HeroSection.tsx");

    expect(hero).toContain("Watch AI Work Live");
    expect(hero).toContain("Client Support");
    expect(hero).toContain("sm:hidden");
    expect(hero).toContain("min-h-[100svh]");
  });
});
