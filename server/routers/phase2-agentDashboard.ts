/**
 * Phase 2: Agent Dashboard Router
 * Real-time dashboard data for agents during calls
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { agentDashboardSessions } from "../../drizzle/phase2-schema-additions";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const initSessionInput = z.object({
  agentId: z.number(),
  callId: z.string().min(1),
});

const updateTranscriptInput = z.object({
  sessionId: z.number(),
  transcript: z.string(),
});

const updateSentimentInput = z.object({
  sessionId: z.number(),
  sentiment: z.number().min(-1).max(1),
});

const getSessionInput = z.object({
  sessionId: z.number(),
});

export const agentDashboardRouter = router({
  initSession: protectedProcedure
    .input(initSessionInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const existing = await db
          .select()
          .from(agentDashboardSessions)
          .where(eq(agentDashboardSessions.callId, input.callId))
          .limit(1);

        if (existing.length > 0) {
          return {
            success: true,
            sessionId: existing[0].id,
            message: "Session already exists",
          };
        }

        const result = await db
          .insert(agentDashboardSessions)
          .values({
            agentId: input.agentId,
            callId: input.callId,
            isActive: 1 as unknown as boolean,
          });

        return {
          success: true,
          sessionId: result[0],
          message: "Dashboard session initialized",
        };
      } catch (error) {
        console.error("[Agent Dashboard] Init session failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initialize dashboard session",
        });
      }
    }),

  getSession: protectedProcedure
    .input(getSessionInput)
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const session = await db
          .select()
          .from(agentDashboardSessions)
          .where(eq(agentDashboardSessions.id, input.sessionId))
          .limit(1);

        if (session.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Dashboard session ${input.sessionId} not found`,
          });
        }

        const s = session[0];

        return {
          sessionId: s.id,
          agentId: s.agentId,
          callId: s.callId,
          liveTranscript: s.liveTranscript || "",
          suggestedKbArticles: s.suggestedKbArticles ? JSON.parse(s.suggestedKbArticles as string) : [],
          currentSentiment: s.currentSentiment ? parseFloat(s.currentSentiment as string) : 0,
          sentimentColor: s.sentimentColor || "gray",
          suggestedResponses: s.suggestedResponses ? JSON.parse(s.suggestedResponses as string) : [],
          isActive: s.isActive,
          sessionStarted: s.sessionStarted,
        };
      } catch (error) {
        console.error("[Agent Dashboard] Get session failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve dashboard session",
        });
      }
    }),

  updateTranscript: protectedProcedure
    .input(updateTranscriptInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db
          .update(agentDashboardSessions)
          .set({
            liveTranscript: input.transcript,
            lastTranscriptUpdate: new Date(),
          })
          .where(eq(agentDashboardSessions.id, input.sessionId));

        return {
          success: true,
          sessionId: input.sessionId,
          message: "Transcript updated",
        };
      } catch (error) {
        console.error("[Agent Dashboard] Update transcript failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update transcript",
        });
      }
    }),

  updateSentiment: protectedProcedure
    .input(updateSentimentInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        let sentimentColor = "gray";
        if (input.sentiment < -0.5) sentimentColor = "red";
        else if (input.sentiment < -0.2) sentimentColor = "orange";
        else if (input.sentiment < 0.2) sentimentColor = "yellow";
        else if (input.sentiment < 0.5) sentimentColor = "lightgreen";
        else sentimentColor = "green";

        await db
          .update(agentDashboardSessions)
          .set({
            currentSentiment: String(input.sentiment),
            sentimentColor,
            lastSentimentUpdate: new Date(),
          })
          .where(eq(agentDashboardSessions.id, input.sessionId));

        return {
          success: true,
          sessionId: input.sessionId,
          sentiment: input.sentiment,
          sentimentColor,
          message: "Sentiment updated",
        };
      } catch (error) {
        console.error("[Agent Dashboard] Update sentiment failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update sentiment",
        });
      }
    }),

  endSession: protectedProcedure
    .input(getSessionInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        await db
          .update(agentDashboardSessions)
          .set({
            isActive: 0 as unknown as boolean,
            sessionEnded: new Date(),
          })
          .where(eq(agentDashboardSessions.id, input.sessionId));

        return {
          success: true,
          sessionId: input.sessionId,
          message: "Dashboard session ended",
        };
      } catch (error) {
        console.error("[Agent Dashboard] End session failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to end dashboard session",
        });
      }
    }),
});
