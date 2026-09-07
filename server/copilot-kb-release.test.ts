import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const topics = JSON.parse(fs.readFileSync(path.join(root, "content/kb/copilot-100-topics.json"), "utf8"));
const nav = fs.readFileSync(path.join(root, "client/src/components/SiteNavBar2024.tsx"), "utf8");
const gateway = fs.readFileSync(path.join(root, "client/src/components/HomeDecisionGateway.tsx"), "utf8");
const index = fs.readFileSync(path.join(root, "docs/content/Copilot_KB_Article_Index_2026-09.md"), "utf8");

describe("Copilot Knowledge Base release", () => {
  it("defines exactly 100 unique approved topics across ten balanced categories", () => {
    expect(topics).toHaveLength(100);
    expect(new Set(topics.map((topic: any) => topic.id)).size).toBe(100);
    expect(new Set(topics.map((topic: any) => topic.title.toLowerCase())).size).toBe(100);
    const categoryCounts = topics.reduce((counts: Record<string, number>, topic: any) => {
      counts[topic.category] = (counts[topic.category] || 0) + 1;
      return counts;
    }, {});
    expect(Object.keys(categoryCounts)).toHaveLength(10);
    expect(Object.values(categoryCounts).every(count => count === 10)).toBe(true);
  });

  it("publishes a release index with 100 live Knowledge Base links", () => {
    const links = index.match(/https:\/\/gigitekai\.com\/kb\/\d+/g) || [];
    expect(links).toHaveLength(100);
    expect(new Set(links).size).toBe(100);
    expect(index).toContain("support@gigitekai.com");
    expect(index).toContain("609-676-4483");
  });

  it("surfaces Insights in utility, desktop, mobile, and homepage decision paths", () => {
    expect((nav.match(/"\/insights"/g) || []).length).toBeGreaterThanOrEqual(3);
    expect(nav).toContain('label: "Insights"');
    expect(gateway).toContain('"Insights"');
    expect(gateway).toContain('"/insights"');
    expect(gateway).toContain('"insights_opened"');
  });
});
