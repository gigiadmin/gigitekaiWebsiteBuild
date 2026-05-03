import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { kbArticles, kbArticleTags, kbArticleAnalytics } from "../../drizzle/schema";
import { eq, desc, sql, and, gte, lte, isNull, ne, inArray } from "drizzle-orm";

/**
 * KB Completion Features Router
 * - KB article drafting assistant
 * - KB article performance tracking
 * - KB article translation
 */
export const kbCompletionRouter = router({
  /**
   * Generate content suggestions for article sections using LLM
   * Helps authors draft articles faster by suggesting content
   */
  generateArticleSectionContent: adminProcedure
    .input(
      z.object({
        templateId: z.string(),
        articleTitle: z.string(),
        section: z.string(), // e.g., "Problem", "Solution", "Verification"
        context: z.string().optional(), // Additional context for better suggestions
      })
    )
    .mutation(async ({ input }) => {
      console.log(`[KB Drafting] Generating content for section: ${input.section}`);

      try {
        const prompt = `Generate professional content for a KB article section.

Template Type: ${input.templateId}
Article Title: "${input.articleTitle}"
Section: ${input.section}
${input.context ? `Context: ${input.context}` : ""}

Generate 2-3 paragraphs of helpful, professional content that would fit this section. Make it specific and actionable.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert technical writer. Generate clear, professional KB article content.",
            },
            { role: "user", content: prompt },
          ],
        });

        const content = (response as any).choices[0]?.message?.content || "";

        console.log(`[KB Drafting] Generated ${content.length} characters for section: ${input.section}`);

        return {
          success: true,
          section: input.section,
          suggestedContent: content,
          characterCount: content.length,
        };
      } catch (error) {
        console.error("[KB Drafting] Error:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get template performance metrics
   * Shows which templates produce highest-quality articles
   */
  getTemplatePerformanceMetrics: adminProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(90),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      console.log(`[KB Performance] Analyzing template performance from last ${input.days} days`);

      try {
        // Get articles created from templates (those with specific categories)
        const templateCategories = ["Troubleshooting", "Setup", "FAQ", "Best Practices"];

        const metrics = [];

        for (const category of templateCategories) {
          try {
            // Get articles in this category
            const articles = (await db
              .select({ id: kbArticles.id })
              .from(kbArticles)
              .where(
                and(
                  eq(kbArticles.category, category),
                  gte(
                    kbArticles.createdAt,
                    sql`DATE_SUB(NOW(), INTERVAL ${input.days} DAY)`
                  )
                )
              )) as any[];

            if (articles.length === 0) continue;

            const articleIds = articles.map(a => a.id);

            // Get analytics for these articles
            const analytics = (await db
              .select({
                avgViews: sql<number>`AVG(views)`.as("avgViews"),
                avgShares: sql<number>`AVG(shares)`.as("avgShares"),
                avgHelpful: sql<number>`AVG(helpful)`.as("avgHelpful"),
                totalArticles: sql<number>`COUNT(DISTINCT articleId)`.as("totalArticles"),
              })
              .from(kbArticleAnalytics)
              .where(inArray(kbArticleAnalytics.articleId, articleIds))) as any[];

            const avgViews = analytics[0]?.avgViews || 0;
            const avgShares = analytics[0]?.avgShares || 0;
            const avgHelpful = analytics[0]?.avgHelpful || 0;
            const totalArticles = analytics[0]?.totalArticles || 0;

            // Calculate quality score
            const qualityScore = (avgHelpful * 0.5) + (avgViews * 0.3) + (avgShares * 0.2);

            metrics.push({
              template: category,
              totalArticles,
              averageViews: Math.round(avgViews * 100) / 100,
              averageShares: Math.round(avgShares * 100) / 100,
              averageHelpfulRating: Math.round(avgHelpful * 100) / 100,
              qualityScore: Math.round(qualityScore * 100) / 100,
              recommendation: qualityScore > 70 ? "Highly Recommended" : qualityScore > 50 ? "Recommended" : "Needs Improvement",
            });
          } catch (error) {
            console.error(`[KB Performance] Error analyzing ${category}:`, error);
          }
        }

        // Sort by quality score descending
        metrics.sort((a, b) => b.qualityScore - a.qualityScore);

        console.log(`[KB Performance] Analyzed ${metrics.length} templates`);
        return metrics;
      } catch (error) {
        console.error("[KB Performance] Error:", error);
        return [];
      }
    }),

  /**
   * Translate article to another language
   * Supports: Spanish (es), French (fr), German (de)
   */
  translateArticle: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        targetLanguage: z.enum(["es", "fr", "de"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      console.log(`[KB Translation] Translating article ${input.articleId} to ${input.targetLanguage}`);

      try {
        // Get the article
        const article = (await db
          .select()
          .from(kbArticles)
          .where(eq(kbArticles.id, input.articleId))) as any[];

        if (article.length === 0) {
          throw new Error(`Article ${input.articleId} not found`);
        }

        const originalArticle = article[0];

        // Language names
        const languageNames: Record<string, string> = {
          es: "Spanish",
          fr: "French",
          de: "German",
        };

        // Translate title and content
        const prompt = `Translate the following KB article to ${languageNames[input.targetLanguage]}. 
Maintain the markdown formatting and structure.
Keep technical terms and product names in English where appropriate.

Title: ${originalArticle.title}

Content:
${originalArticle.content}

Respond with JSON: { "translatedTitle": "...", "translatedContent": "..." }`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate technical KB articles to ${languageNames[input.targetLanguage]} while preserving formatting and clarity.`,
            },
            { role: "user", content: prompt },
          ],
        });

        const content = (response as any).choices[0]?.message?.content || "{}";
        const translation = JSON.parse(content);

        // Create translated article
        const translatedTitle = `${translation.translatedTitle} [${input.targetLanguage.toUpperCase()}]`;
        const result = (await db.insert(kbArticles).values({
          title: translatedTitle,
          content: translation.translatedContent,
          category: originalArticle.category,
          tags: `${originalArticle.tags || ""},translation,${input.targetLanguage}`,
          isPublished: false, // Require review before publishing
          syncSource: null,
        })) as any;

        const translatedArticleId = result.insertId || result[0]?.id;

        console.log(`[KB Translation] Created translated article ${translatedArticleId}`);

        return {
          success: true,
          translatedArticleId,
          originalArticleId: input.articleId,
          targetLanguage: input.targetLanguage,
          message: `Article translated to ${languageNames[input.targetLanguage]}. Review before publishing.`,
        };
      } catch (error) {
        console.error("[KB Translation] Error:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get supported languages for translation
   */
  getSupportedLanguages: publicProcedure.query(() => {
    return [
      { code: "es", name: "Spanish", nativeName: "Español" },
      { code: "fr", name: "French", nativeName: "Français" },
      { code: "de", name: "German", nativeName: "Deutsch" },
    ];
  }),

  /**
   * Get article translation status
   */
  getArticleTranslations: publicProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        // Get original article
        const original = (await db
          .select()
          .from(kbArticles)
          .where(eq(kbArticles.id, input.articleId))) as any[];

        if (original.length === 0) return [];

        // Find translated versions
        const originalTitle = original[0].title;
        const translations = (await db
          .select()
          .from(kbArticles)
          .where(
            and(
              inArray(kbArticles.tags, ["translation"]),
              inArray(kbArticles.tags, ["es", "fr", "de"])
            )
          )) as any[];

        return translations.map(t => {
          const lang = t.tags?.includes("es") ? "es" : t.tags?.includes("fr") ? "fr" : "de";
          return {
            articleId: t.id,
            language: lang,
            title: t.title,
            isPublished: t.isPublished,
            createdAt: t.createdAt,
          };
        });
      } catch (error) {
        console.error("[KB Translations] Error:", error);
        return [];
      }
    }),
});
