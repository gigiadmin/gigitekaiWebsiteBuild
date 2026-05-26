/**
 * Phase 2: Call Transcript Router
 * Handles call transcript storage, retrieval, search, and analysis
 * 
 * Features:
 * - Store full transcripts with speaker segments
 * - Search transcripts by keywords
 * - Extract entities (names, emails, phone numbers)
 * - Generate summaries and action items
 * - Track confidence scores
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { callTranscripts, callRecordings } from "../../drizzle/phase2-schema-additions";
import { eq, and, like, desc, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

/**
 * Input validation schemas
 */
const createTranscriptInput = z.object({
  recordingId: z.number(),
  callId: z.string().min(1),
  fullTranscript: z.string().min(1),
  segments: z.array(z.object({
    timestamp: z.number(),
    speaker: z.string(),
    text: z.string(),
    confidence: z.number().min(0).max(1),
  })).optional(),
  language: z.string().default("en-US"),
  confidence: z.number().min(0).max(1).optional(),
});

const searchTranscriptInput = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const getTranscriptInput = z.object({
  recordingId: z.number(),
});

const generateSummaryInput = z.object({
  recordingId: z.number(),
});

/**
 * Call Transcript Router
 */
export const callTranscriptRouter = router({
  /**
   * Create a new transcript
   */
  create: protectedProcedure
    .input(createTranscriptInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Check if transcript already exists
        const existing = await db
          .select()
          .from(callTranscripts)
          .where(eq(callTranscripts.recordingId, input.recordingId))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Transcript for recording ${input.recordingId} already exists`,
          });
        }

        // Extract keywords and entities using LLM
        const analysisResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert at extracting keywords and entities from transcripts. Respond with JSON only.",
            },
            {
              role: "user",
              content: `Extract keywords and entities from this transcript:

Transcript: "${input.fullTranscript}"

Respond with JSON:
{
  "keywords": ["keyword1", "keyword2", ...],
  "entities": [
    {"type": "name", "value": "..."},
    {"type": "email", "value": "..."},
    {"type": "phone", "value": "..."},
    ...
  ]
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "transcript_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                  },
                  entities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        value: { type: "string" },
                      },
                      required: ["type", "value"],
                    },
                  },
                },
                required: ["keywords", "entities"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = analysisResponse.choices[0]?.message.content;
        const analysis = JSON.parse(typeof content === 'string' ? content : "{}");

        // Create transcript record
        const result = await db
          .insert(callTranscripts)
          .values({
            recordingId: input.recordingId,
            callId: input.callId,
            fullTranscript: input.fullTranscript,
            segments: input.segments ? JSON.stringify(input.segments) : null,
            language: input.language,
            confidence: input.confidence ? String(input.confidence) : undefined,
            keywords: JSON.stringify(analysis.keywords || []),
            entities: JSON.stringify(analysis.entities || []),
            searchable: true,
          });

        return {
          success: true,
          recordingId: input.recordingId,
          keywords: analysis.keywords || [],
          entities: analysis.entities || [],
          message: "Transcript created successfully",
        };
      } catch (error) {
        console.error("[Call Transcript] Create failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create transcript",
        });
      }
    }),

  /**
   * Get a specific transcript
   */
  get: protectedProcedure
    .input(getTranscriptInput)
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const transcript = await db
          .select()
          .from(callTranscripts)
          .where(eq(callTranscripts.recordingId, input.recordingId))
          .limit(1);

        if (transcript.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Transcript for recording ${input.recordingId} not found`,
          });
        }

        const t = transcript[0];

        return {
          ...t,
          segments: t.segments ? JSON.parse(t.segments as string) : [],
          keywords: t.keywords ? JSON.parse(t.keywords as string) : [],
          entities: t.entities ? JSON.parse(t.entities as string) : [],
        };
      } catch (error) {
        console.error("[Call Transcript] Get failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve transcript",
        });
      }
    }),

  /**
   * Search transcripts by keywords
   */
  search: protectedProcedure
    .input(searchTranscriptInput)
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const transcripts = await db
          .select()
          .from(callTranscripts)
          .where(
            and(
              eq(callTranscripts.searchable, true),
              like(callTranscripts.fullTranscript, `%${input.query}%`)
            )
          )
          .orderBy(desc(callTranscripts.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        const total = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(callTranscripts)
          .where(
            and(
              eq(callTranscripts.searchable, true),
              like(callTranscripts.fullTranscript, `%${input.query}%`)
            )
          );

        return {
          transcripts: transcripts.map(t => ({
            ...t,
            segments: t.segments ? JSON.parse(t.segments as string) : [],
            keywords: t.keywords ? JSON.parse(t.keywords as string) : [],
            entities: t.entities ? JSON.parse(t.entities as string) : [],
          })),
          total: total[0]?.count || 0,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("[Call Transcript] Search failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search transcripts",
        });
      }
    }),

  /**
   * Generate summary and action items from transcript
   */
  generateSummary: protectedProcedure
    .input(generateSummaryInput)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Get transcript
        const transcript = await db
          .select()
          .from(callTranscripts)
          .where(eq(callTranscripts.recordingId, input.recordingId))
          .limit(1);

        if (transcript.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Transcript for recording ${input.recordingId} not found`,
          });
        }

        const t = transcript[0];

        // Generate summary using LLM
        const summaryResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert at summarizing customer service calls and extracting action items. Respond with JSON only.",
            },
            {
              role: "user",
              content: `Summarize this call transcript and extract action items:

Transcript: "${t.fullTranscript}"

Respond with JSON:
{
  "summary": "Brief summary of the call (2-3 sentences)",
  "actionItems": [
    {"item": "action item 1", "owner": "agent or customer", "dueDate": "YYYY-MM-DD or null"},
    ...
  ]
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "call_summary",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  actionItems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item: { type: "string" },
                        owner: { type: "string" },
                        dueDate: { type: ["string", "null"] },
                      },
                      required: ["item", "owner"],
                    },
                  },
                },
                required: ["summary", "actionItems"],
                additionalProperties: false,
              },
            },
          },
        });

        const summaryContent = summaryResponse.choices[0]?.message.content;
        const summaryData = JSON.parse(typeof summaryContent === 'string' ? summaryContent : "{}");

        // Update transcript with summary and action items
        await db
          .update(callTranscripts)
          .set({
            summary: summaryData.summary,
            actionItems: JSON.stringify(summaryData.actionItems || []),
            updatedAt: new Date(),
          })
          .where(eq(callTranscripts.recordingId, input.recordingId));

        return {
          success: true,
          recordingId: input.recordingId,
          summary: summaryData.summary,
          actionItems: summaryData.actionItems || [],
          message: "Summary generated successfully",
        };
      } catch (error) {
        console.error("[Call Transcript] Generate summary failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate summary",
        });
      }
    }),

  /**
   * Get transcript statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const stats = await db
        .select({
          totalTranscripts: sql<number>`COUNT(*)`,
          averageConfidence: sql`AVG(confidence)`,
          transcriptsWithSummary: sql`SUM(CASE WHEN summary IS NOT NULL THEN 1 ELSE 0 END)`,
          transcriptsWithActionItems: sql`SUM(CASE WHEN action_items IS NOT NULL THEN 1 ELSE 0 END)`,
        })
        .from(callTranscripts);

      return stats[0] || {
        totalTranscripts: 0,
        averageConfidence: 0,
        transcriptsWithSummary: 0,
        transcriptsWithActionItems: 0,
      };
    } catch (error) {
      console.error("[Call Transcript] Stats failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get transcript statistics",
      });
    }
  }),
});
