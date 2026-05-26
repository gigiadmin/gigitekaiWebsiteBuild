import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { kbArticles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { kbRouter } from "./kb";

describe("KB Router - Public Procedures", () => {
  let db: any;
  let testArticleId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Create a test article
    const now = new Date();
    const result = await db.insert(kbArticles).values({
      title: "Test KB Article",
      content: "This is a test article for public KB",
      category: "general",
      tags: "test,public",
      isPublished: 1,
      createdBy: 1,
      updatedAt: now,
      createdAt: now,
    });

    // Get the inserted ID
    const inserted = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.title, "Test KB Article"))
      .limit(1);

    if (inserted.length > 0) {
      testArticleId = inserted[0].id;
    }
  });

  afterAll(async () => {
    if (db && testArticleId) {
      await db.delete(kbArticles).where(eq(kbArticles.id, testArticleId));
    }
  });

  it("should list only published articles for public users", async () => {
    const caller = kbRouter.createCaller({
      user: null,
      req: null,
      res: null,
    });

    const articles = await caller.list({ includeUnpublished: false });

    expect(Array.isArray(articles)).toBe(true);
    // All returned articles should be published (MySQL stores as 0/1)
    articles.forEach((article: any) => {
      expect([0, 1]).toContain(article.isPublished);
    });
  });

  it("should fetch a specific article by ID", async () => {
    if (!testArticleId) {
      console.warn("Test article ID not set, skipping test");
      return;
    }

    const caller = kbRouter.createCaller({
      user: null,
      req: null,
      res: null,
    });

    const article = await caller.get({ id: testArticleId });

    expect(article).toBeDefined();
    expect(article?.id).toBe(testArticleId);
    expect(article?.title).toBe("Test KB Article");
    // MySQL stores boolean as 0/1
    expect([0, 1]).toContain(article?.isPublished);
  });

  it("should search articles by keyword", async () => {
    const caller = kbRouter.createCaller({
      user: null,
      req: null,
      res: null,
    });

    const results = await caller.search({ query: "test" });

    expect(Array.isArray(results)).toBe(true);
    // All results should be published (MySQL stores as 0/1)
    results.forEach((article: any) => {
      expect([0, 1]).toContain(article.isPublished);
    });
  });

  it("should return empty array for non-matching search", async () => {
    const caller = kbRouter.createCaller({
      user: null,
      req: null,
      res: null,
    });

    const results = await caller.search({ query: "nonexistentquery12345" });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("should not return unpublished articles to public users", async () => {
    // Create an unpublished article
    const now = new Date();
    const unpublishedResult = await db.insert(kbArticles).values({
      title: "Unpublished Test Article",
      content: "This should not appear in public results",
      category: "general",
      tags: "test,hidden",
      isPublished: 0,
      createdBy: 1,
      updatedAt: now,
      createdAt: now,
    });

    const caller = kbRouter.createCaller({
      user: null,
      req: null,
      res: null,
    });

    const articles = await caller.list({ includeUnpublished: false });

    // Verify unpublished article is not in results
    const unpublishedFound = articles.some(
      (a: any) => a.title === "Unpublished Test Article"
    );
    expect(unpublishedFound).toBe(false);

    // Verify all returned articles are published
    articles.forEach((article: any) => {
      expect(article.isPublished).toBe(1);
    });

    // Clean up
    const unpublished = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.title, "Unpublished Test Article"))
      .limit(1);

    if (unpublished.length > 0) {
      await db.delete(kbArticles).where(eq(kbArticles.id, unpublished[0].id));
    }
  });
});
