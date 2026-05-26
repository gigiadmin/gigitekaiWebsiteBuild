import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { kbArticleAnalytics, kbArticleViews, kbArticleShares, kbArticles } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const kbAnalyticsRouter = router({
  /**
   * Record an article view
   */
  recordView: protectedProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        viewedFrom: z.enum(["kb_portal", "ticket_detail", "search_widget", "share_link"]).default("kb_portal"),
        ticketId: z.number().int().optional(),
        timeSpent: z.number().int().nonnegative().optional(),
        helpful: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Record view
      await db.insert(kbArticleViews).values({
        articleId: input.articleId,
        viewedBy: ctx.user.id,
        viewedFrom: input.viewedFrom,
        ticketId: input.ticketId,
        timeSpent: input.timeSpent,
        helpful: input.helpful !== undefined ? (input.helpful ? 1 : 0) : null,
      });

      // Update analytics
      const analytics = await db
        .select()
        .from(kbArticleAnalytics)
        .where(eq(kbArticleAnalytics.articleId, input.articleId));

      if (analytics.length > 0) {
        await db
          .update(kbArticleAnalytics)
          .set({ views: (analytics[0].views || 0) + 1, lastViewedAt: new Date().toISOString() })
          .where(eq(kbArticleAnalytics.articleId, input.articleId));
      } else {
        // Create analytics record if it doesn't exist
        await db.insert(kbArticleAnalytics).values({
          articleId: input.articleId,
          views: 1,
          shares: 0,
          ticketsResolved: 0,
        });
      }

      return { success: true, articleId: input.articleId };
    }),

  /**
   * Get article analytics
   */
  getArticleAnalytics: protectedProcedure
    .input(z.object({ articleId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const analytics = await db
        .select()
        .from(kbArticleAnalytics)
        .where(eq(kbArticleAnalytics.articleId, input.articleId));

      if (!analytics || analytics.length === 0) {
        return null;
      }

      const views = await db
        .select()
        .from(kbArticleViews)
        .where(eq(kbArticleViews.articleId, input.articleId));

      const helpfulCount = views.filter((v) => v.helpful === 1).length;
      const unhelpfulCount = views.filter((v) => v.helpful === 0).length;

      return {
        ...analytics[0],
        helpfulCount,
        unhelpfulCount,
        helpfulRate: views.length > 0 ? Math.round((helpfulCount / views.length) * 100) : 0,
      };
    }),

  /**
   * Get top articles by views
   */
  getTopArticlesByViews: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(10),
        days: z.number().int().positive().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const analytics = await db
        .select()
        .from(kbArticleAnalytics)
        .orderBy(desc(kbArticleAnalytics.views))
        .limit(input.limit);

      return analytics;
    }),

  /**
   * Get most effective articles (highest resolution rate)
   */
  getMostEffectiveArticles: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const analytics = await db
        .select()
        .from(kbArticleAnalytics)
        .where(sql`ticketsResolved > 0`)
        .orderBy(desc(kbArticleAnalytics.ticketsResolved))
        .limit(input.limit);

      return analytics;
    }),

  /**
   * Get KB dashboard metrics
   */
  getDashboardMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allAnalytics = await db.select().from(kbArticleAnalytics);
    const allViews = await db.select().from(kbArticleViews);
    const allShares = await db.select().from(kbArticleShares);

    const totalViews = allAnalytics.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalShares = allAnalytics.reduce((sum, a) => sum + (a.shares || 0), 0);
    const totalResolved = allAnalytics.reduce((sum, a) => sum + (a.ticketsResolved || 0), 0);

    const helpfulViews = allViews.filter((v) => v.helpful === 1).length;
    const totalViewRecords = allViews.length;
    const helpfulRate = totalViewRecords > 0 ? Math.round((helpfulViews / totalViewRecords) * 100) : 0;

    const avgTimeSpent =
      allViews.length > 0
        ? Math.round(allViews.reduce((sum, v) => sum + (v.timeSpent || 0), 0) / allViews.length)
        : 0;

    return {
      totalArticles: allAnalytics.length,
      totalViews,
      totalShares,
      totalTicketsResolved: totalResolved,
      helpfulRate,
      avgTimeSpent,
      shareViewRate: totalShares > 0 ? Math.round((allShares.filter((s) => s.viewedAt).length / totalShares) * 100) : 0,
    };
  }),

  /**
   * Get article performance trends (last 7 days)
   */
  getPerformanceTrends: adminProcedure
    .input(z.object({ articleId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const views = await db
        .select()
        .from(kbArticleViews)
        .where(eq(kbArticleViews.articleId, input.articleId));

      // Group by day
      const trends = views.reduce(
        (acc: Record<string, { views: number; helpful: number }>, view) => {
          const day = (view.viewedAt as string)?.split("T")[0] || "unknown";
          if (!acc[day]) {
            acc[day] = { views: 0, helpful: 0 };
          }
          acc[day].views++;
          if (view.helpful) acc[day].helpful++;
          return acc;
        },
        {}
      );

      return Object.entries(trends).map(([day, data]) => ({
        day,
        views: data.views,
        helpful: data.helpful,
        helpfulRate: data.views > 0 ? Math.round((data.helpful / data.views) * 100) : 0,
      }));
    }),

  /**
   * Mark ticket as resolved using KB article
   */
  markTicketResolved: protectedProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        ticketId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const analytics = await db
        .select()
        .from(kbArticleAnalytics)
        .where(eq(kbArticleAnalytics.articleId, input.articleId));

      if (analytics.length > 0) {
        await db
          .update(kbArticleAnalytics)
          .set({ ticketsResolved: (analytics[0].ticketsResolved || 0) + 1 })
          .where(eq(kbArticleAnalytics.articleId, input.articleId));
      }

      return { success: true, articleId: input.articleId, ticketId: input.ticketId };
    }),

  /**
   * Get article suggestions for a ticket (AI-powered)
   */
  getSuggestedArticles: protectedProcedure
    .input(
      z.object({
        ticketTitle: z.string().min(5),
        ticketDescription: z.string().min(10),
        limit: z.number().int().positive().default(5),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get all published articles
      const articles = await db.select().from(kbArticles).where(eq(kbArticles.isPublished, 1));

      if (articles.length === 0) {
        return [];
      }

      // Simple keyword matching (can be enhanced with AI/LLM)
      const searchText = `${input.ticketTitle} ${input.ticketDescription}`.toLowerCase();
      const keywords = searchText.split(/\s+/).filter((w) => w.length > 3);

      const scored = articles.map((article) => {
        const articleText = `${article.title} ${article.content}`.toLowerCase();
        const matches = keywords.filter((keyword) => articleText.includes(keyword)).length;
        const score = matches / keywords.length;
        return { ...article, score };
      });

      // Sort by score and return top N
      return scored.filter((a) => a.score > 0).sort((a, b) => b.score - a.score).slice(0, input.limit);
    }),
});
