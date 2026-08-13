import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const nav = readFileSync(resolve(projectRoot, "client/src/components/SiteNavBar2024.tsx"), "utf8");
const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");

describe("public Knowledge Base access", () => {
  it("exposes Knowledge Base links in the desktop utility bar, desktop navigation, and mobile menu", () => {
    expect(nav).toContain('href="/kb"');
    expect(nav).toContain('label: "Knowledge Base", href: "/kb"');
    expect(nav).toContain('label: "Knowledge Base", href: "/kb", id: "nav-kb"');
  });

  it("registers the public Knowledge Base route", () => {
    expect(app).toContain('<Route path={"/kb"} component={PublicKB} />');
  });
});
