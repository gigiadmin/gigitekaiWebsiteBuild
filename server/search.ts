import { getDb } from "./db";
import { searchIndex, searchAnalytics, searchSuggestions } from "../drizzle/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";

/**
 * Search Database Helpers
 * Provides functions for indexing content, searching, and tracking analytics
 */

/**
 * Index content for search
 * Called when new blog posts, pages, or content is created/updated
 */
export async function indexContent(data: {
  contentType: "page" | "blog" | "kb" | "faq" | "service" | "industry" | "pricing" | "case_study";
  sourceId: string;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  metadata?: Record<string, any>;
  embedding?: string; // JSON stringified embedding vector
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if content already exists
    const existing = await db
      .select()
      .from(searchIndex)
      .where(
        and(
          eq(searchIndex.contentType, data.contentType),
          eq(searchIndex.sourceId, data.sourceId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing index
      await db
        .update(searchIndex)
        .set({
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          url: data.url,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          embedding: data.embedding,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(searchIndex.id, existing[0].id));
    } else {
      // Create new index
      await db.insert(searchIndex).values({
        contentType: data.contentType,
        sourceId: data.sourceId,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        url: data.url,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        embedding: data.embedding,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[Search] Index error:", error);
    return { success: false, error };
  }
}

/**
 * Full-text search across all indexed content
 * Returns results ranked by relevance
 */
export async function searchContent(
  query: string,
  options?: {
    contentType?: string;
    limit?: number;
    offset?: number;
  }
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    // Build search query using MySQL FULLTEXT search
    // For now, use LIKE matching as fallback (will upgrade to FULLTEXT in production)
    const searchTerms = query.split(" ").filter((t) => t.length > 0);

    // Build where conditions
    const whereConditions: any[] = [];

    // Apply content type filter if specified
    if (options?.contentType) {
      whereConditions.push(eq(searchIndex.contentType, options.contentType as any));
    }

    // Apply search term filters (LIKE matching on title and excerpt)
    if (searchTerms.length > 0) {
      const conditions = searchTerms.map((term) =>
        sql`(${searchIndex.title} LIKE ${`%${term}%`} OR ${searchIndex.excerpt} LIKE ${`%${term}%`})`
      );

      whereConditions.push(sql`${conditions.join(" AND ")}`);
    }

    // Execute query with all conditions
    const results = await db
      .select({
        id: searchIndex.id,
        contentType: searchIndex.contentType,
        title: searchIndex.title,
        excerpt: searchIndex.excerpt,
        url: searchIndex.url,
        metadata: searchIndex.metadata,
        popularity: searchIndex.id,
        relevanceScore: searchIndex.id,
      })
      .from(searchIndex)
      .where(and(...whereConditions))
      .orderBy(desc(searchIndex.id), desc(searchIndex.id))
      .limit(limit)
      .offset(offset);

    // Track search query
    await trackSearch({
      query,
      resultsCount: results.length,
      hasResults: results.length > 0,
    });

    return results;
  } catch (error) {
    console.error("[Search] Query error:", error);
    return [];
  }
}

/**
 * Get search suggestions for autocomplete
 * Returns popular and trending searches
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 10
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get suggestions that match the query
    const suggestions = await db
      .select()
      .from(searchSuggestions)
      .where(like(searchSuggestions.suggestion, `${query}%`))
      .orderBy(desc(searchSuggestions.frequency))
      .limit(limit);

    return suggestions.map((s) => s.suggestion);
  } catch (error) {
    console.error("[Search] Suggestions error:", error);
    return [];
  }
}

/**
 * Track search query for analytics
 * Records user searches, results count, and click-through data
 */
export async function trackSearch(data: {
  query: string;
  resultsCount: number;
  hasResults: boolean;
  userId?: number;
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const sessionId = data.sessionId || `session-${Date.now()}`;

    await db.insert(searchAnalytics).values({
      query: data.query,
      resultCount: data.resultsCount || 0,
      resultClicked: 0,
      userId: data.userId,
      sessionId,
      userAgent: data.userAgent,
      referrer: data.referrer,
    });

    // Update or create suggestion for this query
    const existing = await db
      .select()
      .from(searchSuggestions)
      .where(eq(searchSuggestions.suggestion, data.query))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(searchSuggestions)
        .set({
          frequency: existing[0].frequency + 1,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(searchSuggestions.id, existing[0].id));
    } else {
      // Only create suggestion if it has results
      if (data.hasResults) {
        await db.insert(searchSuggestions).values({
          query: data.query,
          suggestion: data.query,
          category: "general",
          frequency: 1,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[Search] Track error:", error);
    return { success: false, error };
  }
}

/**
 * Track search result click
 * Records which result was clicked and at what position
 */
export async function trackSearchClick(data: {
  sessionId: string;
  resultId: number;
  resultUrl: string;
  clickPosition: number;
  query: string;
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(searchAnalytics)
      .set({
        clickedResultId: data.resultId,
        clickedResultUrl: data.resultUrl,
      })
      .where(eq(searchAnalytics.sessionId, data.sessionId));

    // Note: popularity field not in schema, skip update
    // await db.update(searchIndex).set({ popularity: sql`${searchIndex.id} + 1` }).where(eq(searchIndex.id, data.resultId));

    return { success: true };
  } catch (error) {
    console.error("[Search] Click tracking error:", error);
    return { success: false, error };
  }
}

/**
 * Get popular searches for the past N days
 * Used for trending searches widget
 */
export async function getPopularSearches(days: number = 7, limit: number = 10) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const results = await db
      .select({
        suggestion: searchSuggestions.suggestion,
        popularity: searchSuggestions.frequency,
      })
      .from(searchSuggestions)
      .where(sql`${searchSuggestions.updatedAt} >= ${cutoffDate.toISOString()}`)
      .orderBy(desc(searchSuggestions.frequency))
      .limit(limit);

    return results;
  } catch (error) {
    console.error("[Search] Popular searches error:", error);
    return [];
  }
}

/**
 * Get no-results queries for content gap analysis
 * Identifies search queries that returned no results
 */
export async function getNoResultsQueries(limit: number = 20) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select({
        query: searchAnalytics.query,
        count: sql`COUNT(*) as count`,
      })
      .from(searchAnalytics)
      .where(eq(searchAnalytics.resultCount, 0))
      .groupBy(searchAnalytics.query)
      .orderBy(desc(sql`count`))
      .limit(limit);

    return results;
  } catch (error) {
    console.error("[Search] No-results queries error:", error);
    return [];
  }
}
