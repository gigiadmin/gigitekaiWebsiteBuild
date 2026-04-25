import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router, protectedProcedure } from "./trpc";
import { getEmailPollerStatus, triggerEmailPollerRun } from "./emailPoller";
import { getDb } from "../db";
import { tickets } from "../../drizzle/schema";
import { gte } from "drizzle-orm";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  getEmailPollerStatus: adminProcedure.query(() => {
    return getEmailPollerStatus();
  }),

  triggerEmailPoller: adminProcedure.mutation(async () => {
    return await triggerEmailPollerRun();
  }),

  getNewTickets: protectedProcedure
    .input(
      z.object({
        minutesBack: z.number().min(1).max(60).default(6),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { data: [] };
        }

        const cutoffTime = new Date(Date.now() - input.minutesBack * 60 * 1000);
        
        const newTickets = await db
          .select({
            id: tickets.id,
            title: tickets.title,
            description: tickets.description,
            priority: tickets.priority,
            status: tickets.status,
            category: tickets.category,
            createdAt: tickets.createdAt,
          })
          .from(tickets)
          .where(gte(tickets.createdAt, cutoffTime))
          .limit(50);

        return { data: newTickets };
      } catch (error) {
        console.error('[System Router] Error fetching new tickets:', error);
        return { data: [] };
      }
    }),
});
