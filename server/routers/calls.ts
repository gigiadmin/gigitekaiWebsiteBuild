/**
 * Calls Router
 * Handles Teams PSTN call logs, AI-generated draft tickets, and review workflow.
 */

import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { callLogs, callDraftTickets, tickets, users } from "../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { getCallPollerStatus, triggerCallPollerRun } from "../_core/callPoller";
import { createTicket } from "../db";

export const callsRouter = router({
  // ── Poller status ─────────────────────────────────────────────────────────
  getPollerStatus: adminProcedure.query(() => {
    return getCallPollerStatus();
  }),

  triggerPoll: adminProcedure.mutation(async () => {
    return await triggerCallPollerRun();
  }),

  // ── Call logs ─────────────────────────────────────────────────────────────
  getCallLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
        direction: z.enum(["inbound", "outbound", "all"]).default("inbound"),
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const fromDate = new Date(Date.now() - input.days * 86400000);

      let query = db
        .select()
        .from(callLogs)
        .orderBy(desc(callLogs.startedAt))
        .limit(input.limit)
        .offset(input.offset);

      const results = await query;
      return results.filter((r) => {
        if (input.direction === "all") return true;
        return r.direction === input.direction;
      });
    }),

  // ── Draft tickets ─────────────────────────────────────────────────────────
  getDraftTickets: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const results = await db
        .select({
          draft: callDraftTickets,
          log: {
            graphCallId: callLogs.graphCallId,
            callerNumber: callLogs.callerNumber,
            durationSeconds: callLogs.durationSeconds,
            startedAt: callLogs.startedAt,
            hasTranscript: callLogs.hasTranscript,
            transcriptText: callLogs.transcriptText,
          },
        })
        .from(callDraftTickets)
        .leftJoin(callLogs, eq(callDraftTickets.callLogId, callLogs.id))
        .orderBy(desc(callDraftTickets.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      if (input.status === "all") return results;
      return results.filter((r) => r.draft.reviewStatus === input.status);
    }),

  getDraftTicket: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const results = await db
        .select({
          draft: callDraftTickets,
          log: callLogs,
        })
        .from(callDraftTickets)
        .leftJoin(callLogs, eq(callDraftTickets.callLogId, callLogs.id))
        .where(eq(callDraftTickets.id, input.id))
        .limit(1);

      if (!results.length) throw new Error("Draft ticket not found");
      return results[0];
    }),

  // ── Approve draft → create real ticket ────────────────────────────────────
  approveDraft: adminProcedure
    .input(
      z.object({
        draftId: z.number(),
        title: z.string().min(1).max(200),
        description: z.string().min(1),
        priority: z.enum(["low", "medium", "high", "critical"]),
        category: z.string(),
        userId: z.number().optional(), // override matched user
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get the draft
      const drafts = await db
        .select()
        .from(callDraftTickets)
        .where(eq(callDraftTickets.id, input.draftId))
        .limit(1);
      if (!drafts.length) throw new Error("Draft not found");
      const draft = drafts[0];

      // Resolve userId — use override, matched user, or fall back to a system user
      let resolvedUserId: number = input.userId ?? draft.userId ?? 0;
      if (!resolvedUserId) {
        // Create/find a guest user for the caller
        const callerEmail = draft.callerEmail || `caller-${draft.callerPhone?.replace(/\D/g, "")}@external.gigitekai.com`;
        const existing = await db.select().from(users).where(eq(users.email, callerEmail)).limit(1);
        if (existing.length) {
          resolvedUserId = existing[0].id;
        } else {
          const [newUser] = await db.insert(users).values({
            openId: `phone-${(draft.callerPhone || "unknown").replace(/\D/g, "")}-${Date.now()}`,
            email: callerEmail,
            name: draft.callerName || draft.callerPhone || "Phone Caller",
            role: "user",
            approved: true,
          });
          resolvedUserId = (newUser as any).insertId;
        }
      }

      // Map AI category to valid ticket category enum
      const categoryMap: Record<string, "bug_report" | "feature_request" | "general_support" | "billing"> = {
        m365: "general_support",
        security: "general_support",
        network: "general_support",
        hardware: "bug_report",
        software: "bug_report",
        email: "general_support",
        account_access: "general_support",
        billing: "billing",
        general_support: "general_support",
        bug_report: "bug_report",
        feature_request: "feature_request",
      };
      const mappedCategory = categoryMap[input.category] ?? "general_support";

      // Create the real ticket
      const ticket = await createTicket({
        userId: resolvedUserId,
        title: input.title,
        description: input.description,
        priority: input.priority as any,
        category: mappedCategory,
        source: "phone",
      });

      // Mark draft as approved
      await db
        .update(callDraftTickets)
        .set({
          reviewStatus: "approved",
          ticketId: ticket?.id ?? null,
          reviewedAt: new Date(),
        })
        .where(eq(callDraftTickets.id, input.draftId));

      return { success: true, ticketId: ticket?.id };
    }),

  // ── Reject draft ──────────────────────────────────────────────────────────
  rejectDraft: adminProcedure
    .input(
      z.object({
        draftId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(callDraftTickets)
        .set({
          reviewStatus: "rejected",
          reviewNotes: input.reason ?? null,
          reviewedAt: new Date(),
        })
        .where(eq(callDraftTickets.id, input.draftId));

      return { success: true };
    }),

  // ── Delete draft ──────────────────────────────────────────────────────────
  deleteDraft: adminProcedure
    .input(
      z.object({
        draftId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Delete the draft ticket
      await db
        .delete(callDraftTickets)
        .where(eq(callDraftTickets.id, input.draftId));

      return { success: true };
    }),

  // ── Update draft fields before approving ─────────────────────────────────
  updateDraft: adminProcedure
    .input(
      z.object({
        draftId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        category: z.string().optional(),
        callerName: z.string().optional(),
        callerEmail: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: Record<string, any> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.priority !== undefined) updates.priority = input.priority;
      if (input.category !== undefined) updates.category = input.category;
      if (input.callerName !== undefined) updates.callerName = input.callerName;
      if (input.callerEmail !== undefined) updates.callerEmail = input.callerEmail;

      await db
        .update(callDraftTickets)
        .set(updates)
        .where(eq(callDraftTickets.id, input.draftId));

      return { success: true };
    }),

  // ── Retry Transcription ──────────────────────────────────────────────────
  // Manually trigger Whisper transcription for a call log that has no transcript.
  // Requires a recordingUrl to be provided (e.g. from Twilio or ACS).
  retryTranscription: adminProcedure
    .input(
      z.object({
        callLogId: z.number(),
        recordingUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Mark as transcribing
      await db
        .update(callLogs)
        .set({ transcriptionStatus: "transcribing" })
        .where(eq(callLogs.id, input.callLogId));

      try {
        // Transcribe via Whisper using provided recording URL
        const { transcribeAudio } = await import("../_core/voiceTranscription");
        const result = await transcribeAudio({ audioUrl: input.recordingUrl, language: "en" });

        let transcript: string | null = null;
        if ("text" in result && result.text) {
          transcript = result.text;
        } else {
          throw new Error((result as any).error || "Transcription returned no text");
        }

        if (!transcript) throw new Error("Empty transcript returned");

        // Update call log with transcript
        await db
          .update(callLogs)
          .set({
            transcriptText: transcript,
            hasTranscript: true,
            transcriptionStatus: "done",
          })
          .where(eq(callLogs.id, input.callLogId));

        // Append transcript to the linked draft ticket description
        const draftResults = await db
          .select()
          .from(callDraftTickets)
          .where(eq(callDraftTickets.callLogId, input.callLogId))
          .limit(1);

        if (draftResults.length > 0) {
          const draft = draftResults[0];
          const updatedDesc = (draft.description || "") + `\n\n---\n**Call Transcript (added via retry):**\n${transcript}`;
          await db
            .update(callDraftTickets)
            .set({ description: updatedDesc })
            .where(eq(callDraftTickets.id, draft.id));
        }

        return { success: true, transcriptLength: transcript.length };
      } catch (err) {
        // Mark as failed
        await db
          .update(callLogs)
          .set({ transcriptionStatus: "failed" })
          .where(eq(callLogs.id, input.callLogId));
        throw err;
      }
    }),

  // ── Stats ─────────────────────────────────────────────────────────────────
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, pending: 0, approved: 0, rejected: 0, todayCalls: 0 };

    const [drafts, logs] = await Promise.all([
      db.select().from(callDraftTickets),
      db.select().from(callLogs),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: drafts.length,
      pending: drafts.filter((d) => d.reviewStatus === "pending").length,
      approved: drafts.filter((d) => d.reviewStatus === "approved").length,
      rejected: drafts.filter((d) => d.reviewStatus === "rejected").length,
      todayCalls: logs.filter((l) => l.startedAt && new Date(l.startedAt) >= today).length,
    };
  }),
});
