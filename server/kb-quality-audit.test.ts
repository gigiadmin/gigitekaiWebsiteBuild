import { describe, expect, it } from "vitest";
import { extractKbReferenceUrls, findDuplicateKbTitles, kbTitleSimilarity, normalizeKbTitle } from "./services/kbQualityAudit";

describe("Knowledge Base quality audit", () => {
  it("normalizes equivalent Microsoft 365 titles", () => {
    expect(normalizeKbTitle("Configure Microsoft 365 Copilot for the Tenant"))
      .toBe("configure m365 copilot tenant");
  });

  it("flags semantically overlapping titles without flagging unrelated topics", () => {
    const findings = findDuplicateKbTitles([
      { id: 1, title: "Troubleshoot Microsoft Copilot License Assignment Delays" },
      { id: 2, title: "Troubleshooting Microsoft Copilot License Assignment Delay" },
      { id: 3, title: "Configure Data Loss Prevention Policies for Copilot" },
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].firstId).toBe(1);
    expect(kbTitleSimilarity("Copilot tenant readiness checklist", "Copilot Studio agent debugging")).toBeLessThan(0.5);
  });

  it("deduplicates references extracted from article content and source fields", () => {
    const urls = extractKbReferenceUrls([
      { sourceUrl: "https://learn.microsoft.com/copilot", content: "See [Docs](https://learn.microsoft.com/copilot)." },
      { sourceUrl: null, content: "Also review https://support.microsoft.com/copilot" },
    ]);
    expect(urls).toEqual([
      "https://learn.microsoft.com/copilot",
      "https://support.microsoft.com/copilot",
    ]);
  });
});
