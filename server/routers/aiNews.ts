/**
 * AI News Management Router
 * Admin procedures for viewing, managing, and analyzing collected AI news
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
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
  listArticles: publicProcedure
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
      const db = await getDb();
      if (!db) return { articles: [], total: 0 };

      // Build where conditions
      const conditions: any[] = [];
      if (input.category) conditions.push(eq(aiNewsArticles.category, input.category));
      if (input.source) conditions.push(eq(aiNewsArticles.source, input.source));
      if (input.includedInNewsletter !== undefined) {
        conditions.push(eq(aiNewsArticles.includedInNewsletter, input.includedInNewsletter ? 1 : 0));
      }
      // Only filter by archived if explicitly requested
      if (input.isArchived === true) {
        conditions.push(eq(aiNewsArticles.isArchived, 1));
      } else if (input.isArchived === false) {
        // Show active articles by default
        conditions.push(eq(aiNewsArticles.isArchived, 0));
      }
      if (input.search) {
        conditions.push(
          like(aiNewsArticles.title, `%${input.search}%`)
        );
      }

      // For public access, always show only non-archived articles
      const publicConditions = [...conditions];
      if (!input.isArchived) {
        publicConditions.push(eq(aiNewsArticles.isArchived, 0));
      }
      const whereClause = publicConditions.length > 0 ? and(...publicConditions) : undefined;

      const articles = await db
        .select()
        .from(aiNewsArticles)
        .where(whereClause)
        .orderBy(desc(aiNewsArticles.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const countResult = await db
        .select()
        .from(aiNewsArticles)
        .where(whereClause);

      return {
        articles,
        total: countResult.length,
      };
    }),

  /** Get a single article with engagement metrics */
  getArticle: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
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

  /** Mark article as included in newsletter */
  markForNewsletter: protectedProcedure
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

  /** Get engagement metrics for an article */
  getEngagementMetrics: protectedProcedure
    .input(z.object({ articleId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) return { metrics: [] };

      const metrics = await db
        .select()
        .from(newsEngagementMetrics)
        .where(eq(newsEngagementMetrics.articleId, input.articleId));

      return { metrics };
    }),
});
