import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { ticketSurveys, tickets } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const helpdeskSurveyRouter = router({
  /**
   * Submit a survey for a closed ticket
   * Records: rating (1-5), optional comment, submission timestamp
   */
  submitSurvey: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ticket exists and is closed
      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      if (ticket.status !== "closed" && ticket.status !== "resolved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Survey can only be submitted for closed or resolved tickets" });
      }

      // Check if survey already submitted
      const existingSurveyList = await db.select().from(ticketSurveys).where(eq(ticketSurveys.ticketId, input.ticketId));
      const existingSurvey = existingSurveyList[0];

      if (existingSurvey) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Survey already submitted for this ticket" });
      }

      // Insert survey
      await db.insert(ticketSurveys).values({
        ticketId: input.ticketId,
        rating: input.rating,
        comment: input.comment || null,
        submittedAt: new Date(),
        submittedBy: ctx.user?.id || null,
      });

      return {
        success: true,
        ticketId: input.ticketId,
      };
    }),

  /**
   * Get survey for a specific ticket
   */
  getSurvey: publicProcedure
    .input(
      z.object({
        ticketId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const surveyList = await db.select().from(ticketSurveys).where(eq(ticketSurveys.ticketId, input.ticketId));
      return surveyList[0] || null;
    }),

  /**
   * Get all surveys (admin only)
   */
  getAllSurveys: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        minRating: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let query = db.select().from(ticketSurveys) as any;
      if (input.minRating) {
        query = query.where(sql`rating >= ${input.minRating}`);
      }
      const surveys = await query.orderBy(desc(ticketSurveys.submittedAt)).limit(input.limit).offset(input.offset);
      return surveys;
    }),

  /**
   * Get survey statistics
   */
  getSurveyStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const surveys = await db.select().from(ticketSurveys);

    if (surveys.length === 0) {
      return {
        totalSurveys: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        satisfactionRate: 0,
      };
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    let totalRating = 0;

    surveys.forEach((s: any) => {
      ratingDistribution[s.rating as keyof typeof ratingDistribution]++;
      totalRating += s.rating;
    });

    const averageRating = totalRating / surveys.length;
    const satisfactionRate = ((ratingDistribution[4] + ratingDistribution[5]) / surveys.length) * 100;

    return {
      totalSurveys: surveys.length,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution,
      satisfactionRate: parseFloat(satisfactionRate.toFixed(2)),
    };
  }),

  /**
   * Get surveys by rating range
   */
  getSurveysByRating: adminProcedure
    .input(
      z.object({
        rating: z.number().min(1).max(5),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const surveys = await db.select().from(ticketSurveys).where(eq(ticketSurveys.rating, input.rating)).orderBy(desc(ticketSurveys.submittedAt)).limit(input.limit);
      return surveys;
    }),

  /**
   * Get low-rating surveys for follow-up
   */
  getLowRatingSurveys: adminProcedure
    .input(
      z.object({
        maxRating: z.number().default(2),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const surveys = await db.select().from(ticketSurveys).where(sql`rating <= ${input.maxRating}`).orderBy(desc(ticketSurveys.submittedAt)).limit(input.limit);
      return surveys;
    }),

  /**
   * Get survey feedback comments
   */
  getSurveyComments: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const surveys = await db.select().from(ticketSurveys).where(sql`comment IS NOT NULL AND comment != ''`).orderBy(desc(ticketSurveys.submittedAt)).limit(input.limit);
      return surveys.map((s: any) => ({
        ticketId: s.ticketId,
        rating: s.rating,
        comment: s.comment,
        submittedAt: s.submittedAt,
      }));
    }),
});
