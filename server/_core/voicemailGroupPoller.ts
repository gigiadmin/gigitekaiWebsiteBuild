/*
 * Voicemail Group Poller
 * Directly polls the voicemail@gigitekai.com M365 Group for new voicemail audio.
 * Bypasses Power Automate dependency — fetches audio.mp3 directly from the group,
 * transcribes via Whisper, and creates call log entries + draft tickets for admin review.
 *
 * CRITICAL: Filters system/informational messages at the M365 post level BEFORE processing
 * to prevent M365 group welcome messages from creating draft tickets.
 */

import { getDb } from "../db";
import { callLogs, callDraftTickets, users, voicemailDedup } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { invokeLLM } from "./llm";
import { transcribeAudio } from "./voiceTranscription";
import { storagePut } from "../storage";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const GROUP_ID = "b70ef14d-68dc-4faa-b7f6-8324b43c99b5";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let pollerTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let lastPollTime: Date | null = null;
let voicemailsProcessedToday = 0;
let lastError: string | null = null;
let lastResetDay = new Date().getDate();

// Track processed thread IDs to avoid duplicates
const processedThreadIds = new Set<string>();

// ─── Token ───────────────────────────────────────────────────────────────────
async function getGraphToken(): Promise<string | null> {
  try {
    const { getMsGraphToken } = await import("./email");
    return await getMsGraphToken();
  } catch {
    return null;
  }
}

// ─── System Message Detection (M365 Post Level) ────────────────────────────────
function isSystemMessagePost(post: any): boolean {
  const body = post.body?.content || "";
  const subject = post.subject || "";
  const from = post.from?.emailAddress?.name || "";
  
  // Check if from system/group account
  if (from.toLowerCase().includes("system") || from.toLowerCase().includes("group")) {
    return true;
  }
  
  // System message patterns in body or subject
  const systemPatterns = [
    /work brilliantly together/i,
    /shared voicemail group/i,
    /welcome to the/i,
    /informational message/i,
    /not a user request/i,
    /get started/i,
    /organize group work/i,
    /collaborate with your group/i,
    /use the group to share/i,
    /view group in outlook/i,
    /you're set to receive/i,
    /change this setting/i,
    /coordinate group events/i,
    /replies and events in your inbox/i,
    /group announcements/i,
    /group settings/i,
    /member joined/i,
    /member left/i,
  ];
  
  return systemPatterns.some(pattern => pattern.test(body) || pattern.test(subject));
}

// ─── Fetch Group Threads ─────────────────────────────────────────────────────
async function fetchRecentVoicemailThreads(token: string): Promise<any[]> {
  const url = `${GRAPH_BASE}/groups/${GROUP_ID}/threads?$top=10&$orderby=lastDeliveredDateTime desc`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    if (res.status === 403) {
      console.warn("[Voicemail Poller] 403 Forbidden — Group.Read.All permission may not be granted");
    } else {
      console.warn(`[Voicemail Poller] Failed to fetch threads (${res.status}): ${err.substring(0, 200)}`);
    }
    return [];
  }
  const data = await res.json();
  return data.value || [];
}

// ─── Fetch Audio from Thread ─────────────────────────────────────────────────
async function fetchAudioFromThread(
  token: string,
  threadId: string
): Promise<{ audioBuffer: Buffer; contentType: string; callerNumber: string; receivedAt: string } | null> {
  // Fetch posts with $expand=attachments
  const url = `${GRAPH_BASE}/groups/${GROUP_ID}/threads/${threadId}/posts?$top=1&$expand=attachments`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const posts = data.value || [];
  if (posts.length === 0) return null;

  const post = posts[0];
  
  // ⚠️ CRITICAL FILTER: Skip system messages BEFORE any processing
  if (isSystemMessagePost(post)) {
    console.log(`[Voicemail Poller] ⊘ Skipping M365 system message (thread: ${threadId})`);
    return null;
  }
  
  const attachments = post.attachments || [];

  // Find audio attachment
  const audioAtt = attachments.find(
    (a: any) => a.contentType?.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|webm)$/i.test(a.name)
  );
  if (!audioAtt || !audioAtt.contentBytes) return null;

  // Extract caller number from post body
  const bodyHtml = post.body?.content || "";
  const phoneMatch = bodyHtml.match(/tel:([^"]+)/);
  const callerNumber = phoneMatch ? phoneMatch[1].replace(/\s/g, "") : extractPhoneFromBody(bodyHtml);
  const receivedAt = post.createdDateTime || new Date().toISOString();

  return {
    audioBuffer: Buffer.from(audioAtt.contentBytes, "base64"),
    contentType: audioAtt.contentType || "audio/mp3",
    callerNumber: callerNumber || "Unknown",
    receivedAt,
  };
}

function extractPhoneFromBody(html: string): string {
  const patterns = [
    /\+1[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{4}/,
    /\(\d{3}\)\s?\d{3}[\s\-]?\d{4}/,
    /\d{3}[\s\-]\d{3}[\s\-]\d{4}/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[0].replace(/[\s\-\(\)]/g, "");
  }
  return "Unknown";
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────
interface VoicemailAnalysis {
  title: string;
  summary: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  callerIntent: string;
  confidence: number;
}

async function analyzeVoicemail(transcript: string, callerNumber: string): Promise<VoicemailAnalysis> {
  const prompt = `Analyze this voicemail transcript from a caller to GigitekAI's support line.

Caller: ${callerNumber}
Transcript: "${transcript}"

Respond with JSON:
{
  "title": "Brief ticket title (max 80 chars)",
  "summary": "Detailed summary of the issue/request",
  "priority": "low|medium|high|critical",
  "category": "m365|security|network|hardware|software|email|account_access|billing|general_support",
  "callerIntent": "What the caller wants/needs",
  "confidence": 0.0-1.0
}

Priority guide:
- critical: system down, data loss, security breach
- high: major service degraded, multiple users affected
- medium: single user issue, workaround available
- low: question, training request, minor issue, test call`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a helpdesk ticket analyzer. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
    });

    const text = (response.choices?.[0]?.message?.content as string) || "";
    const json = JSON.parse(text);
    return {
      title: json.title || "Voicemail",
      summary: json.summary || transcript.substring(0, 200),
      priority: json.priority || "medium",
      category: json.category || "general_support",
      callerIntent: json.callerIntent || "Unknown",
      confidence: json.confidence || 0.5,
    };
  } catch (err: any) {
    console.warn(`[Voicemail Poller] AI analysis failed: ${err.message}`);
    return {
      title: "Voicemail",
      summary: transcript.substring(0, 200),
      priority: "medium",
      category: "general_support",
      callerIntent: "Unknown",
      confidence: 0.3,
    };
  }
}

// ─── Phone Lookup ────────────────────────────────────────────────────────────
async function lookupCallerByPhone(phone: string): Promise<{ userId: number; name: string; email: string } | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const results = await db.select().from(users).where(sql`phone LIKE ${`%${phone}%`}`).limit(1);
    if (results.length > 0) {
      return { userId: results[0].id, name: results[0].name || '', email: results[0].email || '' };
    }
  } catch (err) {
    console.warn(`[Voicemail Poller] Phone lookup failed for ${phone}`);
  }
  return null;
}

// ─── Process Voicemail ───────────────────────────────────────────────────────
async function processVoicemail(
  threadId: string,
  audioBuffer: Buffer,
  contentType: string,
  callerNumber: string,
  receivedAt: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Generate a unique call ID for this voicemail
    const graphCallId = `voicemail-${threadId}`;

    // CRITICAL: Check voicemailDedup table first (persistent 24-hour dedup)
    // Use externalId match only - don't rely on expiresAt comparison which can fail with string timestamps
    const dedupCheck = await db.select().from(voicemailDedup).where(
      eq(voicemailDedup.externalId, threadId)
    ).limit(1);
    
    if (dedupCheck.length > 0) {
      console.log(`[Voicemail Poller] Voicemail already processed (dedup hit): ${threadId}`);
      return false; // Already processed - externalId exists in dedup table
    }

    // Also check callLogs for extra safety
    const existing = await db.select().from(callLogs).where(eq(callLogs.graphCallId, graphCallId)).limit(1);
    if (existing.length > 0) {
      console.log(`[Voicemail Poller] Voicemail already in callLogs: ${threadId}`);
      return false; // Already processed
    }

    console.log(`[Voicemail Poller] Processing voicemail from ${callerNumber} (received: ${receivedAt})`);

    // Step 1: Upload audio to S3 (skip if no audio buffer)
    if (!audioBuffer || audioBuffer.length === 0) {
      console.log(`[Voicemail Poller] Skipping voicemail with no audio buffer from ${callerNumber}`);
      return false;
    }
    const ext = contentType.includes("mp3") ? "mp3" : contentType.includes("wav") ? "wav" : "mp3";
    const fileKey = `voicemail-recordings/${Date.now()}-${callerNumber.replace(/\+/g, "")}.${ext}`;
    const { url: audioUrl } = await storagePut(fileKey, audioBuffer, contentType);
    console.log(`[Voicemail Poller] Audio uploaded: ${audioUrl}`);

    // Step 2: Transcribe via Whisper
    let transcript: string | null = null;
    try {
      const result = await transcribeAudio({
        audioUrl,
        language: "en",
        prompt: "IT helpdesk voicemail. May include terms like Microsoft 365, Azure, Teams, SharePoint, OneDrive, password reset, email, network.",
      });
      if ("text" in result && result.text) {
        transcript = result.text;
        console.log(`[Voicemail Poller] Transcription: "${transcript.substring(0, 100)}..."`);
      }
    } catch (err: any) {
      console.warn(`[Voicemail Poller] Transcription failed: ${err.message}`);
    }

    // Step 3: CRITICAL - Skip if no transcript (can't analyze or deduplicate)
    if (!transcript) {
      console.log(`[Voicemail Poller] Skipping voicemail with no transcript from ${callerNumber}`);
      return false;
    }
    
    // Step 3b: Record in voicemailDedup table IMMEDIATELY (before draft creation)
    // This prevents reprocessing even if an error occurs during draft creation
    const transcriptHash = transcript.substring(0, 50);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    try {
      // Format date as MySQL-compatible string: 'YYYY-MM-DD HH:MM:SS'
      const mysqlExpiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ');
      await db.insert(voicemailDedup).values({
        callerPhone: callerNumber,
        transcriptHash,
        externalId: threadId,
        source: "group",
        expiresAt: mysqlExpiresAt,
      });
      console.log(`[Voicemail Poller] ✅ Dedup entry recorded for threadId: ${threadId} (expires: ${mysqlExpiresAt})`);
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY' || err.message?.includes('Duplicate')) {
        console.log(`[Voicemail Poller] Dedup entry already exists (race condition safe): ${threadId}`);
        return false; // Already being processed
      }
      console.warn(`[Voicemail Poller] Failed to record dedup entry: ${err.message}`);
      // DO NOT continue - if we can't record dedup, don't create draft to prevent duplicates
      return false;
    }
    
    const analysis = await analyzeVoicemail(transcript, callerNumber);

    // Step 4: Phone lookup
    const callerInfo = await lookupCallerByPhone(callerNumber);

    // Step 5: Create call log entry
    const startTime = new Date(receivedAt);
    const [callLogResult] = await db.insert(callLogs).values({
      graphCallId,
      callerNumber,
      calleeNumber: "+17273825776",
      calleeDisplayName: "GigitekAI Main Line Auto Attendant",
      calleeUpn: "voicemail@gigitekai.com",
      matchedUserId: callerInfo?.userId ?? null,
      direction: "inbound",
      startedAt: startTime.toISOString(),
      endedAt: startTime.toISOString(),
      durationSeconds: 0,
      hasTranscript: transcript ? 1 : 0,
      transcriptionStatus: transcript ? "done" : "failed",
      transcriptText: transcript,
      aiSummary: analysis.summary,
      aiTitle: analysis.title,
      aiPriority: analysis.priority,
      aiCategory: analysis.category,
      aiConfidence: String(analysis.confidence),
      status: "draft_created",
      acsRecordingUrl: audioUrl,
    });

    const callLogId = (callLogResult as any).insertId;

    // Step 6: Create draft ticket
    const description = [
      analysis.summary,
      `\n\n**Caller Intent:** ${analysis.callerIntent}`,
      transcript ? `\n\n---\n**Voicemail Transcript (Whisper AI):**\n${transcript}` : "\n\n*No transcript available*",
      `\n\n**Audio Recording:** [Listen](${audioUrl})`,
    ].join("");

    await db.insert(callDraftTickets).values({
      callLogId,
      callerPhone: callerNumber,
      callerName: callerInfo?.name ?? null,
      callerEmail: callerInfo?.email ?? null,
      userId: callerInfo?.userId ?? null,
      title: analysis.title,
      description,
      category: analysis.category,
      priority: analysis.priority,
      reviewStatus: "pending",
    });
    
    console.log(`[Voicemail Poller] Draft ticket created for ${callerNumber}: "${analysis.title}"`);

    // Step 7: Update call log status
    await db.update(callLogs).set({ status: "draft_created", draftTicketId: callLogId }).where(eq(callLogs.id, callLogId));

    // Note: Dedup entry was already recorded in Step 3b (before draft creation) to prevent duplicates

    // Step 8: Send Teams notification
    try {
      const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;
      if (teamsWebhookUrl) {
        const card = {
          type: "message",
          attachments: [
            {
              contentType: "application/vnd.microsoft.card.adaptive",
              content: {
                $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                type: "AdaptiveCard",
                version: "1.4",
                body: [
                  {
                    type: "TextBlock",
                    text: "🎙️ New Voicemail Received",
                    weight: "Bolder",
                    size: "Medium",
                    color: "Accent",
                  },
                  {
                    type: "FactSet",
                    facts: [
                      { title: "Caller", value: callerInfo?.name ? `${callerInfo.name} (${callerNumber})` : callerNumber },
                      { title: "Priority", value: analysis.priority.toUpperCase() },
                      { title: "Category", value: analysis.category },
                      { title: "Intent", value: analysis.callerIntent.substring(0, 100) },
                    ],
                  },
                  {
                    type: "TextBlock",
                    text: `**${analysis.title}**`,
                    wrap: true,
                  },
                  {
                    type: "TextBlock",
                    text: transcript ? `_"${transcript.substring(0, 200)}${transcript.length > 200 ? "..." : ""}"_` : "_No transcript available_",
                    wrap: true,
                    isSubtle: true,
                  },
                ],
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "Review in Call Dashboard",
                    url: "https://gigitekai.com/admin/call-review",
                  },
                  {
                    type: "Action.OpenUrl",
                    title: "Listen to Recording",
                    url: audioUrl,
                  },
                ],
              },
            },
          ],
        };

        await fetch(teamsWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(card),
        });
        console.log(`[Voicemail Poller] Teams notification sent for voicemail from ${callerNumber}`);
      }
    } catch (teamsErr: any) {
      console.warn(`[Voicemail Poller] Teams notification failed: ${teamsErr.message}`);
    }

    voicemailsProcessedToday++;
    console.log(`[Voicemail Poller] ✅ Voicemail processed: "${analysis.title}" from ${callerNumber}`);
    return true;
  } catch (err: any) {
    console.error(`[Voicemail Poller] ❌ Failed to process voicemail from ${callerNumber}:`, err.message);
    lastError = err.message;
    return false;
  }
}

// ─── Main Poll Cycle ─────────────────────────────────────────────────────────
async function runPollCycle(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  // Reset daily counter
  const today = new Date().getDate();
  if (today !== lastResetDay) {
    voicemailsProcessedToday = 0;
    lastResetDay = today;
  }

  try {
    const token = await getGraphToken();
    if (!token) {
      console.warn("[Voicemail Poller] No Graph token available, skipping cycle");
      return;
    }

    const threads = await fetchRecentVoicemailThreads(token);
    if (threads.length === 0) return;

    let newCount = 0;
    for (const thread of threads) {
      const threadId = thread.id;
      if (!threadId || !thread.hasAttachments) continue;

      // Skip if already processed in memory
      if (processedThreadIds.has(threadId)) continue;

      // Try to fetch audio (includes system message filtering at M365 post level)
      const audioData = await fetchAudioFromThread(token, threadId);
      if (!audioData) {
        processedThreadIds.add(threadId); // Mark as checked even if no audio or system message
        continue;
      }

      const success = await processVoicemail(
        threadId,
        audioData.audioBuffer,
        audioData.contentType,
        audioData.callerNumber,
        audioData.receivedAt
      );

      processedThreadIds.add(threadId);
      if (success) newCount++;
    }

    if (newCount > 0) {
      console.log(`[Voicemail Poller] Processed ${newCount} new voicemail(s) this cycle`);
    }

    lastPollTime = new Date();
  } catch (err: any) {
    lastError = err?.message ?? String(err);
    console.error("[Voicemail Poller] Poll cycle error:", err);
  } finally {
    isRunning = false;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────
export function startVoicemailGroupPoller(): void {
  if (pollerTimer) return;
  console.log("[Voicemail Poller] Starting M365 Group voicemail poller (5-minute interval)");
  runPollCycle();
  pollerTimer = setInterval(runPollCycle, POLL_INTERVAL_MS);
}

export function stopVoicemailGroupPoller(): void {
  if (pollerTimer) {
    clearInterval(pollerTimer);
    pollerTimer = null;
  }
}

export function getVoicemailPollerStatus() {
  return {
    isRunning,
    lastPollTime: lastPollTime?.toISOString() || null,
    voicemailsProcessedToday,
    lastError,
  };
}

export function triggerVoicemailPoll(): Promise<void> {
  return runPollCycle();
}
