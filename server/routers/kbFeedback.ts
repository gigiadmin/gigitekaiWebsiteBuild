import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { kbArticleFeedback, kbArticles } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const kbFeedbackRouter = router({
  /** Submit feedback on a KB article (helpful/unhelpful) */
  submit: publicProcedure
    .input(
      z.object({
        messageId: z.number().int().positive(),
        articleId: z.number().int().positive(),
        rating: z.enum(["helpful", "unhelpful"]),
        feedbackMessage: z.string().optional(),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(kbArticleFeedback).values({
        messageId: input.messageId,
        articleId: input.articleId,
        rating: input.rating,
        feedbackMessage: input.feedbackMessage,
        sessionId: input.sessionId,
        userId: ctx.user?.id,
      });

      return { success: true, feedbackId: (result as any).insertId };
    }),

  /** Get feedback for a specific article (admin only) */
  getByArticle: adminProcedure
    .input(z.object({ articleId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(kbArticleFeedback)
        .where(eq(kbArticleFeedback.articleId, input.articleId))
        .orderBy(desc(kbArticleFeedback.createdAt));
    }),

  /** Get analytics for all KB articles (admin only) */
  getAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    // Get all articles with their feedback counts
    const articles = await db.select().from(kbArticles).orderBy(desc(kbArticles.updatedAt));

    const analytics = await Promise.all(
      articles.map(async (article) => {
        // Count helpful and unhelpful ratings
        const feedbackRows = await db
          .select()
          .from(kbArticleFeedback)
          .where(eq(kbArticleFeedback.articleId, article.id));

        const helpful = feedbackRows.filter((f) => f.rating === "helpful").length;
        const unhelpful = feedbackRows.filter((f) => f.rating === "unhelpful").length;
        const total = helpful + unhelpful;
        const helpfulRate = total > 0 ? Math.round((helpful / total) * 100) : 0;

        // Get unhelpful feedback messages
        const unhelpfulFeedback = feedbackRows
          .filter((f) => f.rating === "unhelpful" && f.feedbackMessage)
          .map((f) => f.feedbackMessage);

        return {
          id: article.id,
          title: article.title,
          category: article.category,
          isPublished: article.isPublished,
          helpful,
          unhelpful,
          total,
          helpfulRate,
          unhelpfulFeedback,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
        };
      })
    );

    return analytics;
  }),

  /** Get summary statistics (admin only) */
  getSummary: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      return {
        totalArticles: 0,
        publishedArticles: 0,
        totalFeedback: 0,
        helpfulCount: 0,
        unhelpfulCount: 0,
        averageHelpfulRate: 0,
      };

    const articles = await db.select().from(kbArticles);
    const publishedCount = articles.filter((a) => a.isPublished).length;

    const allFeedback = await db.select().from(kbArticleFeedback);
    const helpfulCount = allFeedback.filter((f) => f.rating === "helpful").length;
    const unhelpfulCount = allFeedback.filter((f) => f.rating === "unhelpful").length;
    const totalFeedback = allFeedback.length;
    const averageHelpfulRate = totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;

    return {
      totalArticles: articles.length,
      publishedArticles: publishedCount,
      totalFeedback,
      helpfulCount,
      unhelpfulCount,
      averageHelpfulRate,
    };
  }),

  /** Get unhelpful feedback grouped by reason (admin only) */
  getUnhelpfulReasons: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};

    const unhelpfulFeedback = await db
      .select()
      .from(kbArticleFeedback)
      .where(and(eq(kbArticleFeedback.rating, "unhelpful")));

    // Group by feedback message and count
    const reasons: Record<string, number> = {};
    unhelpfulFeedback.forEach((f) => {
      if (f.feedbackMessage) {
        reasons[f.feedbackMessage] = (reasons[f.feedbackMessage] || 0) + 1;
      }
    });

    // Sort by count descending
    return Object.entries(reasons)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }),
});
