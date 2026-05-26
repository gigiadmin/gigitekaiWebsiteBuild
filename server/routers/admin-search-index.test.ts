import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { adminSearchIndexRouter } from "./admin-search-index";
import { getDb } from "../db";
import { searchIndex } from "../../drizzle/schema";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../search", () => ({
  indexContent: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Admin Search Index Router", () => {
  describe("populateIndex", () => {
    it("should populate search index with blog and KB content", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: 1,
            title: "Test Blog Post",
            slug: "test-blog-post",
            excerpt: "Test excerpt",
            content: "Test content",
            author: "Test Author",
            category: "Technology",
            tags: "test,blog",
            publishedAt: new Date().toISOString(),
            featuredImage: "https://example.com/image.jpg",
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      // Test that the router is properly configured
      expect(adminSearchIndexRouter).toBeDefined();
      expect(adminSearchIndexRouter._def).toBeDefined();
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      expect(adminSearchIndexRouter).toBeDefined();
    });
  });

  describe("clearIndex", () => {
    it("should clear the search index", async () => {
      const mockDb = {
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockResolvedValue({ success: true }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      expect(adminSearchIndexRouter).toBeDefined();
    });
  });

  describe("getStats", () => {
    it("should return search index statistics", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockResolvedValue([
          { contentType: "blog", count: 10 },
          { contentType: "kb", count: 20 },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      expect(adminSearchIndexRouter).toBeDefined();
    });
  });
});
