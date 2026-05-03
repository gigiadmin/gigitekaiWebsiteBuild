import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { kbArticles, kbArticleTags, kbArticleFeedback, kbArticleViews, kbSearchQueries } from "../../drizzle/schema";
import { eq, desc, sql, and, gte, lte, isNull, ne, inArray } from "drizzle-orm";

/**
 * KB Bulk Operations Router
 * - Bulk auto-tagging of all KB articles
 * - KB quality scoring
 * - KB article recommendations
 */
export const kbBulkOperationsRouter = router({
  /**
   * Bulk auto-tag all KB articles (1,647+ articles)
   * Processes articles in batches to avoid LLM rate limits
   * Skips articles that already have LLM-generated tags
   */
  bulkAutoTagArticles: adminProcedure
    .input(
      z.object({
        batchSize: z.number().int().positive().default(10),
        forceRetag: z.boolean().optional().default(false),
        limit: z.number().int().positive().optional(), // Limit total articles to tag (for testing)
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      console.log(`[KB Bulk Tagging] Starting bulk auto-tag operation (batch size: ${input.batchSize})`);

      // Get all articles that need tagging
      let query = db
        .select({ id: kbArticles.id, title: kbArticles.title, content: kbArticles.content })
        .from(kbArticles);

      if (!input.forceRetag) {
        // Exclude articles that already have LLM tags
        query = (query as any).where(
          ne(kbArticles.id, sql`(SELECT DISTINCT articleId FROM kbArticleTags WHERE source = 'auto_llm')`)
        );
      }

      const articles = (await query.limit(input.limit || 10000)) as any[];
      console.log(`[KB Bulk Tagging] Found ${articles.length} articles to tag`);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process in batches
      for (let i = 0; i < articles.length; i += input.batchSize) {
        const batch = articles.slice(i, i + input.batchSize);
        console.log(`[KB Bulk Tagging] Processing batch ${Math.floor(i / input.batchSize) + 1}/${Math.ceil(articles.length / input.batchSize)}`);

        for (const article of batch) {
          try {
            // Call LLM to extract tags
            const prompt = `Extract 5-8 relevant technical tags from this KB article. Return ONLY a JSON array of strings, no other text.
Title: ${article.title}
Content: ${article.content.substring(0, 800)}...

Example format: ["microsoft-365", "teams", "troubleshooting"]`;

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

            if (!Array.isArray(tags) || tags.length === 0) {
              throw new Error("Invalid tag format from LLM");
            }

            // Delete existing LLM tags if retagging
            if (input.forceRetag) {
              await db
                .delete(kbArticleTags)
                .where(
                  and(
                    eq(kbArticleTags.articleId, article.id),
                    eq(kbArticleTags.source, "auto_llm")
                  )
                );
            }

            // Insert new tags
            await db.insert(kbArticleTags).values(
              tags.map((tag: string) => ({
                articleId: article.id,
                tag: tag.toLowerCase().trim(),
                source: "auto_llm",
                confidence: "0.85",
              }))
            );

            successCount++;
          } catch (error) {
            errorCount++;
            const errorMsg = `Article ${article.id}: ${error}`;
            errors.push(errorMsg);
            console.error(`[KB Bulk Tagging] ${errorMsg}`);
          }

          // Rate limiting: small delay between LLM calls
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`[KB Bulk Tagging] Completed: ${successCount} succeeded, ${errorCount} failed`);

      return {
        success: true,
        totalProcessed: articles.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 10), // Return first 10 errors
        message: `Bulk tagging completed: ${successCount}/${articles.length} articles tagged successfully`,
      };
    }),

  /**
   * Calculate quality score for KB articles
   * Score = (feedback_rating * 0.4) + (view_count * 0.3) + (search_clicks * 0.3)
   * Normalized to 0-100 scale
   */
  calculateArticleQualityScores: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive().optional(), // If provided, calculate for single article
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      console.log("[KB Quality Scoring] Starting quality score calculation");

      // Get articles to score
      let articlesQuery = db
        .select({ id: kbArticles.id })
        .from(kbArticles);

      if (input.articleId) {
        articlesQuery = (articlesQuery as any).where(eq(kbArticles.id, input.articleId));
      }

      const articles = (await articlesQuery) as any[];
      console.log(`[KB Quality Scoring] Scoring ${articles.length} articles`);

      const scores: { articleId: number; score: number; feedback: number; views: number; clicks: number }[] = [];

      for (const article of articles) {
        try {
          // Get feedback rating (0-5 scale, convert to 0-100)
          const feedbackData = (await db
            .select({
              avgRating: sql<number>`AVG(CASE WHEN helpful = true THEN 5 WHEN helpful = false THEN 1 ELSE 3 END)`.as("avgRating"),
            })
            .from(kbArticleFeedback)
            .where(eq(kbArticleFeedback.articleId, article.id))) as any[];

          const feedbackScore = feedbackData[0]?.avgRating ? (feedbackData[0].avgRating / 5) * 100 : 50;

          // Get view count (normalize to 0-100: 1 view = 1 point, capped at 100)
          const viewsData = (await db
            .select({ count: sql<number>`COUNT(*)`.as("count") })
            .from(kbArticleViews)
            .where(eq(kbArticleViews.articleId, article.id))) as any[];

          const viewCount = Math.min(viewsData[0]?.count || 0, 100);

          // Get search clicks (normalize to 0-100: 1 click = 1 point, capped at 100)
          // Note: kbSearchQueries doesn't have articleId, so we skip this metric for now
          const clickCount = 0;

          // Calculate weighted score
          const qualityScore = feedbackScore * 0.4 + viewCount * 0.3 + clickCount * 0.3;

          scores.push({
            articleId: article.id,
            score: Math.round(qualityScore * 100) / 100,
            feedback: Math.round(feedbackScore * 100) / 100,
            views: viewCount,
            clicks: clickCount,
          });
        } catch (error) {
          console.error(`[KB Quality Scoring] Error scoring article ${article.id}:`, error);
        }
      }

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);

      console.log(`[KB Quality Scoring] Completed: ${scores.length} articles scored`);

      return {
        success: true,
        scores,
        topArticles: scores.slice(0, 10),
        lowScoringArticles: scores.slice(-10).reverse(),
      };
    }),

  /**
   * Get recommended articles for a user based on:
   * - Current article tags
   * - Search history
   * - View history
   */
  getRecommendedArticles: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        limit: z.number().int().positive().default(5),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      console.log(`[KB Recommendations] Getting recommendations for article ${input.articleId}`);

      // Get tags for the current article
      const currentArticleTags = (await db
        .select({ tag: kbArticleTags.tag })
        .from(kbArticleTags)
        .where(eq(kbArticleTags.articleId, input.articleId))) as any[];

      if (currentArticleTags.length === 0) {
        console.log(`[KB Recommendations] No tags found for article ${input.articleId}`);
        return [];
      }

      const tagList = currentArticleTags.map(t => t.tag);

      // Find other articles with matching tags
      const recommendations = (await db
        .select({
          id: kbArticles.id,
          title: kbArticles.title,
          category: kbArticles.category,
          matchingTags: sql<number>`COUNT(DISTINCT ${kbArticleTags.tag})`.as("matchingTags"),
        })
        .from(kbArticles)
        .innerJoin(
          kbArticleTags,
          and(
            eq(kbArticles.id, kbArticleTags.articleId),
            inArray(kbArticleTags.tag, tagList)
          )
        )
        .where(
          and(
            ne(kbArticles.id, input.articleId),
            eq(kbArticles.isPublished, true)
          )
        )
        .groupBy(kbArticles.id, kbArticles.title, kbArticles.category)
        .orderBy(desc(sql`COUNT(DISTINCT ${kbArticleTags.tag})`))
        .limit(input.limit)) as any[];

      console.log(`[KB Recommendations] Found ${recommendations.length} recommendations`);

      return recommendations;
    }),

  /**
   * Get KB health metrics
   */
  getKbHealthMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    try {
      // Total articles
      const totalArticles = (await db
        .select({ count: sql<number>`COUNT(*)`.as("count") })
        .from(kbArticles)
        .where(eq(kbArticles.isPublished, true))) as any[];

      // Articles with tags
      const articlesWithTags = (await db
        .select({ count: sql<number>`COUNT(DISTINCT articleId)`.as("count") })
        .from(kbArticleTags)) as any[];

      // Average tags per article
      const avgTags = (await db
        .select({ avg: sql<number>`AVG(tag_count)`.as("avg") })
        .from(
          db
            .select({ articleId: kbArticleTags.articleId, tag_count: sql<number>`COUNT(*)`.as("tag_count") })
            .from(kbArticleTags)
            .groupBy(kbArticleTags.articleId)
            .as("tag_counts")
        )) as any[];

      // Articles with versions
      const articlesWithVersions = (await db
        .select({ count: sql<number>`COUNT(DISTINCT articleId)`.as("count") })
        .from(kbArticles)) as any[];

      return {
        totalArticles: totalArticles[0]?.count || 0,
        articlesWithTags: articlesWithTags[0]?.count || 0,
        averageTagsPerArticle: Math.round((avgTags[0]?.avg || 0) * 100) / 100,
        taggingCoverage: Math.round(((articlesWithTags[0]?.count || 0) / (totalArticles[0]?.count || 1)) * 100),
      };
    } catch (error) {
      console.error("[KB Health Metrics] Error:", error);
      return null;
    }
  }),
});
