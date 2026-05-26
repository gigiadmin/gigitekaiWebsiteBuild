/**
 * Teams Call Poller
 * Polls Microsoft Graph API for new PSTN inbound calls every 5 minutes.
 * For each new call:
 *   1. Fetches PSTN call log (caller number, duration, timestamps)
 *   2. Attempts to fetch call transcript (if recording/transcription enabled)
 *   3. Runs AI analysis to generate summary, title, priority, category
 *   4. Performs phone number lookup against users table
 *   5. Creates a draft ticket record for admin review
 */

import { invokeLLM } from "./llm";
import { getDb } from "../db";
import { callLogs, callDraftTickets, users } from "../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { startAcsRecording } from "../acsRecordingService";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;

// Poll every 5 minutes
const POLL_INTERVAL_MS = 5 * 60 * 1000;

let pollerTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let lastPollTime: Date | null = null;
let callsProcessedToday = 0;
let lastError: string | null = null;
let lastResetDay = new Date().getDate();

// ─── Token Cache ──────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getGraphToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    console.warn("[Call Poller] MS Graph credentials not configured");
    return null;
  }
  try {
    const res = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          scope: "https://graph.microsoft.com/.default",
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[Call Poller] Token fetch failed:", err);
      return null;
    }
    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000;
    return cachedToken;
  } catch (err) {
    console.error("[Call Poller] Token error:", err);
    return null;
  }
}

// ─── Graph API Helpers ────────────────────────────────────────────────────────
async function graphGet(path: string): Promise<any | null> {
  const token = await getGraphToken();
  if (!token) return null;
  try {
    const res = await fetch(`${GRAPH_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.text();
      // If 403, clear token cache so next call gets a fresh token with updated permissions
      if (res.status === 403) {
        cachedToken = null;
        tokenExpiry = 0;
        console.warn(`[Call Poller] 403 on ${path} — cleared token cache for refresh`);
      }
      console.warn(`[Call Poller] Graph GET ${path} failed: ${res.status} ${err.slice(0, 200)}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[Call Poller] Graph GET ${path} error:`, err);
    return null;
  }
}

// ─── Fetch PSTN Calls ─────────────────────────────────────────────────────────
async function fetchPstnCalls(fromDate: Date, toDate: Date): Promise<any[]> {
  const from = fromDate.toISOString().split("T")[0];
  const to = toDate.toISOString().split("T")[0];
  const data = await graphGet(
    `/communications/callRecords/getPstnCalls(fromDateTime=${from},toDateTime=${to})`
  );
  return data?.value ?? [];
}

// ─── Fetch Transcript ─────────────────────────────────────────────────────────
/**
 * Attempts to fetch a transcript for a given online meeting.
 * PSTN calls may not have transcripts unless recording is enabled.
 * Returns plain text or null if unavailable.
 */
async function fetchTranscript(userId: string, meetingId: string): Promise<string | null> {
  try {
    // List transcripts for this meeting
    const transcripts = await graphGet(
      `/users/${userId}/onlineMeetings/${meetingId}/transcripts`
    );
    if (!transcripts?.value?.length) {
      console.log(`[Call Poller] No transcripts found for meeting ${meetingId}`);
      return null;
    }

    const transcriptId = transcripts.value[0].id;
    // Fetch the actual transcript content (VTT format)
    const token = await getGraphToken();
    if (!token) {
      console.warn(`[Call Poller] Could not get Graph token for transcript fetch`);
      return null;
    }

    const res = await fetch(
      `${GRAPH_BASE}/users/${userId}/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content?$format=text/vtt`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      console.warn(`[Call Poller] Failed to fetch transcript content: ${res.status} ${res.statusText}`);
      return null;
    }

    const vttContent = await res.text();
    // Convert VTT to plain text (strip timestamps and metadata)
    const plainText = vttToPlainText(vttContent);
    console.log(`[Call Poller] Successfully fetched transcript: ${plainText.substring(0, 100)}...`);
    return plainText;
  } catch (error) {
    console.error(`[Call Poller] Error fetching transcript: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function vttToPlainText(vtt: string): string {
  return vtt
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed === "WEBVTT") return false;
      if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return false; // timestamp lines
      if (/-->/.test(trimmed)) return false; // cue timing lines
      if (/^\d+$/.test(trimmed)) return false; // cue number lines
      return true;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────
interface CallAnalysis {
  title: string;
  summary: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  confidence: number;
}

async function analyzeCall(
  transcript: string | null,
  callMeta: {
    callerNumber: string;
    duration: number;
    startTime: string;
  }
): Promise<CallAnalysis> {
  const context = transcript
    ? `CALL TRANSCRIPT:\n${transcript}`
    : `CALL METADATA:\n- Caller: ${callMeta.callerNumber}\n- Duration: ${callMeta.duration} seconds\n- Time: ${callMeta.startTime}\n(No transcript available — call recording may not be enabled)`;

  const prompt = `You are an IT support ticket analyzer for GigitekAI, a Microsoft 365 MSP.

Analyze this inbound support call and generate a helpdesk ticket.

${context}

Respond with JSON only:
{
  "title": "concise ticket title (max 80 chars)",
  "summary": "2-3 sentence description of the issue and what was discussed",
  "priority": "low|medium|high|critical",
  "category": "m365|security|network|hardware|software|email|account_access|billing|general_support",
  "confidence": 0.0-1.0
}

Priority guide:
- critical: system down, data loss, security breach
- high: major service degraded, multiple users affected
- medium: single user issue, workaround available
- low: question, training request, minor issue`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an IT support ticket analyzer. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "call_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
              category: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["title", "summary", "priority", "category", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty LLM response");
    // Handle both string and array content from LLM
    const contentStr = typeof content === 'string' ? content : (Array.isArray(content) && content[0]?.type === 'text' ? content[0].text : JSON.stringify(content));
    return JSON.parse(contentStr) as CallAnalysis;
  } catch (err) {
    console.warn("[Call Poller] AI analysis failed, using defaults:", err);
    return {
      title: `Inbound call from ${callMeta.callerNumber}`,
      summary: `Inbound support call from ${callMeta.callerNumber}. Duration: ${Math.round(callMeta.duration / 60)} minutes. Manual review required.`,
      priority: "medium",
      category: "general_support",
      confidence: 0.3,
    };
  }
}

// ─── Phone Lookup ─────────────────────────────────────────────────────────────
async function lookupCallerByPhone(phone: string): Promise<{ userId: number; name: string; email: string } | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    // Normalize phone: strip spaces, dashes, parens
    const normalized = phone.replace(/[\s\-\(\)]/g, "");
    // Look up by phone in contactSubmissions table (where customers leave their phone)
    const result = await db.execute(
      `SELECT u.id, u.name, u.email 
       FROM users u 
       JOIN contactSubmissions cs ON cs.email = u.email 
       WHERE REPLACE(REPLACE(REPLACE(cs.phone, ' ', ''), '-', ''), '(', '') LIKE ?
       LIMIT 1`
    );
    const rows = (result as any[]).filter(r => r.id);
    if (rows.length > 0) {
      return { userId: rows[0].id, name: rows[0].name || "Unknown", email: rows[0].email || "" };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Process Single Call ──────────────────────────────────────────────────────
async function processCall(pstnRow: any): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const graphCallId = pstnRow.id || pstnRow.callId;
  if (!graphCallId) return;

  // Skip if already processed
  const existing = await db.select().from(callLogs).where(eq(callLogs.graphCallId, graphCallId)).limit(1);
  if (existing.length > 0) return;

  // Only process inbound calls (customer calling us)
  const direction = pstnRow.callType?.includes("_in") ? "inbound" : "outbound";
  if (direction !== "inbound") return;

  const callerNumber = pstnRow.callerNumber || "Unknown";
  const calleeNumber = pstnRow.calleeNumber || "";
  const calleeDisplayName = pstnRow.userDisplayName || "";
  const calleeUpn = pstnRow.userPrincipalName || "";
  const startedAt = pstnRow.startDateTime ? new Date(pstnRow.startDateTime) : new Date();
  const endedAt = pstnRow.endDateTime ? new Date(pstnRow.endDateTime) : new Date();
  const durationSeconds = pstnRow.duration || 0;

  console.log(`[Call Poller] Processing inbound call from ${callerNumber} (${durationSeconds}s)`);

  // Try to fetch transcript (requires recording + transcription enabled in Teams)
  // PSTN calls (regular phone calls) don't have conferenceId — transcript only available for Teams meetings
  let transcriptText: string | null = null;
  let transcriptionStatus: "pending" | "done" | "failed" | "unavailable" = "unavailable";
  let acsRecordingId: string | null = null;
  
  if (pstnRow.userId && pstnRow.conferenceId) {
    transcriptionStatus = "pending";
    transcriptText = await fetchTranscript(pstnRow.userId, pstnRow.conferenceId);
    transcriptionStatus = transcriptText ? "done" : "unavailable";
  } else if (pstnRow.serverCallId) {
    // For PSTN calls without Teams transcript, start ACS recording
    console.log(`[Call Poller] Starting ACS recording for PSTN call ${graphCallId}`);
    const callbackBaseUrl = process.env.VITE_APP_ID ? `https://${process.env.VITE_APP_ID}.manus.space` : "https://gigitekai.com";
    acsRecordingId = await startAcsRecording(pstnRow.serverCallId, callbackBaseUrl);
    if (acsRecordingId) {
      transcriptionStatus = "pending";
      console.log(`[Call Poller] ACS recording started: ${acsRecordingId}`);
    } else {
      console.warn(`[Call Poller] Failed to start ACS recording for call ${graphCallId}`);
    }
  }

  // AI analysis
  const analysis = await analyzeCall(transcriptText, {
    callerNumber,
    duration: durationSeconds,
    startTime: startedAt.toISOString(),
  });

  // Phone lookup
  const callerInfo = await lookupCallerByPhone(callerNumber);

  // Save call log
  const [callLogResult] = await db.insert(callLogs).values({
    graphCallId,
    callerNumber,
    calleeNumber,
    calleeDisplayName,
    calleeUpn,
    matchedUserId: callerInfo?.userId ?? null,
    direction: "inbound",
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationSeconds,
    hasTranscript: transcriptText ? 1 : 0,
    transcriptionStatus,
    transcriptText: transcriptText ?? null,
    acsRecordingId: acsRecordingId ?? null,
    aiSummary: analysis.summary,
    aiTitle: analysis.title,
    aiPriority: analysis.priority,
    aiCategory: analysis.category,
    aiConfidence: String(analysis.confidence),
    status: "analyzed",
  });

  const callLogId = (callLogResult as any).insertId;

  // Create draft ticket for admin review
  await db.insert(callDraftTickets).values({
    callLogId,
    callerPhone: callerNumber,
    callerName: callerInfo?.name ?? null,
    callerEmail: callerInfo?.email ?? null,
    userId: callerInfo?.userId ?? null,
    title: analysis.title,
    description: analysis.summary + (transcriptText ? `\n\n---\n**Call Transcript:**\n${transcriptText}` : ""),
    category: analysis.category,
    priority: analysis.priority,
    reviewStatus: "pending",
  });

  // Update call log status
  await db.update(callLogs).set({ status: "draft_created" }).where(eq(callLogs.graphCallId, graphCallId));

  callsProcessedToday++;
  console.log(`[Call Poller] Draft ticket created for call from ${callerNumber} — "${analysis.title}"`);

  // ── Auto-score calls that have a transcript ───────────────────────────────
  if (transcriptText && callLogId) {
    try {
      const { autoScoreCall } = await import("../routers/callQuality");
      await autoScoreCall(callLogId, transcriptText, pstnRow);
      console.log(`[Call Poller] Auto-scored call ${callLogId}`);
    } catch (scoreErr) {
      console.warn(`[Call Poller] Auto-scoring failed for call ${callLogId}:`, scoreErr instanceof Error ? scoreErr.message : String(scoreErr));
    }
  }

  // ── ACS Recording: Note on PSTN transcription ────────────────────────────
  // The MS Graph PSTN call records API does NOT return a serverCallId.
  // serverCallId is only available in real-time via ACS Call Automation events,
  // not from historical call records.
  //
  // To enable PSTN call transcription, one of these approaches is required:
  //   1. Teams Compliance Recording policy (requires certified recording partner)
  //   2. ACS Call Automation real-time interception (requires ACS resource linked to Teams Phone)
  //   3. Voicemail transcription (already working via Whisper on email attachments)
  //
  // For now, PSTN calls without a conferenceId will have transcriptionStatus = 'unavailable'.
  // This is expected behavior — voicemail transcription covers the most important use case.
  if (!transcriptText) {
    console.log(`[Call Poller] ℹ️ No transcript for call from ${callerNumber} (PSTN calls require Teams Compliance Recording or ACS Call Automation for real-time transcription)`);
  }
}

// ─── Main Poll Cycle ──────────────────────────────────────────────────────────
async function runPollCycle(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  lastError = null;

  // Reset daily counter
  const today = new Date().getDate();
  if (today !== lastResetDay) {
    callsProcessedToday = 0;
    lastResetDay = today;
  }

  try {
    // Fetch calls from the last 7 days on first run, then last 24 hours
    const toDate = new Date();
    const isFirstRun = !lastPollTime;
    const lookbackMs = isFirstRun ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const fromDate = new Date(toDate.getTime() - lookbackMs);
    if (isFirstRun) console.log("[Call Poller] First run — fetching last 7 days of PSTN calls");

    const pstnCalls = await fetchPstnCalls(fromDate, toDate);
    console.log(`[Call Poller] Fetched ${pstnCalls.length} PSTN call records`);

    for (const call of pstnCalls) {
      await processCall(call);
    }

    lastPollTime = new Date();
  } catch (err: any) {
    lastError = err?.message ?? String(err);
    console.error("[Call Poller] Poll cycle error:", err);
  } finally {
    isRunning = false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function startCallPoller(): void {
  if (pollerTimer) return;
  console.log("[Call Poller] Starting Teams PSTN call poller (5-minute interval)");
  // Run immediately on start
  runPollCycle();
  pollerTimer = setInterval(runPollCycle, POLL_INTERVAL_MS);
}

export function stopCallPoller(): void {
  if (pollerTimer) {
    clearInterval(pollerTimer);
    pollerTimer = null;
  }
}

export function getCallPollerStatus() {
  return {
    isRunning,
    lastPollTime: lastPollTime?.toISOString() ?? null,
    nextPollTime: lastPollTime
      ? new Date(lastPollTime.getTime() + POLL_INTERVAL_MS).toISOString()
      : null,
    callsProcessedToday,
    lastError,
  };
}

export async function triggerCallPollerRun(): Promise<{ success: boolean; message: string }> {
  if (isRunning) return { success: false, message: "Poll already in progress" };
  await runPollCycle();
  return { success: true, message: "Poll cycle completed" };
}
