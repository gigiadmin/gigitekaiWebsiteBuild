import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateDailyAIBlogPost,
  isWeekday,
  isOneOClockPM,
} from "./dailyAIBlogGenerator";

describe("Daily AI Blog Generator", () => {
  describe("isWeekday", () => {
    it("should return true for Monday (day 1)", () => {
      // Mock Monday
      const mockDate = new Date(2026, 5, 1); // June 1, 2026 is a Monday
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
      
      expect(isWeekday()).toBe(true);
      
      vi.useRealTimers();
    });

    it("should return true for Friday (day 5)", () => {
      // Mock Friday
      const mockDate = new Date(2026, 5, 5); // June 5, 2026 is a Friday
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
      
      expect(isWeekday()).toBe(true);
      
      vi.useRealTimers();
    });

    it("should return false for Saturday (day 6)", () => {
      // Mock Saturday
      const mockDate = new Date(2026, 5, 6); // June 6, 2026 is a Saturday
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
      
      expect(isWeekday()).toBe(false);
      
      vi.useRealTimers();
    });

    it("should return false for Sunday (day 0)", () => {
      // Mock Sunday
      const mockDate = new Date(2026, 5, 7); // June 7, 2026 is a Sunday
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
      
      expect(isWeekday()).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe("isOneOClockPM", () => {
    it("should return true at 1 PM (13:00)", () => {
      vi.useFakeTimers();
      const mockDate = new Date(2026, 5, 1, 13, 0, 0); // 1 PM
      vi.setSystemTime(mockDate);
      
      expect(isOneOClockPM()).toBe(true);
      
      vi.useRealTimers();
    });

    it("should return false at 2 PM (14:00)", () => {
      vi.useFakeTimers();
      const mockDate = new Date(2026, 5, 1, 14, 0, 0); // 2 PM
      vi.setSystemTime(mockDate);
      
      expect(isOneOClockPM()).toBe(false);
      
      vi.useRealTimers();
    });

    it("should return false at 12 PM (12:00)", () => {
      vi.useFakeTimers();
      const mockDate = new Date(2026, 5, 1, 12, 0, 0); // 12 PM
      vi.setSystemTime(mockDate);
      
      expect(isOneOClockPM()).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe("generateDailyAIBlogPost", () => {
    it("should generate a blog post with required fields", async () => {
      const post = await generateDailyAIBlogPost();
      
      expect(post).toHaveProperty("title");
      expect(post).toHaveProperty("excerpt");
      expect(post).toHaveProperty("content");
      expect(post).toHaveProperty("slug");
      
      expect(typeof post.title).toBe("string");
      expect(typeof post.excerpt).toBe("string");
      expect(typeof post.content).toBe("string");
      expect(typeof post.slug).toBe("string");
      
      expect(post.title.length).toBeGreaterThan(0);
      expect(post.excerpt.length).toBeGreaterThan(0);
      expect(post.content.length).toBeGreaterThan(0);
      expect(post.slug.length).toBeGreaterThan(0);
    });

    it("should generate a slug from the title", async () => {
      const post = await generateDailyAIBlogPost();
      
      // Slug should be lowercase
      expect(post.slug).toBe(post.slug.toLowerCase());
      
      // Slug should contain hyphens, not spaces
      expect(post.slug).not.toContain(" ");
      
      // Slug should only contain alphanumeric and hyphens
      expect(/^[a-z0-9-]+$/.test(post.slug)).toBe(true);
    });

    it("should generate HTML content", async () => {
      const post = await generateDailyAIBlogPost();
      
      // Content should contain HTML tags
      expect(post.content).toMatch(/<[^>]+>/);
      
      // Should have at least one paragraph or heading
      expect(
        post.content.includes("<p>") ||
        post.content.includes("<h2>") ||
        post.content.includes("<h3>")
      ).toBe(true);
    });

    it("should focus on small business AI topics", async () => {
      const post = await generateDailyAIBlogPost();
      
      const content = `${post.title} ${post.excerpt} ${post.content}`.toLowerCase();
      
      // Should mention AI, business, or related terms
      const hasRelevantContent =
        content.includes("ai") ||
        content.includes("business") ||
        content.includes("small") ||
        content.includes("automat");
      
      expect(hasRelevantContent).toBe(true);
    });

    it("should emphasize safety and responsible AI", async () => {
      const post = await generateDailyAIBlogPost();
      
      const content = `${post.title} ${post.excerpt} ${post.content}`.toLowerCase();
      
      // Should mention safety, responsible, or best practices
      const hasSafetyContent =
        content.includes("safe") ||
        content.includes("responsible") ||
        content.includes("best practice") ||
        content.includes("mistake") ||
        content.includes("avoid");
      
      expect(hasSafetyContent).toBe(true);
    });
  });
});
