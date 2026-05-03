import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { kbSearchQueries, kbArticles } from "../../drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export const kbSearchAnalyticsRouter = router({
  /** Record a search query (public — fires when users search in KB portal or Aria) */
  recordSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500),
        resultsCount: z.number().int().nonnegative(),
        source: z.enum(["kb_portal", "aria_chat", "ticket_widget"]).default("kb_portal"),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.insert(kbSearchQueries).values({
        query: input.query.trim().toLowerCase(),
        resultsCount: input.resultsCount,
        source: input.source,
        userId: ctx.user?.id ?? null,
        sessionId: input.sessionId,
      });

      return { success: true };
    }),

  /** Record a click on a search result (public) */
  recordClick: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500),
        articleId: z.number().int().positive(),
        source: z.enum(["kb_portal", "aria_chat", "ticket_widget"]).default("kb_portal"),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.insert(kbSearchQueries).values({
        query: input.query.trim().toLowerCase(),
        resultsCount: 1, // at least 1 since they clicked
        clickedArticleId: input.articleId,
        source: input.source,
        userId: ctx.user?.id ?? null,
        sessionId: input.sessionId,
      });

      return { success: true };
    }),

  /** Dashboard: top search queries (admin) */
  getTopQueries: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        days: z.number().int().positive().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const rows = await db
        .select({
          query: kbSearchQueries.query,
          searchCount: sql<number>`COUNT(*)`.as("searchCount"),
          avgResults: sql<number>`ROUND(AVG(${kbSearchQueries.resultsCount}), 1)`.as("avgResults"),
          clickCount: sql<number>`SUM(CASE WHEN ${kbSearchQueries.clickedArticleId} IS NOT NULL THEN 1 ELSE 0 END)`.as("clickCount"),
        })
        .from(kbSearchQueries)
        .where(gte(kbSearchQueries.createdAt, since))
        .groupBy(kbSearchQueries.query)
        .orderBy(sql`searchCount DESC`)
        .limit(input.limit);

      return rows;
    }),

  /** Dashboard: zero-result queries — content gaps (admin) */
  getZeroResultQueries: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        days: z.number().int().positive().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const rows = await db
        .select({
          query: kbSearchQueries.query,
          searchCount: sql<number>`COUNT(*)`.as("searchCount"),
          lastSearched: sql<string>`MAX(${kbSearchQueries.createdAt})`.as("lastSearched"),
        })
        .from(kbSearchQueries)
        .where(
          and(
            gte(kbSearchQueries.createdAt, since),
            eq(kbSearchQueries.resultsCount, 0)
          )
        )
        .groupBy(kbSearchQueries.query)
        .orderBy(sql`searchCount DESC`)
        .limit(input.limit);

      return rows;
    }),

  /** Dashboard: search volume over time (admin) */
  getSearchVolume: adminProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const rows = await db
        .select({
          day: sql<string>`DATE(${kbSearchQueries.createdAt})`.as("day"),
          totalSearches: sql<number>`COUNT(*)`.as("totalSearches"),
          zeroResults: sql<number>`SUM(CASE WHEN ${kbSearchQueries.resultsCount} = 0 THEN 1 ELSE 0 END)`.as("zeroResults"),
          withClicks: sql<number>`SUM(CASE WHEN ${kbSearchQueries.clickedArticleId} IS NOT NULL THEN 1 ELSE 0 END)`.as("withClicks"),
        })
        .from(kbSearchQueries)
        .where(gte(kbSearchQueries.createdAt, since))
        .groupBy(sql`DATE(${kbSearchQueries.createdAt})`)
        .orderBy(sql`day ASC`);

      return rows;
    }),

  /** Dashboard: search source breakdown (admin) */
  getSourceBreakdown: adminProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const rows = await db
        .select({
          source: kbSearchQueries.source,
          searchCount: sql<number>`COUNT(*)`.as("searchCount"),
          clickCount: sql<number>`SUM(CASE WHEN ${kbSearchQueries.clickedArticleId} IS NOT NULL THEN 1 ELSE 0 END)`.as("clickCount"),
        })
        .from(kbSearchQueries)
        .where(gte(kbSearchQueries.createdAt, since))
        .groupBy(kbSearchQueries.source);

      return rows;
    }),

  /** Dashboard: overall search metrics (admin) */
  getDashboardMetrics: adminProcedure
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalSearches: 0, uniqueQueries: 0, zeroResultRate: 0, clickThroughRate: 0 };

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const [metrics] = await db
        .select({
          totalSearches: sql<number>`COUNT(*)`.as("totalSearches"),
          uniqueQueries: sql<number>`COUNT(DISTINCT ${kbSearchQueries.query})`.as("uniqueQueries"),
          zeroResults: sql<number>`SUM(CASE WHEN ${kbSearchQueries.resultsCount} = 0 THEN 1 ELSE 0 END)`.as("zeroResults"),
          withClicks: sql<number>`SUM(CASE WHEN ${kbSearchQueries.clickedArticleId} IS NOT NULL THEN 1 ELSE 0 END)`.as("withClicks"),
        })
        .from(kbSearchQueries)
        .where(gte(kbSearchQueries.createdAt, since));

      const total = Number(metrics?.totalSearches) || 0;
      const zeroResults = Number(metrics?.zeroResults) || 0;
      const withClicks = Number(metrics?.withClicks) || 0;

      return {
        totalSearches: total,
        uniqueQueries: Number(metrics?.uniqueQueries) || 0,
        zeroResultRate: total > 0 ? Math.round((zeroResults / total) * 100) : 0,
        clickThroughRate: total > 0 ? Math.round((withClicks / total) * 100) : 0,
      };
    }),
});
