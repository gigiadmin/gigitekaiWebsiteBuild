/**
 * Call Quality Scoring Router
 * AI-powered rubric-based scoring of call transcripts.
 * Evaluates agent performance across 6 categories and generates an overall score.
 */

import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { callLogs, callQualityScores } from "../../drizzle/schema";
import { eq, desc, isNotNull, sql, and, gte } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ── Voicemail detection ───────────────────────────────────────────────────────
const VOICEMAIL_UPNS = ['voicemail@gigitekai.com', 'voicemail@gigitek.com'];
const AUTO_ATTENDANT_NAMES = ['auto attendant', 'voicemail', 'main line auto attendant'];

function isVoicemailCall(call: { calleeUpn?: string | null; calleeDisplayName?: string | null; durationSeconds?: number | null }): boolean {
  // Check if callee is a voicemail/auto-attendant UPN
  if (call.calleeUpn && VOICEMAIL_UPNS.includes(call.calleeUpn.toLowerCase())) return true;
  // Check if callee display name indicates auto-attendant
  if (call.calleeDisplayName) {
    const name = call.calleeDisplayName.toLowerCase();
    if (AUTO_ATTENDANT_NAMES.some(pattern => name.includes(pattern))) return true;
  }
  return false;
}

// ── Scoring rubric ─────────────────────────────────────────────────────────────
const SCORING_RUBRIC = `
You are a call quality analyst for GigitekAI, an AI-first Managed Services Provider.
Evaluate the following call transcript and score the agent on 6 categories (0–10 each):

1. **Greeting & Professionalism** (scoreGreeting): Did the agent greet professionally, introduce themselves, and set a positive tone?
2. **Empathy & Active Listening** (scoreEmpathy): Did the agent acknowledge the customer's issue, show empathy, and listen without interrupting?
3. **Technical Accuracy** (scoreTechnical): Were the agent's technical explanations accurate, clear, and appropriate for the customer's level?
4. **Problem Resolution** (scoreResolution): Did the agent resolve the issue or provide a clear next step? Was the resolution effective?
5. **Communication Clarity** (scoreCommunication): Was the agent's language clear, concise, and free of jargon? Did they confirm understanding?
6. **Compliance & Procedure** (scoreCompliance): Did the agent follow proper procedures (ticket creation, escalation, closing steps)?

Also provide:
- **totalScore**: Weighted average (0–100). Formula: (sum of all 6 scores / 60) * 100, rounded to nearest integer.
- **grade**: Letter grade based on totalScore: A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)
- **aiSummary**: 2-3 sentence narrative summary of the call quality
- **strengths**: 1-2 key strengths demonstrated (comma-separated)
- **improvements**: 1-2 specific areas for improvement (comma-separated)

Return ONLY valid JSON matching this exact schema.
`;

// ── AI scoring function ────────────────────────────────────────────────────────
async function scoreTranscript(transcript: string, agentName: string): Promise<{
  scoreGreeting: number;
  scoreEmpathy: number;
  scoreTechnical: number;
  scoreResolution: number;
  scoreCommunication: number;
  scoreCompliance: number;
  totalScore: number;
  grade: string;
  aiSummary: string;
  strengths: string;
  improvements: string;
}> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: SCORING_RUBRIC },
      {
        role: "user",
        content: `Agent: ${agentName}\n\nTranscript:\n${transcript.slice(0, 8000)}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "call_quality_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            scoreGreeting: { type: "integer", description: "0-10 score for greeting & professionalism" },
            scoreEmpathy: { type: "integer", description: "0-10 score for empathy & active listening" },
            scoreTechnical: { type: "integer", description: "0-10 score for technical accuracy" },
            scoreResolution: { type: "integer", description: "0-10 score for problem resolution" },
            scoreCommunication: { type: "integer", description: "0-10 score for communication clarity" },
            scoreCompliance: { type: "integer", description: "0-10 score for compliance & procedure" },
            totalScore: { type: "integer", description: "0-100 weighted total score" },
            grade: { type: "string", description: "Letter grade: A, B, C, D, or F" },
            aiSummary: { type: "string", description: "2-3 sentence narrative summary" },
            strengths: { type: "string", description: "Key strengths (comma-separated)" },
            improvements: { type: "string", description: "Areas for improvement (comma-separated)" },
          },
          required: [
            "scoreGreeting", "scoreEmpathy", "scoreTechnical", "scoreResolution",
            "scoreCommunication", "scoreCompliance", "totalScore", "grade",
            "aiSummary", "strengths", "improvements"
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) throw new Error("LLM returned empty response");
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
  return JSON.parse(content);
}

// ── Router ─────────────────────────────────────────────────────────────────────
export const callQualityRouter = router({
  // Score a single call by callLogId
  scoreCall: adminProcedure
    .input(z.object({ callLogId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Fetch the call log
      const [call] = await db
        .select()
        .from(callLogs)
        .where(eq(callLogs.id, input.callLogId))
        .limit(1);

      if (!call) throw new Error("Call log not found");
      if (!call.transcriptText) throw new Error("No transcript available for this call");

      // Warn if this is a voicemail (but still allow manual scoring if admin insists)
      if (isVoicemailCall(call)) {
        console.warn(`[Call Quality] Warning: Scoring voicemail/auto-attendant call ${input.callLogId} — results may be all zeros`);
      }

      const agentName = call.calleeDisplayName || call.calleeUpn || "Unknown Agent";

      // Run AI scoring
      const scores = await scoreTranscript(call.transcriptText, agentName);

      // Upsert into callQualityScores
      const existing = await db
        .select({ id: callQualityScores.id })
        .from(callQualityScores)
        .where(eq(callQualityScores.callLogId, input.callLogId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(callQualityScores)
          .set({
            ...scores,
            agentName,
            agentUpn: call.calleeUpn || null,
            scoredBy: "manual",
          })
          .where(eq(callQualityScores.callLogId, input.callLogId));
      } else {
        await db.insert(callQualityScores).values({
          callLogId: input.callLogId,
          agentName,
          agentUpn: call.calleeUpn || null,
          ...scores,
          scoredBy: "manual",
        });
      }

      return { success: true, scores, agentName };
    }),

  // Get all quality scores with call details
  getScores: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Convert to MySQL timestamp format (YYYY-MM-DD HH:MM:SS)
      const fromDate = new Date(Date.now() - input.days * 86400000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      const scores = await db
        .select({
          score: callQualityScores,
          call: {
            id: callLogs.id,
            callerNumber: callLogs.callerNumber,
            calleeDisplayName: callLogs.calleeDisplayName,
            startedAt: callLogs.startedAt,
            durationSeconds: callLogs.durationSeconds,
            aiCategory: callLogs.aiCategory,
          },
        })
        .from(callQualityScores)
        .innerJoin(callLogs, eq(callQualityScores.callLogId, callLogs.id))
        .where(gte(callQualityScores.scoredAt, fromDate))
        .orderBy(desc(callQualityScores.scoredAt))
        .limit(input.limit)
        .offset(input.offset);

      return scores;
    }),

  // Get summary stats for the dashboard
  getSummaryStats: adminProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Aggregate stats - convert to MySQL timestamp format (YYYY-MM-DD HH:MM:SS)
      const fromDate = new Date(Date.now() - input.days * 86400000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
      const [stats] = await db
        .select({
          totalScored: sql<number>`COUNT(*)`,
          avgTotal: sql<number>`AVG(totalScore)`,
          avgGreeting: sql<number>`AVG(scoreGreeting)`,
          avgEmpathy: sql<number>`AVG(scoreEmpathy)`,
          avgTechnical: sql<number>`AVG(scoreTechnical)`,
          avgResolution: sql<number>`AVG(scoreResolution)`,
          avgCommunication: sql<number>`AVG(scoreCommunication)`,
          avgCompliance: sql<number>`AVG(scoreCompliance)`,
          countA: sql<number>`SUM(CASE WHEN grade = 'A' THEN 1 ELSE 0 END)`,
          countB: sql<number>`SUM(CASE WHEN grade = 'B' THEN 1 ELSE 0 END)`,
          countC: sql<number>`SUM(CASE WHEN grade = 'C' THEN 1 ELSE 0 END)`,
          countD: sql<number>`SUM(CASE WHEN grade = 'D' THEN 1 ELSE 0 END)`,
          countF: sql<number>`SUM(CASE WHEN grade = 'F' THEN 1 ELSE 0 END)`,
        })
        .from(callQualityScores)
        .where(gte(callQualityScores.scoredAt, fromDate));

      // Agent leaderboard
      const leaderboard = await db
        .select({
          agentName: callQualityScores.agentName,
          agentUpn: callQualityScores.agentUpn,
          callsScored: sql<number>`COUNT(*)`,
          avgScore: sql<number>`AVG(totalScore)`,
          avgGreeting: sql<number>`AVG(scoreGreeting)`,
          avgEmpathy: sql<number>`AVG(scoreEmpathy)`,
          avgTechnical: sql<number>`AVG(scoreTechnical)`,
          avgResolution: sql<number>`AVG(scoreResolution)`,
          avgCommunication: sql<number>`AVG(scoreCommunication)`,
          avgCompliance: sql<number>`AVG(scoreCompliance)`,
          topGrade: sql<string>`(SELECT q2.grade FROM callQualityScores q2 WHERE q2.agentUpn = callQualityScores.agentUpn ORDER BY q2.totalScore DESC LIMIT 1)`,
        })
        .from(callQualityScores)
        .where(gte(callQualityScores.scoredAt, fromDate))
        .groupBy(callQualityScores.agentUpn, callQualityScores.agentName)
        .orderBy(desc(sql`AVG(totalScore)`))
        .limit(20);

      // Daily trend (last 30 days)
      const trend = await db
        .select({
          date: sql<string>`DATE(scoredAt)`,
          avgScore: sql<number>`AVG(totalScore)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(callQualityScores)
        .where(gte(callQualityScores.scoredAt, fromDate))
        .groupBy(sql`DATE(scoredAt)`)
        .orderBy(sql`DATE(scoredAt)`);

      // Calls with transcripts that haven't been scored yet (excludes voicemails)
      const unscoredCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(callLogs)
        .where(
          and(
            isNotNull(callLogs.transcriptText),
            sql`callLogs.id NOT IN (SELECT callLogId FROM callQualityScores)`,
            sql`(callLogs.calleeUpn IS NULL OR callLogs.calleeUpn NOT IN ('voicemail@gigitekai.com', 'voicemail@gigitek.com'))`,
            sql`(callLogs.calleeDisplayName IS NULL OR callLogs.calleeDisplayName NOT LIKE '%Auto Attendant%')`
          )
        );

      return {
        stats: stats || null,
        leaderboard,
        trend,
        unscoredCount: unscoredCount[0]?.count || 0,
      };
    }),

  // Get calls with transcripts that haven't been scored yet (excludes voicemails)
  getUnscoredCalls: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const unscored = await db
        .select()
        .from(callLogs)
        .where(
          and(
            isNotNull(callLogs.transcriptText),
            sql`callLogs.id NOT IN (SELECT callLogId FROM callQualityScores)`,
            // Exclude voicemail/auto-attendant calls — no agent interaction to score
            sql`(callLogs.calleeUpn IS NULL OR callLogs.calleeUpn NOT IN ('voicemail@gigitekai.com', 'voicemail@gigitek.com'))`,
            sql`(callLogs.calleeDisplayName IS NULL OR callLogs.calleeDisplayName NOT LIKE '%Auto Attendant%')`
          )
        )
        .orderBy(desc(callLogs.startedAt))
        .limit(input.limit);

      return unscored;
    }),

  // Score all unscored calls with transcripts (batch) — skips voicemails
  scoreAllUnscored: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const unscored = await db
      .select()
      .from(callLogs)
      .where(
        and(
          isNotNull(callLogs.transcriptText),
          sql`callLogs.id NOT IN (SELECT callLogId FROM callQualityScores)`,
          // Exclude voicemail/auto-attendant calls
          sql`(callLogs.calleeUpn IS NULL OR callLogs.calleeUpn NOT IN ('voicemail@gigitekai.com', 'voicemail@gigitek.com'))`,
          sql`(callLogs.calleeDisplayName IS NULL OR callLogs.calleeDisplayName NOT LIKE '%Auto Attendant%')`
        )
      )
      .orderBy(desc(callLogs.startedAt))
      .limit(10); // Process up to 10 at a time to avoid timeout

    let scored = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const call of unscored) {
      // Double-check: skip voicemails that slipped through
      if (isVoicemailCall(call)) {
        skipped++;
        continue;
      }

      try {
        const agentName = call.calleeDisplayName || call.calleeUpn || "Unknown Agent";
        const scores = await scoreTranscript(call.transcriptText!, agentName);

        await db.insert(callQualityScores).values({
          callLogId: call.id,
          agentName,
          agentUpn: call.calleeUpn || null,
          ...scores,
          scoredBy: "auto",
        }).onDuplicateKeyUpdate({ set: { updatedAt: new Date().toISOString() } });

        scored++;
      } catch (err) {
        failed++;
        errors.push(`Call ${call.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return { scored, failed, skipped, errors, total: unscored.length };
  }),
});

// ── Auto-score helper (called by callPoller) ───────────────────────────────────
// Exported separately so callPoller can import it without going through tRPC
export async function autoScoreCall(
  callLogId: number,
  transcriptText: string,
  callMeta: { calleeDisplayName?: string | null; calleeUpn?: string | null }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Skip voicemail/auto-attendant calls — no agent interaction to score
  if (isVoicemailCall(callMeta)) {
    console.log(`[Call Quality] Skipping voicemail/auto-attendant call ${callLogId} — no agent interaction`);
    return;
  }

  const agentName = callMeta.calleeDisplayName || callMeta.calleeUpn || "Unknown Agent";

  try {
    const scores = await scoreTranscript(transcriptText, agentName);

    await db
      .insert(callQualityScores)
      .values({
        callLogId,
        agentName,
        agentUpn: callMeta.calleeUpn || null,
        ...scores,
        scoredBy: "auto",
      })
      .onDuplicateKeyUpdate({ set: { updatedAt: new Date().toISOString() } });

    console.log(`[Call Quality] Auto-scored call ${callLogId}: ${scores.totalScore}/100 (${scores.grade})`);
  } catch (err) {
    console.warn(`[Call Quality] Auto-scoring failed for call ${callLogId}:`, err instanceof Error ? err.message : String(err));
  }
}
