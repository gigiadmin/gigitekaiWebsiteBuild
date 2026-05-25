import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { indexContent, searchContent, getSearchSuggestions, trackSearch, trackSearchClick } from "./search";

/**
 * Search Feature Tests
 * Tests for content indexing, searching, suggestions, and analytics
 */

describe("Search Feature", () => {
  describe("indexContent", () => {
    it("should index new content successfully", async () => {
      const result = await indexContent({
        contentType: "blog",
        sourceId: "test-post-1",
        title: "Test Blog Post",
        excerpt: "This is a test blog post about cloud solutions",
        content: "Full content about cloud solutions and AI",
        url: "/blog/test-post",
        metadata: { author: "Test Author", tags: ["cloud", "ai"] },
      });

      expect(result.success).toBe(true);
    });

    it("should handle metadata with tags", async () => {
      const result = await indexContent({
        contentType: "page",
        sourceId: "test-page-1",
        title: "Cloud Solutions",
        excerpt: "Enterprise cloud infrastructure",
        content: "Detailed cloud solutions content",
        url: "/services/cloud",
        metadata: { tags: ["enterprise", "cloud", "infrastructure"] },
      });

      expect(result.success).toBe(true);
    });

    it("should update existing content", async () => {
      // First index
      await indexContent({
        contentType: "kb",
        sourceId: "test-kb-1",
        title: "Original Title",
        excerpt: "Original excerpt",
        content: "Original content",
        url: "/kb/test",
      });

      // Update same content
      const result = await indexContent({
        contentType: "kb",
        sourceId: "test-kb-1",
        title: "Updated Title",
        excerpt: "Updated excerpt",
        content: "Updated content",
        url: "/kb/test",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("searchContent", () => {
    beforeAll(async () => {
      // Index test content
      await indexContent({
        contentType: "blog",
        sourceId: "search-test-1",
        title: "Cloud Infrastructure Solutions",
        excerpt: "Learn about enterprise cloud infrastructure",
        content: "Comprehensive guide to cloud infrastructure",
        url: "/blog/cloud-infrastructure",
      });

      await indexContent({
        contentType: "service",
        sourceId: "search-test-2",
        title: "AI-Powered Automation",
        excerpt: "Automate your workflows with AI",
        content: "AI automation solutions for enterprises",
        url: "/services/ai-automation",
      });

      await indexContent({
        contentType: "kb",
        sourceId: "search-test-3",
        title: "Cloud Security Best Practices",
        excerpt: "Security guidelines for cloud deployments",
        content: "Best practices for securing cloud infrastructure",
        url: "/kb/cloud-security",
      });
    });

    it("should find content by keyword", async () => {
      const results = await searchContent("cloud");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.title.includes("Cloud"))).toBe(true);
    });

    it("should filter by content type", async () => {
      const results = await searchContent("cloud", { contentType: "blog" });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.contentType === "blog")).toBe(true);
    });

    it("should respect limit and offset", async () => {
      const page1 = await searchContent("cloud", { limit: 1, offset: 0 });
      const page2 = await searchContent("cloud", { limit: 1, offset: 1 });

      expect(page1.length).toBeLessThanOrEqual(1);
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id);
      }
    });

    it("should return empty array for no matches", async () => {
      const results = await searchContent("xyznonexistentterm");
      expect(results.length).toBe(0);
    });

    it("should handle multi-word searches", async () => {
      const results = await searchContent("cloud infrastructure");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("getSearchSuggestions", () => {
    beforeAll(async () => {
      // Track some searches to populate suggestions
      await trackSearch({
        query: "cloud solutions",
        resultsCount: 5,
        hasResults: true,
      });

      await trackSearch({
        query: "cloud security",
        resultsCount: 3,
        hasResults: true,
      });

      await trackSearch({
        query: "ai automation",
        resultsCount: 2,
        hasResults: true,
      });
    });

    it("should return suggestions matching prefix", async () => {
      const suggestions = await getSearchSuggestions("cloud", 10);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every((s) => s.startsWith("cloud"))).toBe(true);
    });

    it("should return limited suggestions", async () => {
      const suggestions = await getSearchSuggestions("c", 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it("should return empty array for no matches", async () => {
      const suggestions = await getSearchSuggestions("xyznonexistent", 10);
      expect(suggestions.length).toBe(0);
    });
  });

  describe("trackSearch", () => {
    it("should track search with results", async () => {
      const result = await trackSearch({
        query: "test search",
        resultsCount: 5,
        hasResults: true,
        sessionId: "test-session-1",
      });

      expect(result.success).toBe(true);
    });

    it("should track search without results", async () => {
      const result = await trackSearch({
        query: "no results search",
        resultsCount: 0,
        hasResults: false,
        sessionId: "test-session-2",
      });

      expect(result.success).toBe(true);
    });

    it("should track with user agent and referrer", async () => {
      const result = await trackSearch({
        query: "analytics test",
        resultsCount: 2,
        hasResults: true,
        sessionId: "test-session-3",
        userAgent: "Mozilla/5.0 Test Browser",
        referrer: "https://gigitekai.com",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("trackSearchClick", () => {
    it("should track result click", async () => {
      // First track a search
      await trackSearch({
        query: "click test",
        resultsCount: 3,
        hasResults: true,
        sessionId: "click-session-1",
      });

      // Then track a click
      const result = await trackSearchClick({
        sessionId: "click-session-1",
        resultId: 1,
        resultUrl: "/blog/test",
        clickPosition: 1,
        query: "click test",
      });

      expect(result.success).toBe(true);
    });

    it("should track click with different positions", async () => {
      const positions = [1, 2, 3, 5];

      for (const position of positions) {
        const result = await trackSearchClick({
          sessionId: `click-session-${position}`,
          resultId: position,
          resultUrl: `/result-${position}`,
          clickPosition: position,
          query: "position test",
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle search errors gracefully", async () => {
      // This test verifies error handling doesn't throw
      const results = await searchContent("");
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle tracking errors gracefully", async () => {
      const result = await trackSearch({
        query: "",
        resultsCount: 0,
        hasResults: false,
      });

      // Should still return success even with empty query
      expect(typeof result).toBe("object");
    });
  });
});
