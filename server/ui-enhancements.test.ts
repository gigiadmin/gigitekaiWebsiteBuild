import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "client/src");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("public UI enhancement release", () => {
  it("mounts the growth experience and mobile conversion bar on the homepage", () => {
    const home = read("pages/Home.tsx");
    expect(home).toContain("<GrowthExperienceSections />");
    expect(home).toContain("<MobileConversionBar />");
  });

  it("includes every approved conversion and trust module", () => {
    const sections = read("components/GrowthExperienceSections.tsx");
    expect(sections).toContain("START WITH THE OUTCOME");
    expect(sections).toContain("AI + IT READINESS CHECK");
    expect(sections).toContain("ENGAGEMENT PATHS");
    expect(sections).toContain("OPERATING MODEL");
    expect(sections).toContain("BUILT AROUND YOUR OPERATING REALITY");
    expect(sections).toContain("CLIENT JOURNEY");
    expect(sections).toContain("OPERATIONAL PROOF");
    expect(sections).toContain("trpc.contact.submit.useMutation");
  });

  it("uses only established public destinations for new homepage links", () => {
    const sections = read("components/GrowthExperienceSections.tsx");
    expect(sections).not.toContain('/industries/professional-services');
    expect(sections).not.toContain('/industries/nonprofits');
    expect(sections).not.toContain('/industries/smb');
    expect(sections).toContain('href: "/industries/healthcare"');
    expect(sections).toContain('href: "/industries"');
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
