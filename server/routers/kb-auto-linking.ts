/**
 * Knowledge Base Auto-Linking Router
 * Automatically suggests relevant KB articles when creating tickets
 * Reduces support volume by helping customers self-serve
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { kbArticles } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

interface KBSuggestion {
  articleId: number;
  title: string;
  slug: string;
  relevanceScore: number; // 0-100
  category: string;
  summary: string;
  url: string;
}

/**
 * Find relevant KB articles for a ticket
 * Uses semantic search with LLM to match ticket content to KB articles
 */
async function findRelevantArticles(
  ticketTitle: string,
  ticketDescription: string,
  limit: number = 5
): Promise<KBSuggestion[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  try {
    // Get all KB articles
    const allArticles = await db.select().from(kbArticles);

    if (allArticles.length === 0) {
      return [];
    }

    // Use LLM to rank articles by relevance
    const articleTitles = allArticles.map((a) => `- ${a.title} (ID: ${a.id})`).join("\n");

    const prompt = `You are a knowledge base search expert. Given a support ticket, rank the most relevant KB articles.

TICKET TITLE: "${ticketTitle}"
TICKET DESCRIPTION: "${ticketDescription}"

AVAILABLE KB ARTICLES:
${articleTitles}

For each article that might help resolve this ticket, respond with JSON array:
[
  {
    "articleId": number,
    "relevanceScore": number between 0-100,
    "reasoning": "brief explanation of why this article is relevant"
  }
]

Only include articles with relevanceScore >= 50. Sort by relevanceScore descending. Maximum 5 articles.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful KB search assistant. Always respond with valid JSON array only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "kb_suggestions",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                articleId: { type: "number" },
                relevanceScore: { type: "number", minimum: 0, maximum: 100 },
                reasoning: { type: "string" },
              },
              required: ["articleId", "relevanceScore", "reasoning"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      const suggestions = JSON.parse(content);

      // Map to full article details
      const results: KBSuggestion[] = suggestions
        .filter((s: any) => s.articleId && s.relevanceScore >= 50)
        .slice(0, limit)
        .map((s: any) => {
          const article = allArticles.find((a) => a.id === s.articleId);
          if (!article) return null;

          return {
            articleId: article.id,
            title: article.title,
            
            relevanceScore: Math.round(s.relevanceScore),
            category: article.category || "General",
            summary: article.content?.substring(0, 150) || "",
            url: `/kb/${article.id}`,
          };
        })
        .filter((r: any): r is KBSuggestion => r !== null);

      return results;
    }
  } catch (error) {
    console.error("[KB Auto-Linking] Error finding relevant articles:", error);
  }

  return [];
}

/**
 * Track KB article usage and effectiveness
 */
async function trackArticleUsage(articleId: number, ticketId: number, wasHelpful: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // This would update article usage stats in a dedicated table
  // For now, we just log the interaction
  console.log(`[KB Usage] Article ${articleId} suggested for ticket ${ticketId}, helpful: ${wasHelpful}`);
}

export const kbAutoLinkingRouter = router({
  /**
   * Get KB article suggestions for a ticket
   */
  suggestArticles: publicProcedure
    .input(
      z.object({
        ticketTitle: z.string().min(1).max(500),
        ticketDescription: z.string().min(1).max(5000),
        limit: z.number().min(1).max(10).optional().default(5),
      })
    )
    .query(async ({ input }) => {
      return await findRelevantArticles(input.ticketTitle, input.ticketDescription, input.limit);
    }),

  /**
   * Track whether a suggested article was helpful
   */
  trackFeedback: protectedProcedure
    .input(
      z.object({
        articleId: z.number(),
        ticketId: z.number(),
        wasHelpful: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      await trackArticleUsage(input.articleId, input.ticketId, input.wasHelpful);
      return { success: true };
    }),

  /**
   * Get KB article by ID
   */
  getArticle: publicProcedure
    .input(z.object({ articleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const article = await db.select().from(kbArticles).where(eq(kbArticles.id, input.articleId));

      return article[0] || null;
    }),

  /**
   * Search KB articles by keyword
   */
  searchArticles: publicProcedure
    .input(z.object({ query: z.string().min(1).max(500) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const allArticles = await db.select().from(kbArticles);

      // Simple keyword search
      const lowerQuery = input.query.toLowerCase();
      return allArticles
        .filter(
          (a) =>
            a.title.toLowerCase().includes(lowerQuery) ||
            a.content?.toLowerCase().includes(lowerQuery) ||
            a.category?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 10)
        .map((a) => ({
          id: a.id,
          title: a.title,
          
          category: a.category,
          summary: a.content?.substring(0, 150) || "",
          url: `/kb/${a.id}`,
        }));
    }),

  /**
   * Get KB statistics
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const articles = await db.select().from(kbArticles);

    return {
      totalArticles: articles.length,
      byCategory: articles.reduce(
        (acc, a) => {
          const cat = a.category || "Uncategorized";
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      lastUpdated: articles.length > 0 ? articles[0].updatedAt : null,
    };
  }),
});
