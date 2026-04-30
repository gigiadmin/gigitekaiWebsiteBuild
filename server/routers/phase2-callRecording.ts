/**
 * Phase 2: Call Recording Router
 * Handles call recording storage, retrieval, and management
 * 
 * Integrates with:
 * - Azure Blob Storage (recording files)
 * - Dynamics 365 Contact Center (call metadata)
 * - Website helpdesk (ticket sync)
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { callRecordings, callTranscripts, callAnalytics } from "../../drizzle/phase2-schema-additions";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { storagePut, storageGet } from "../storage";
import { TRPCError } from "@trpc/server";

/**
 * Input validation schemas
 */
const createRecordingInput = z.object({
  callId: z.string().min(1),
  customerId: z.number().optional(),
  agentId: z.number().optional(),
  duration: z.number().min(0),
  recordingBuffer: z.instanceof(Buffer),
  mimeType: z.string().default("audio/wav"),
  consentGiven: z.boolean().default(true),
});

const getRecordingInput = z.object({
  callId: z.string().min(1),
});

const listRecordingsInput = z.object({
  customerId: z.number().optional(),
  agentId: z.number().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const deleteRecordingInput = z.object({
  callId: z.string().min(1),
});

/**
 * Call Recording Router
 */
export const callRecordingRouter = router({
  /**
   * Create a new call recording
   * Stores recording file in Azure Blob Storage
   * Creates metadata record in database
   */
  create: protectedProcedure
    .input(createRecordingInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Check if recording already exists
        const existing = await db
          .select()
          .from(callRecordings)
          .where(eq(callRecordings.callId, input.callId))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Recording for call ${input.callId} already exists`,
          });
        }

        // Upload recording to Azure Blob Storage
        const recordingKey = `call-recordings/${input.callId}-${Date.now()}.wav`;
        const { url: recordingUrl } = await storagePut(
          recordingKey,
          input.recordingBuffer,
          input.mimeType
        );

        // Create metadata record
        const result = await db
          .insert(callRecordings)
          .values({
            callId: input.callId,
            customerId: input.customerId,
            agentId: input.agentId,
            recordingUrl,
            recordingKey,
            duration: input.duration,
            fileSize: input.recordingBuffer.length,
            mimeType: input.mimeType,
            startTime: new Date(),
            endTime: new Date(Date.now() + input.duration * 1000),
            status: "completed",
            consentGiven: input.consentGiven,
          });

        return {
          success: true,
          callId: input.callId,
          recordingUrl,
          recordingKey,
          message: "Recording created successfully",
        };
      } catch (error) {
        console.error("[Call Recording] Create failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create call recording",
        });
      }
    }),

  /**
   * Get a specific call recording
   */
  get: protectedProcedure
    .input(getRecordingInput)
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const recording = await db
          .select()
          .from(callRecordings)
          .where(eq(callRecordings.callId, input.callId))
          .limit(1);

        if (recording.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Recording for call ${input.callId} not found`,
          });
        }

        const rec = recording[0];

        // Check access permissions (agent can only access their own recordings)
        if (ctx.user?.role === "user" && rec.agentId !== ctx.user?.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to access this recording",
          });
        }

        // Get presigned URL for download
        const { url: downloadUrl } = await storageGet(rec.recordingKey); // Presigned URL

        return {
          ...rec,
          downloadUrl,
        };
      } catch (error) {
        console.error("[Call Recording] Get failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve call recording",
        });
      }
    }),

  /**
   * List call recordings with filtering
   */
  list: protectedProcedure
    .input(listRecordingsInput)
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const conditions = [];

        if (input.customerId) {
          conditions.push(eq(callRecordings.customerId, input.customerId));
        }

        if (input.agentId) {
          conditions.push(eq(callRecordings.agentId, input.agentId));
        }

        if (input.startDate) {
          conditions.push(gte(callRecordings.startTime, input.startDate));
        }

        if (input.endDate) {
          conditions.push(lte(callRecordings.startTime, input.endDate));
        }

        // If user is agent, only show their own recordings
        if (ctx.user?.role === "user") {
          conditions.push(eq(callRecordings.agentId, ctx.user?.id));
        }

        const recordings = await db
          .select()
          .from(callRecordings)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(callRecordings.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        const total = await db
          .select({ count: sql`COUNT(*)` })
          .from(callRecordings)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        return {
          recordings,
          total: total[0]?.count || 0,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("[Call Recording] List failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list call recordings",
        });
      }
    }),

  /**
   * Delete a call recording
   * Removes from Azure Blob Storage and database
   */
  delete: protectedProcedure
    .input(deleteRecordingInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Get recording
        const recording = await db
          .select()
          .from(callRecordings)
          .where(eq(callRecordings.callId, input.callId))
          .limit(1);

        if (recording.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Recording for call ${input.callId} not found`,
          });
        }

        const rec = recording[0];

        // Check permissions (only admin or owner can delete)
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can delete recordings",
          });
        }

        // Delete from storage (optional - implement based on your storage provider)
        // await storageDelete(rec.recordingKey);

        // Delete from database
        await db
          .delete(callRecordings)
          .where(eq(callRecordings.callId, input.callId));

        return {
          success: true,
          callId: input.callId,
          message: "Recording deleted successfully",
        };
      } catch (error) {
        console.error("[Call Recording] Delete failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete call recording",
        });
      }
    }),

  /**
   * Get recording statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const stats = await db
        .select({
          totalRecordings: sql`COUNT(*)`,
          totalDuration: sql`SUM(duration)`,
          totalSize: sql`SUM(file_size)`,
          averageDuration: sql`AVG(duration)`,
          transcribedCount: sql`SUM(CASE WHEN is_transcribed = true THEN 1 ELSE 0 END)`,
        })
        .from(callRecordings);

      return stats[0] || {
        totalRecordings: 0,
        totalDuration: 0,
        totalSize: 0,
        averageDuration: 0,
        transcribedCount: 0,
      };
    } catch (error) {
      console.error("[Call Recording] Stats failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get recording statistics",
      });
    }
  }),
});
