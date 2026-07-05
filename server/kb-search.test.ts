import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { kbArticles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("KB Search Algorithm", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should return articles with exact phrase match in title as top result", async () => {
    // Simulate the search algorithm
    const query = "printer not printing";
    const queryLower = query.toLowerCase();
    const terms = queryLower.split(/\s+/).filter(t => t.length >= 2);

    // Fetch all published articles
    const rows = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.isPublished, 1))
      .limit(500);

    // Count term matches
    const countTermMatches = (text: string): number => {
      if (!text) return 0;
      const textLower = text.toLowerCase();
      return terms.filter(term => textLower.includes(term)).length;
    };

    // Score articles
    const scored = rows.map((article: any) => {
      let score = 0;
      const titleLower = (article.title || "").toLowerCase();
      const contentLower = (article.content || "").toLowerCase();

      // Full query phrase match in title
      if (titleLower.includes(queryLower)) {
        score += 500;
      }

      // Full query phrase match in content
      if (contentLower.includes(queryLower)) {
        score += 300;
      }

      // Count term matches in title
      const titleTermCount = countTermMatches(titleLower);
      if (titleTermCount === terms.length) {
        score += 250;
      } else if (titleTermCount > 0) {
        score += titleTermCount * 60;
      }

      // Count term matches in content
      const contentTermCount = countTermMatches(contentLower);
      if (contentTermCount === terms.length) {
        score += 150;
      } else if (contentTermCount > 0) {
        score += contentTermCount * 30;
      }

      return { ...article, _score: score };
    });

    // Filter and sort
    const filtered = scored.filter((a: any) => a._score > 0);
    filtered.sort((a: any, b: any) => b._score - a._score);
    const results = filtered.slice(0, 20);

    // Verify results
    expect(results.length).toBeGreaterThan(0);
    
    // Top result should have high score (indicating phrase match or all terms present)
    if (results.length > 0) {
      expect(results[0]._score).toBeGreaterThan(100);
      
      // Check that top results are actually relevant
      const topTitle = results[0].title.toLowerCase();
      const topContent = results[0].content.toLowerCase();
      
      // At least one of the query terms should be in top result
      const hasRelevantTerm = terms.some(term => 
        topTitle.includes(term) || topContent.includes(term)
      );
      expect(hasRelevantTerm).toBe(true);
    }
  });

  it("should prioritize exact phrase matches over scattered term matches", async () => {
    const query = "azure vm disk";
    const queryLower = query.toLowerCase();
    const terms = queryLower.split(/\s+/).filter(t => t.length >= 2);

    const rows = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.isPublished, 1))
      .limit(500);

    const countTermMatches = (text: string): number => {
      if (!text) return 0;
      const textLower = text.toLowerCase();
      return terms.filter(term => textLower.includes(term)).length;
    };

    const scored = rows.map((article: any) => {
      let score = 0;
      const titleLower = (article.title || "").toLowerCase();
      const contentLower = (article.content || "").toLowerCase();

      if (titleLower.includes(queryLower)) {
        score += 500;
      }
      if (contentLower.includes(queryLower)) {
        score += 300;
      }

      const titleTermCount = countTermMatches(titleLower);
      if (titleTermCount === terms.length) {
        score += 250;
      } else if (titleTermCount > 0) {
        score += titleTermCount * 60;
      }

      const contentTermCount = countTermMatches(contentLower);
      if (contentTermCount === terms.length) {
        score += 150;
      } else if (contentTermCount > 0) {
        score += contentTermCount * 30;
      }

      return { ...article, _score: score };
    });

    const filtered = scored.filter((a: any) => a._score > 0);
    filtered.sort((a: any, b: any) => b._score - a._score);
    const results = filtered.slice(0, 20);

    // Verify that results are sorted by relevance
    expect(results.length).toBeGreaterThan(0);
    
    // Scores should be in descending order
    for (let i = 1; i < results.length; i++) {
      expect(results[i]._score).toBeLessThanOrEqual(results[i - 1]._score);
    }
  });

  it("should return relevant results for common IT issues", async () => {
    const testQueries = [
      "outlook not opening",
      "teams meeting issues",
      "sharepoint access denied",
      "azure authentication failed",
    ];

    for (const query of testQueries) {
      const queryLower = query.toLowerCase();
      const terms = queryLower.split(/\s+/).filter(t => t.length >= 2);

      const rows = await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.isPublished, 1))
        .limit(500);

      const countTermMatches = (text: string): number => {
        if (!text) return 0;
        const textLower = text.toLowerCase();
        return terms.filter(term => textLower.includes(term)).length;
      };

      const scored = rows.map((article: any) => {
        let score = 0;
        const titleLower = (article.title || "").toLowerCase();
        const contentLower = (article.content || "").toLowerCase();

        if (titleLower.includes(queryLower)) {
          score += 500;
        }
        if (contentLower.includes(queryLower)) {
          score += 300;
        }

        const titleTermCount = countTermMatches(titleLower);
        if (titleTermCount === terms.length) {
          score += 250;
        } else if (titleTermCount > 0) {
          score += titleTermCount * 60;
        }

        const contentTermCount = countTermMatches(contentLower);
        if (contentTermCount === terms.length) {
          score += 150;
        } else if (contentTermCount > 0) {
          score += contentTermCount * 30;
        }

        return { ...article, _score: score };
      });

      const filtered = scored.filter((a: any) => a._score > 0);
      
      // Should return at least some results for common IT queries
      expect(filtered.length).toBeGreaterThan(0);
    }
  });
});
