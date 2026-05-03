/**
 * Session Recording Router
 * Handles upload, storage (S3), and retrieval of WebRTC session recordings
 * Recordings are stored as WebM blobs uploaded in chunks from the browser
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";

// ── Helpers ──────────────────────────────────────────────────────────────────
function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Router ───────────────────────────────────────────────────────────────────
export const sessionRecordingRouter = router({
  /**
   * Upload a completed session recording (base64-encoded WebM blob)
   * Called by the browser after MediaRecorder stops
   */
  uploadRecording: protectedProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        ticketId: z.number().int().positive().optional(),
        durationSeconds: z.number().int().min(0),
        mimeType: z.string().default("video/webm"),
        // base64-encoded blob (max ~50 MB after encoding = ~37 MB raw)
        data: z.string().min(1),
        participantCount: z.number().int().min(1).default(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Decode base64 → Buffer
      const buffer = Buffer.from(input.data, "base64");
      const sizeMb = Math.round((buffer.byteLength / 1024 / 1024) * 10) / 10;

      // Upload to S3
      const fileKey = `remote-sessions/${input.roomId}/recording-${randomSuffix()}.webm`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Persist metadata in DB using raw query (schema not yet migrated)
      const db = await getDb();
      if (db) {
        await db.execute(
          sql`INSERT INTO session_recordings
               (session_id, recorded_by, recording_url, file_key, duration_seconds, file_size_mb, mime_type, participant_count, created_at)
             VALUES (${input.roomId}, ${ctx.user.openId}, ${url}, ${fileKey},
                     ${input.durationSeconds}, ${sizeMb}, ${input.mimeType}, ${input.participantCount}, NOW())`
        );
      }

      return { success: true, url, sizeMb, durationSeconds: input.durationSeconds };
    }),

  /**
   * List recordings for a given ticket or room
   */
  getRecordings: protectedProcedure
    .input(
      z.object({
        roomId: z.string().optional(),
        ticketId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!input.roomId && !input.ticketId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Provide roomId or ticketId" });
      }

      // Only admins can list recordings
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      let rows: any[] = [];
      if (!db) return [];
      if (input.roomId) {
        const result = await db.execute(
          sql`SELECT id, session_id, recorded_by, recording_url, duration_seconds, file_size_mb, created_at
              FROM session_recordings WHERE session_id = ${input.roomId} ORDER BY created_at DESC`
        );
        rows = (result[0] as unknown as any[]) ?? [];
      } else if (input.ticketId) {
        const likePattern = `ticket-${input.ticketId}-%`;
        const result = await db.execute(
          sql`SELECT id, session_id, recorded_by, recording_url, duration_seconds, file_size_mb, created_at
              FROM session_recordings WHERE session_id LIKE ${likePattern} ORDER BY created_at DESC`
        );
        rows = (result[0] as unknown as any[]) ?? [];
      }

      return rows.map((r: any) => ({
        id: r.id,
        roomId: r.session_id,
        recordedBy: r.recorded_by,
        url: r.recording_url,
        durationSeconds: r.duration_seconds ?? 0,
        sizeMb: r.file_size_mb ?? 0,
        createdAt: new Date(r.created_at),
      }));
    }),

  /**
   * Delete a recording (admin only)
   */
  deleteRecording: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const db = await getDb();
      if (db) await db.execute(sql`DELETE FROM session_recordings WHERE id = ${input.id}`);
      return { success: true };
    }),
});
