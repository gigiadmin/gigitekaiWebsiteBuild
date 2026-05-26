import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { kbArticles, kbArticleVersions, kbArticleTags, kbSearchQueries } from "../../drizzle/schema";
import { eq, desc, sql, and, gte, lte, isNull, ne } from "drizzle-orm";

/**
 * KB Enhancement Router
 * - Auto-tagging KB articles with LLM
 * - KB article versioning and rollback
 * - KB gap analysis (zero-result searches)
 */
export const kbEnhancementsRouter = router({
  /**
   * Auto-tag a KB article using LLM
   * Extracts relevant tags from title + content
   * Stores with confidence score for LLM-generated tags
   */
  autoTagArticle: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        forceRetag: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get article
      const [article] = await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.id, input.articleId));

      if (!article) throw new Error("Article not found");

      // If forceRetag is false and article already has LLM tags, skip
      if (!input.forceRetag) {
        const existingLlmTags = await db
          .select()
          .from(kbArticleTags)
          .where(
            and(
              eq(kbArticleTags.articleId, input.articleId),
              eq(kbArticleTags.source, "auto_llm")
            )
          );
        if (existingLlmTags.length > 0) {
          return { success: true, tags: existingLlmTags, message: "Article already has LLM tags" };
        }
      }

      // Call LLM to extract tags
      const prompt = `Extract 5-8 relevant technical tags from this KB article. Return ONLY a JSON array of strings, no other text.
Title: ${article.title}
Category: ${article.category}
Content: ${article.content.substring(0, 1000)}...

Example format: ["microsoft-365", "teams", "troubleshooting", "setup"]`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a technical tagging system. Extract relevant tags from KB articles.",
            },
            { role: "user", content: prompt },
          ],
        });

        const content = (response as any).choices[0]?.message?.content || "[]";
        const tags = JSON.parse(content);

        if (!Array.isArray(tags)) throw new Error("Invalid tag format from LLM");

        // Delete existing LLM tags if retagging
        if (input.forceRetag) {
          await db
            .delete(kbArticleTags)
            .where(
              and(
                eq(kbArticleTags.articleId, input.articleId),
                eq(kbArticleTags.source, "auto_llm")
              )
            );
        }

        // Insert new tags with confidence score
        const insertedTags = await db.insert(kbArticleTags).values(
          tags.map((tag: string) => ({
            articleId: input.articleId,
            tag: tag.toLowerCase().trim(),
            source: "auto_llm",
            confidence: "0.85", // Default confidence for LLM-generated tags
          }))
        );

        return {
          success: true,
          tags,
          message: `Tagged article with ${tags.length} LLM-generated tags`,
        };
      } catch (error) {
        console.error("[KB Enhancements] Auto-tagging failed:", error);
        throw new Error(`Failed to auto-tag article: ${error}`);
      }
    }),

  /**
   * Create a version snapshot of the current article state
   * Called before updating an article to enable rollback
   */
  createVersion: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        editedBy: z.number().int().positive(),
        changeDescription: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get current article state
      const [article] = await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.id, input.articleId));

      if (!article) throw new Error("Article not found");

      // Create version snapshot
      const version = await db.insert(kbArticleVersions).values({
        articleId: input.articleId,
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
        editedBy: input.editedBy,
        changeDescription: input.changeDescription || null,
      });

      return {
        success: true,
        versionId: (version as any)[0]?.insertId || 1,
        message: "Version snapshot created",
      };
    }),

  /**
   * Rollback article to a previous version
   */
  rollbackToVersion: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        versionId: z.number().int().positive(),
        editedBy: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get version to restore
      const [version] = await db
        .select()
        .from(kbArticleVersions)
        .where(
          and(
            eq(kbArticleVersions.id, input.versionId),
            eq(kbArticleVersions.articleId, input.articleId)
          )
        );

      if (!version) throw new Error("Version not found");

      // Create a backup version of current state before rolling back
      const [currentArticle] = await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.id, input.articleId));

      if (currentArticle) {
        await db.insert(kbArticleVersions).values({
          articleId: input.articleId,
          title: currentArticle.title,
          content: currentArticle.content,
          category: currentArticle.category,
          tags: currentArticle.tags,
          editedBy: input.editedBy,
          changeDescription: `Backup before rollback to version ${input.versionId}`,
        });
      }

      // Restore article from version
      await db
        .update(kbArticles)
        .set({
          title: version.title,
          content: version.content,
          category: version.category,
          tags: version.tags,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(kbArticles.id, input.articleId));

      return {
        success: true,
        message: `Article rolled back to version ${input.versionId}`,
      };
    }),

  /**
   * Get version history for an article
   */
  getVersionHistory: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        limit: z.number().int().positive().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const versions = await db
        .select()
        .from(kbArticleVersions)
        .where(eq(kbArticleVersions.articleId, input.articleId))
        .orderBy(desc(kbArticleVersions.createdAt))
        .limit(input.limit);

      return versions;
    }),

  /**
   * Get KB gap analysis: zero-result searches in the last N days
   * These are searches that returned no KB articles
   * Helps identify content gaps to fill
   */
  getKbGaps: adminProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
        limit: z.number().int().positive().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      // Find searches with zero results
      const zeroResultSearches = await db
        .select({
          query: kbSearchQueries.query,
          searchCount: sql<number>`COUNT(*)`.as("searchCount"),
          lastSearched: sql<string>`MAX(${kbSearchQueries.createdAt})`.as("lastSearched"),
        })
        .from(kbSearchQueries)
        .where(
          and(
            gte(kbSearchQueries.createdAt, since instanceof Date ? since.toISOString() : since),
            eq(kbSearchQueries.resultsCount, 0)
          )
        )
        .groupBy(kbSearchQueries.query)
        .orderBy(desc(sql`COUNT(*)`));

      return zeroResultSearches.slice(0, input.limit);
    }),

  /**
   * Get tag cloud: most common tags across all articles
   * Useful for understanding KB coverage and gaps
   */
  getTagCloud: publicProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const tags = await db
        .select({
          tag: kbArticleTags.tag,
          count: sql<number>`COUNT(*)`.as("count"),
          avgConfidence: sql<string>`AVG(${kbArticleTags.confidence})`.as("avgConfidence"),
        })
        .from(kbArticleTags)
        .groupBy(kbArticleTags.tag)
        .orderBy(desc(sql`COUNT(*)`));

      return tags.slice(0, input.limit);
    }),

  /**
   * Get articles by tag
   */
  getArticlesByTag: publicProcedure
    .input(
      z.object({
        tag: z.string().min(1).max(100),
        limit: z.number().int().positive().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const articles = await db
        .select({
          id: kbArticles.id,
          title: kbArticles.title,
          excerpt: sql<string>`SUBSTRING(${kbArticles.content}, 1, 200)`.as("excerpt"),
          category: kbArticles.category,
          createdAt: kbArticles.createdAt,
        })
        .from(kbArticles)
        .innerJoin(
          kbArticleTags,
          and(
            eq(kbArticles.id, kbArticleTags.articleId),
            eq(kbArticleTags.tag, input.tag.toLowerCase())
          )
        )
        .where(eq(kbArticles.isPublished, 1));

      return articles;
    }),
});
