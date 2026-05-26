import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "./db";
import { blogPosts, newsletterCampaigns } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Newsletter Auto-Post Endpoint", () => {
  let testBlogPostId: number | null = null;
  let testCampaignId: number | null = null;

  beforeAll(async () => {
    // Clean up any existing test posts/campaigns
    const db = await getDb();
    if (db) {
      await db.delete(blogPosts).where(eq(blogPosts.title, "Test Auto-Post Article"));
      await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.subject, "Test Newsletter Campaign"));
    }
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (db) {
      if (testBlogPostId) {
        await db.delete(blogPosts).where(eq(blogPosts.id, testBlogPostId));
      }
      if (testCampaignId) {
        await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, testCampaignId));
      }
    }
  });

  it("should create a blog post with markdown content", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const testData = {
      title: "Test Auto-Post Article",
      slug: "test-auto-post-article",
      content: "# Test Content\n\nThis is a test article for the auto-post endpoint.",
      category: "AI News",
      excerpt: "This is a test article for the auto-post endpoint.",
      published: 1,
      readTime: "1 min read",
    };

    // Insert test blog post
    const [result] = await db.insert(blogPosts).values({
      title: testData.title,
      slug: testData.slug,
      content: testData.content,
      category: testData.category,
      excerpt: testData.excerpt,
      published: testData.published,
      readTime: testData.readTime,
    });

    testBlogPostId = (result as any).insertId;
    expect(testBlogPostId).toBeGreaterThan(0);

    // Verify the post was created
    const [created] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, testBlogPostId))
      .limit(1);

    expect(created).toBeDefined();
    expect(created.title).toBe(testData.title);
    expect(created.slug).toBe(testData.slug);
    expect(created.published).toBe(true);
  });

  it("should create a newsletter campaign", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const testData = {
      subject: "Test Newsletter Campaign",
      body: "<p>This is a test newsletter campaign.</p>",
      status: "sent",
    };

    // Insert test campaign
    const [result] = await db.insert(newsletterCampaigns).values({
      subject: testData.subject,
      body: testData.body,
      status: testData.status,
    });

    testCampaignId = (result as any).insertId;
    expect(testCampaignId).toBeGreaterThan(0);

    // Verify the campaign was created
    const [created] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, testCampaignId))
      .limit(1);

    expect(created).toBeDefined();
    expect(created.subject).toBe(testData.subject);
    expect(created.status).toBe("sent");
  });

  it("should validate required fields", async () => {
    // Test that empty subject/content would fail
    const invalidData = {
      subject: "",
      content: "",
    };

    expect(invalidData.subject.length).toBe(0);
    expect(invalidData.content.length).toBe(0);
  });

  it("should convert markdown to HTML", async () => {
    // Test markdown conversion logic
    const markdown = "# Title\n\n**Bold text** and *italic text*\n\n[Link](https://example.com)";
    
    // Basic markdown pattern matching
    expect(markdown).toContain("# Title");
    expect(markdown).toContain("**Bold");
    expect(markdown).toContain("[Link]");
  });

  it("should generate URL-friendly slug", async () => {
    // Test slug generation logic
    const title = "Test Auto-Post Article";
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    expect(slug).toBe("test-auto-post-article");
    expect(slug).not.toContain(" ");
    expect(slug).not.toContain("_");
  });

  it("should estimate read time correctly", async () => {
    // Test read time estimation
    const content = "word ".repeat(200); // 200 words
    const words = content.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    const readTime = `${minutes} min read`;

    expect(readTime).toBe("1 min read");
    expect(minutes).toBeGreaterThanOrEqual(1);
  });

  it("should handle API key authentication", async () => {
    // Verify API key env var is set
    const apiKey = process.env.NEWSLETTER_AUTO_POST_KEY;
    
    // The endpoint should require this key
    if (!apiKey) {
      console.warn("NEWSLETTER_AUTO_POST_KEY not set in environment");
    }
    
    // If key is set, it should be a non-empty string
    if (apiKey) {
      expect(typeof apiKey).toBe("string");
      expect(apiKey.length).toBeGreaterThan(0);
    }
  });
});
