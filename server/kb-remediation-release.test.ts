import { describe, expect, it } from "vitest";
import { resolveKbArticlePayload, resolveKbViewTarget } from "./services/kbArticleRedirectResolution";
import { buildKbAuditTrendData } from "../client/src/lib/kbAuditTrends";

describe("Knowledge Base duplicate remediation", () => {
  it("returns a published article directly without a redirect", () => {
    const article = { id: 10, isPublished: 1, title: "Canonical" };
    expect(resolveKbArticlePayload(10, article, null, null)).toMatchObject({
      id: 10,
      canonicalId: 10,
      redirectedFromId: null,
    });
  });

  it("resolves an archived article ID to a published canonical article", () => {
    const result = resolveKbArticlePayload(
      20,
      { id: 20, isPublished: 0, title: "Archived" },
      { archivedArticleId: 20, canonicalArticleId: 10 },
      { id: 10, isPublished: 1, title: "Canonical" },
    );
    expect(result).toMatchObject({ id: 10, canonicalId: 10, redirectedFromId: 20 });
    expect(resolveKbViewTarget(20, 10)).toBe(10);
  });

  it("does not expose an unpublished article without a valid published canonical target", () => {
    expect(resolveKbArticlePayload(20, { id: 20, isPublished: 0 }, null, null)).toBeNull();
    expect(resolveKbArticlePayload(
      20,
      { id: 20, isPublished: 0 },
      { archivedArticleId: 20, canonicalArticleId: 10 },
      { id: 10, isPublished: 0 },
    )).toBeNull();
  });
});

describe("Knowledge Base audit trend series", () => {
  it("uses only completed persisted runs and orders them chronologically", () => {
    const data = buildKbAuditTrendData([
      { periodKey: "2026-10", status: "completed", publishedArticles: 600, copilotArticles: 100, staleArticles: 3, checkedReferences: 40, brokenReferences: 0, blockedReferences: 1, duplicateGroups: 0 },
      { periodKey: "2026-11", status: "running", publishedArticles: 0, copilotArticles: 0, staleArticles: 0, checkedReferences: 0, brokenReferences: 0, blockedReferences: 0, duplicateGroups: 0 },
      { periodKey: "2026-09", status: "completed", publishedArticles: 622, copilotArticles: 100, staleArticles: 5, checkedReferences: 42, brokenReferences: 9, blockedReferences: 2, duplicateGroups: 63 },
    ]);

    expect(data.map(item => item.period)).toEqual(["2026-09", "2026-10"]);
    expect(data[0]).toMatchObject({ published: 622, broken: 9, duplicates: 63 });
  });

  it("preserves a legitimate single-run baseline without synthesizing history", () => {
    const data = buildKbAuditTrendData([
      { periodKey: "2026-09", status: "completed", publishedArticles: 560, copilotArticles: 100, staleArticles: 0, checkedReferences: 35, brokenReferences: 0, blockedReferences: 2, duplicateGroups: 0 },
    ]);
    expect(data).toHaveLength(1);
    expect(data[0].period).toBe("2026-09");
  });
});
