import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { kbArticles } from "../../drizzle/schema";
import { eq, like, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { indexContent } from "../search";

export const helpdeskKbRouter = router({
  /**
   * Get all published KB articles
   */
  listPublished: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [eq(kbArticles.isPublished, 1)];

      if (input.category) {
        conditions.push(eq(kbArticles.category, input.category));
      }

      if (input.search) {
        const searchPattern = `%${input.search}%`;
        conditions.push(like(kbArticles.title, searchPattern));
      }

      const articles = await db.select().from(kbArticles).where(and(...conditions));
      return articles.slice(0, input.limit);
    }),

  /**
   * Get all KB articles (admin only)
   */
  listAll: adminProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        includeUnpublished: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let articles = await db.select().from(kbArticles);

      if (!input.includeUnpublished) {
        articles = articles.filter((a) => a.isPublished);
      }

      if (input.category) {
        articles = articles.filter((a) => a.category === input.category);
      }

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        articles = articles.filter(
          (a) => a.title.toLowerCase().includes(searchLower) || a.content.toLowerCase().includes(searchLower)
        );
      }

      return articles.slice(0, 100);
    }),

  /**
   * Get single KB article
   */
  getArticle: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const articles = await db.select().from(kbArticles).where(eq(kbArticles.id, input.id));
      const article = articles[0];

      if (!article) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }

      if (!article.isPublished) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Article not published" });
      }

      return article;
    }),

  /**
   * Create KB article (admin only)
   */
  /**
   * Bulk import KB articles from CSV
   */
  bulkImport: adminProcedure
    .input(
      z.object({
        articles: z.array(
          z.object({
            title: z.string().min(5).max(500),
            content: z.string().min(20),
            category: z.string().min(1).max(100),
            tags: z.string().optional(),
            tier: z.number().min(1).max(3).default(2),
            audience: z.string().default("Help Desk"),
          })
        ).min(1).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const results = {
        imported: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const article of input.articles) {
        try {
          const result = await db.insert(kbArticles).values({
            title: article.title,
            content: article.content,
            category: article.category,
            tags: article.tags,
            isPublished: 1,
            audience: (article.audience === "admin" || article.audience === "end-user") ? article.audience : "technician",
            difficulty: (article.tier === 1 || article.tier === 3) ? (article.tier === 1 ? "beginner" : "advanced") : "intermediate",
            createdBy: ctx.user.id,
          });

          const articleId = result[0]?.insertId;

          // Index the article
          if (articleId) {
            try {
              await indexContent({
                contentType: "kb",
                sourceId: articleId.toString(),
                title: article.title,
                excerpt: article.content.substring(0, 300),
                content: article.content,
                url: `/kb/${articleId}`,
                metadata: {
                  category: article.category,
                  tags: article.tags ? article.tags.split(",").map(t => t.trim()) : [],
                  audience: article.audience,
                  difficulty: "intermediate",
                  tier: article.tier,
                },
              });
            } catch (indexError) {
              console.error(`[KB] Failed to index article ${articleId}:`, indexError);
            }
          }

          results.imported++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to import "${article.title}": ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return {
        success: results.failed === 0,
        imported: results.imported,
        failed: results.failed,
        errors: results.errors,
        message: `Imported ${results.imported} articles${results.failed > 0 ? `, ${results.failed} failed` : ""}`,
      };
    }),

  createArticle: adminProcedure
    .input(
      z.object({
        title: z.string().min(5).max(500),
        content: z.string().min(20),
        category: z.string().min(1).max(100),
        tags: z.string().optional(),
        isPublished: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.insert(kbArticles).values({
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags,
        isPublished: input.isPublished ? 1 : 0,
        createdBy: ctx.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const articleId = result[0]?.insertId;

      // Index the new article if published
      if (articleId && input.isPublished) {
        try {
          await indexContent({
            contentType: "kb",
            sourceId: articleId.toString(),
            title: input.title,
            excerpt: input.content.substring(0, 300),
            content: input.content,
            url: `/kb/${articleId}`,
            metadata: {
              category: input.category,
              tags: input.tags ? input.tags.split(",").map(t => t.trim()) : [],
              audience: "technician",
              difficulty: "intermediate",
            },
          });
          console.log(`[KB] Article ${articleId} indexed in search index`);
        } catch (indexError) {
          console.error(`[KB] Failed to index article ${articleId}:`, indexError);
          // Don't fail article creation if indexing fails
        }
      }

      return {
        success: true,
        id: articleId,
        message: "Article created successfully",
      };
    }),

  /**
   * Update KB article (admin only)
   */
  updateArticle: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(5).max(500).optional(),
        content: z.string().min(20).optional(),
        category: z.string().min(1).max(100).optional(),
        tags: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const articles = await db.select().from(kbArticles).where(eq(kbArticles.id, input.id));
      if (!articles.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }

      const article = articles[0];
      const updates: any = { updatedAt: new Date().toISOString() };
      if (input.title) updates.title = input.title;
      if (input.content) updates.content = input.content;
      if (input.category) updates.category = input.category;
      if (input.tags !== undefined) updates.tags = input.tags;
      if (input.isPublished !== undefined) updates.isPublished = input.isPublished;

      await db.update(kbArticles).set(updates).where(eq(kbArticles.id, input.id));

      // Re-index the updated article if published
      const isPublished = input.isPublished !== undefined ? input.isPublished : (article.isPublished === 1);
      if (isPublished) {
        try {
          await indexContent({
            contentType: "kb",
            sourceId: input.id.toString(),
            title: input.title || article.title,
            excerpt: (input.content || article.content).substring(0, 300),
            content: input.content || article.content,
            url: `/kb/${input.id}`,
            metadata: {
              category: input.category || article.category,
              tags: input.tags ? input.tags.split(",").map(t => t.trim()) : (article.tags?.split(",").map(t => t.trim()) || []),
              audience: article.audience || "technician",
              difficulty: article.difficulty || "intermediate",
            },
          });
          console.log(`[KB] Article ${input.id} re-indexed in search index`);
        } catch (indexError) {
          console.error(`[KB] Failed to re-index article ${input.id}:`, indexError);
        }
      }

      return {
        success: true,
        id: input.id,
        message: "Article updated successfully",
      };
    }),

  /**
   * Delete KB article (admin only)
   */
  deleteArticle: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const articles = await db.select().from(kbArticles).where(eq(kbArticles.id, input.id));
      if (!articles.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }

      // Soft delete by unpublishing
      await db.update(kbArticles).set({ isPublished: 0 }).where(eq(kbArticles.id, input.id));

      return {
        success: true,
        id: input.id,
        message: "Article deleted successfully",
      };
    }),

  /**
   * Get KB statistics
   */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const articles = await db.select().from(kbArticles);
    const published = articles.filter((a) => a.isPublished);

    const categories = new Set(articles.map((a) => a.category));
    const byCategory: Record<string, number> = {};
    categories.forEach((cat) => {
      byCategory[cat] = articles.filter((a) => a.category === cat).length;
    });

    return {
      totalArticles: articles.length,
      publishedArticles: published.length,
      draftArticles: articles.length - published.length,
      categories: categories.size,
      byCategory,
      averageContentLength: Math.round(
        articles.reduce((sum, a) => sum + a.content.length, 0) / (articles.length || 1)
      ),
    };
  }),

  /**
   * Get KB categories
   */
  getCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const articles = await db.select().from(kbArticles).where(eq(kbArticles.isPublished, 1));

    const categories = new Map<string, number>();
    articles.forEach((a) => {
      categories.set(a.category, (categories.get(a.category) || 0) + 1);
    });

    return Array.from(categories.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }),

  /**
   * Search KB articles
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const articles = await db.select().from(kbArticles).where(eq(kbArticles.isPublished, 1));

      const queryLower = input.query.toLowerCase();
      const results = articles
        .filter(
          (a) =>
            a.title.toLowerCase().includes(queryLower) ||
            a.content.toLowerCase().includes(queryLower) ||
            (a.tags && a.tags.toLowerCase().includes(queryLower))
        )
        .slice(0, input.limit);

      return results;
    }),
});
