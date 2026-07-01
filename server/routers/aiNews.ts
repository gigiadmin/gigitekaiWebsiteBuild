/**
 * AI News Management Router
 * Admin procedures for viewing, managing, and analyzing collected AI news
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { aiNewsArticles, newsEngagementMetrics, newsletterSends } from "../../drizzle/schema";
import { eq, desc, and, inArray, like, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── Helpers ────────────────────────────────────────────────────────────────

function requireAdmin(role: string | undefined) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const aiNewsRouter = router({
  /** List all collected AI news articles with filters */
  listArticles: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        source: z.string().optional(),
        includedInNewsletter: z.boolean().optional(),
        isArchived: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().int().positive().max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) return { articles: [], total: 0 };

      // Build where conditions
      const conditions: any[] = [];
      if (input.category) conditions.push(eq(aiNewsArticles.category, input.category));
      if (input.source) conditions.push(eq(aiNewsArticles.source, input.source));
      if (input.includedInNewsletter !== undefined) {
        conditions.push(eq(aiNewsArticles.includedInNewsletter, input.includedInNewsletter ? 1 : 0));
      }
      if (input.isArchived !== undefined) {
        conditions.push(eq(aiNewsArticles.isArchived, input.isArchived ? 1 : 0));
      }
      if (input.search) {
        conditions.push(
          like(aiNewsArticles.title, `%${input.search}%`)
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const articles = await db
        .select()
        .from(aiNewsArticles)
        .where(whereClause)
        .orderBy(desc(aiNewsArticles.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const countResult = await db
        .select({ count: aiNewsArticles.id })
        .from(aiNewsArticles)
        .where(whereClause);

      return {
        articles,
        total: countResult.length,
      };
    }),

  /** Get a single article with engagement metrics */
  getArticle: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [article] = await db
        .select()
        .from(aiNewsArticles)
        .where(eq(aiNewsArticles.id, input.id));

      if (!article) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }

      // Get engagement metrics
      const metrics = await db
        .select()
        .from(newsEngagementMetrics)
        .where(eq(newsEngagementMetrics.articleId, input.id));

      const engagement = {
        opens: metrics.filter(m => m.action === 'opened').length,
        clicks: metrics.filter(m => m.action === 'clicked').length,
        shares: metrics.filter(m => m.action === 'shared').length,
        saved: metrics.filter(m => m.action === 'saved').length,
        reported: metrics.filter(m => m.action === 'reported').length,
      };

      return { article, engagement };
    }),

  /** Archive an article */
  archiveArticle: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(aiNewsArticles)
        .set({ isArchived: 1 })
        .where(eq(aiNewsArticles.id, input.id));

      return { success: true };
    }),

  /** Unarchive an article */
  unarchiveArticle: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(aiNewsArticles)
        .set({ isArchived: 0 })
        .where(eq(aiNewsArticles.id, input.id));

      return { success: true };
    }),

  /** Mark article as included in next newsletter */
  includeInNewsletter: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(aiNewsArticles)
        .set({ includedInNewsletter: 1 })
        .where(eq(aiNewsArticles.id, input.id));

      return { success: true };
    }),

  /** Remove article from newsletter */
  excludeFromNewsletter: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(aiNewsArticles)
        .set({ includedInNewsletter: 0 })
        .where(eq(aiNewsArticles.id, input.id));

      return { success: true };
    }),

  /** Get newsletter send history */
  getNewsletterHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) return { sends: [], total: 0 };

      const sends = await db
        .select()
        .from(newsletterSends)
        .orderBy(desc(newsletterSends.sentAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: newsletterSends.id })
        .from(newsletterSends);

      return {
        sends,
        total: countResult.length,
      };
    }),

  /** Get news collection statistics */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return null;

    // Total articles
    const [{ count: totalArticles }] = await db
      .select({ count: aiNewsArticles.id })
      .from(aiNewsArticles);

    // Articles by category
    const categoryCounts = await db
      .select({
        category: aiNewsArticles.category,
        count: aiNewsArticles.id,
      })
      .from(aiNewsArticles)
      .groupBy(aiNewsArticles.category);

    // Articles by source
    const sourceCounts = await db
      .select({
        source: aiNewsArticles.source,
        count: aiNewsArticles.id,
      })
      .from(aiNewsArticles)
      .groupBy(aiNewsArticles.source);

    // Engagement summary
    const [{ count: totalEngagements }] = await db
      .select({ count: newsEngagementMetrics.id })
      .from(newsEngagementMetrics);

    // Total newsletters sent
    const [{ count: totalNewsletters }] = await db
      .select({ count: newsletterSends.id })
      .from(newsletterSends)
      .where(eq(newsletterSends.status, 'sent'));

    return {
      totalArticles,
      categoryCounts,
      sourceCounts,
      totalEngagements,
      totalNewsletters,
    };
  }),

  /** Add manual article */
  addManualArticle: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        summary: z.string().min(1),
        content: z.string().optional(),
        category: z.string().min(1).max(100),
        source: z.string().min(1).max(255),
        url: z.string().url(),
        imageUrl: z.string().url().optional(),
        keyTakeaways: z.array(z.string()).optional(),
        gigitekAiAngle: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if URL already exists
      const [existing] = await db
        .select({ id: aiNewsArticles.id })
        .from(aiNewsArticles)
        .where(eq(aiNewsArticles.url, input.url));

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Article with this URL already exists" });
      }

      const [result] = await db.insert(aiNewsArticles).values({
        title: input.title,
        summary: input.summary,
        content: input.content ?? null,
        category: input.category,
        source: input.source,
        url: input.url,
        imageUrl: input.imageUrl ?? null,
        publishedAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        keyTakeaways: input.keyTakeaways ? JSON.stringify(input.keyTakeaways) : null,
        gigitekAiAngle: input.gigitekAiAngle ?? null,
        readMoreText: "Read the full article →",
        includedInNewsletter: 0,
        includedInBlog: 0,
        isManuallyAdded: 1,
        isArchived: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { success: true, id: (result as any).insertId };
    }),

  /** Delete article */
  deleteArticle: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.delete(aiNewsArticles).where(eq(aiNewsArticles.id, input.id));
      return { success: true };
    }),
});
