import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { kbArticleShares, kbArticles, kbArticleAnalytics } from "../../drizzle/schema";
import { eq, desc , gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

export const kbSharingRouter = router({
  /**
   * Share a KB article via email
   */
  shareArticle: protectedProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        email: z.string().email(),
        message: z.string().optional(),
        ticketId: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify article exists
      const article = await db.select().from(kbArticles).where(eq(kbArticles.id, input.articleId));
      if (!article || article.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }

      // Create share record
      const result = await db.insert(kbArticleShares).values({
        articleId: input.articleId,
        sharedBy: ctx.user.id,
        sharedWith: input.email,
        sharedVia: "email",
        ticketId: input.ticketId,
        message: input.message,
      });

      // Increment share count in analytics
      const analytics = await db
        .select()
        .from(kbArticleAnalytics)
        .where(eq(kbArticleAnalytics.articleId, input.articleId));

      if (analytics.length > 0) {
        await db
          .update(kbArticleAnalytics)
          .set({ shares: (analytics[0].shares || 0) + 1 })
          .where(eq(kbArticleAnalytics.articleId, input.articleId));
      }

      // Send notification
      await notifyOwner({
        title: "KB Article Shared",
        content: `Agent shared KB article "${article[0].title}" with ${input.email}${input.ticketId ? ` (Ticket #${input.ticketId})` : ""}`,
      });

      return {
        success: true,
        shareId: (result as any).insertId || 0,
        articleId: input.articleId,
        sharedWith: input.email,
      };
    }),

  /**
   * Get all shares for an article
   */
  getArticleShares: protectedProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const shares = await db
        .select()
        .from(kbArticleShares)
        .where(eq(kbArticleShares.articleId, input.articleId))
        .orderBy(desc(kbArticleShares.sharedAt))
        .limit(input.limit)
        .offset(input.offset);

      return shares;
    }),

  /**
   * Get user's share history
   */
  getUserShares: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const shares = await db
        .select()
        .from(kbArticleShares)
        .where(eq(kbArticleShares.sharedBy, ctx.user.id))
        .orderBy(desc(kbArticleShares.sharedAt))
        .limit(input.limit)
        .offset(input.offset);

      return shares;
    }),

  /**
   * Mark share as viewed
   */
  markShareViewed: protectedProcedure
    .input(z.object({ shareId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db
        .update(kbArticleShares)
        .set({ viewedAt: new Date().toISOString() })
        .where(eq(kbArticleShares.id, input.shareId));

      return { success: true, shareId: input.shareId };
    }),

  /**
   * Get share statistics for an article
   */
  getShareStats: protectedProcedure
    .input(z.object({ articleId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const shares = await db
        .select()
        .from(kbArticleShares)
        .where(eq(kbArticleShares.articleId, input.articleId));

      const viewedCount = shares.filter((s) => s.viewedAt).length;
      const totalShares = shares.length;

      return {
        articleId: input.articleId,
        totalShares,
        viewedCount,
        viewRate: totalShares > 0 ? Math.round((viewedCount / totalShares) * 100) : 0,
        lastSharedAt: shares.length > 0 ? shares[0].sharedAt : null,
      };
    }),

  /**
   * Delete a share record
   */
  deleteShare: protectedProcedure
    .input(z.object({ shareId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const share = await db.select().from(kbArticleShares).where(eq(kbArticleShares.id, input.shareId));
      if (!share || share.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Share not found" });
      }

      if (share[0].sharedBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own shares" });
      }

      await db.delete(kbArticleShares).where(eq(kbArticleShares.id, input.shareId));

      return { success: true, shareId: input.shareId };
    }),

  /**
   * Get most shared articles
   */
  getMostSharedArticles: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(10),
        days: z.number().int().positive().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const thirtyDaysAgo = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      // Get shares in the last N days grouped by article
      const shares = await db
        .select()
        .from(kbArticleShares)
        .where(gte(kbArticleShares.sharedAt, thirtyDaysAgo.toISOString()));

      // Group by articleId and count
      const grouped = shares.reduce(
        (acc: Record<number, number>, share) => {
          acc[share.articleId] = (acc[share.articleId] || 0) + 1;
          return acc;
        },
        {}
      );

      // Sort and get top N
      const topArticles = Object.entries(grouped)
        .sort(([, a], [, b]) => b - a)
        .slice(0, input.limit)
        .map(([articleId, count]) => ({
          articleId: parseInt(articleId),
          shareCount: count,
        }));

      return topArticles;
    }),
});
