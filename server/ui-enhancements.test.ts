import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "client/src");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("public UI enhancement release", () => {
  it("mounts the focused decision gateway and mobile conversion bar on the homepage", () => {
    const home = read("pages/Home.tsx");
    expect(home).toContain("<HomeDecisionGateway />");
    expect(home).toContain("<MobileConversionBar />");
  });

  it("routes homepage visitors into assessments, ROI, workflows, trust, and service comparison", () => {
    const gateway = read("components/HomeDecisionGateway.tsx");
    expect(gateway).toContain("What needs to work better?");
    expect(gateway).toContain('/technology-assessment');
    expect(gateway).toContain('/roi-calculator');
    expect(gateway).toContain('/ai-workflows');
    expect(gateway).toContain('/trust-center');
    expect(gateway).toContain('/service-comparison');
  });

  it("includes the approved expansion pages and secure operational tools", () => {
    expect(read("pages/FractionalCTO.tsx")).toContain("Fractional CTO");
    expect(read("pages/SMBLaunchPackage.tsx")).toContain("Business Technology Launch");
    expect(read("pages/ServiceComparison.tsx")).toContain("Compare GigitekAI services");
    expect(read("pages/TrustCenter.tsx")).toContain("Responsible AI");
    expect(read("pages/WorkflowGallery.tsx")).toContain("Human control");
    expect(read("pages/ResourceCenter.tsx")).toContain("GigitekAI Resource Center");
    expect(read("pages/ConversionAnalyticsDashboard.tsx")).toContain("Real first-party events");
    expect(read("pages/ClientOnboardingPortal.tsx")).toContain("Never place passwords");
  });

  it("provides mobile call, assessment, and support actions", () => {
    const mobileBar = read("components/MobileConversionBar.tsx");
    expect(mobileBar).toContain("tel:+16096764483");
    expect(mobileBar).toContain('href: "/free-audit"');
    expect(mobileBar).toContain('href: "/helpdesk"');
  });

  it("shows DeepSeek status and practical suggested prompts in Aria", () => {
    const aria = read("components/AIChatWidget.tsx");
    expect(aria).toContain('/api/health/aria-provider');
    expect(aria).toContain("DeepSeek connected");
    expect(aria).toContain("What can GigitekAI automate?");
    expect(aria).toContain("How can you secure Microsoft 365?");
    expect(aria).toContain("What are your business hours?");
    expect(aria).toContain("Save chat as a text file");
    expect(aria).toContain("Clear chat history");
  });

  it("uses the approved public contact details in navigation", () => {
    const nav = read("components/SiteNavBar2024.tsx");
    const hero = read("components/HeroSection.tsx");
    const footer = read("components/Footer.tsx");
    const contactDial = read("components/FloatingContactDial.tsx");
    expect(nav).toContain("support@gigitek.com");
    expect(nav).toContain("609-676-4483");
    expect(nav).toMatch(/\bServices\b/);
    expect(nav).toContain('label: "Contact"');
    expect(hero).toContain("tel:+16096764483");
    expect(hero).toContain("mailto:support@gigitek.com");
    expect(footer).toContain("609-676-4483");
    expect(footer).toContain("support@gigitek.com");
    expect(footer).not.toContain("financial-services");
    expect(footer).not.toContain("retail-ecommerce");
    expect(contactDial).toContain("609-676-4483");
    expect(contactDial).toContain("support@gigitek.com");
  });
});
