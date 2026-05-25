/**
 * Voicemail Webhook Handler
 * Receives voicemail events from Teams and processes them into tickets
 */

import { getDb } from "./db";
import { tickets, users } from "../drizzle/schema";
import { analyzeVoicemail, extractCallerInfo } from "./voicemailProcessor";
import { sendToTeamsWithRetry } from "./_core/teamsWebhookUtils";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./_core/emailService";
import { eq, and, gt, like } from "drizzle-orm";

// ─── Deduplication ────────────────────────────────────────────────────────────
// Tracks recently processed callIds and phone+time combos to prevent duplicates
const recentlyProcessed = new Map<string, number>(); // key -> timestamp
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isDuplicate(payload: VoicemailWebhookPayload): boolean {
  // Clean up old entries
  const now = Date.now();
  const entries = Array.from(recentlyProcessed.entries());
  for (const [key, ts] of entries) {
    if (now - ts > DEDUP_WINDOW_MS) {
      recentlyProcessed.delete(key);
    }
  }

  // Check by callId first (most reliable)
  if (payload.callId) {
    const callKey = `callId:${payload.callId}`;
    if (recentlyProcessed.has(callKey)) {
      console.log(`[Voicemail] DUPLICATE detected by callId: ${payload.callId}`);
      return true;
    }
    recentlyProcessed.set(callKey, now);
  }

  // Also check by phone + transcription hash (catches retries with different callIds)
  const transcriptHash = payload.transcription.substring(0, 50).trim();
  const phoneKey = `phone:${payload.callerPhone}:${transcriptHash}`;
  if (recentlyProcessed.has(phoneKey)) {
    console.log(`[Voicemail] DUPLICATE detected by phone+content: ${payload.callerPhone}`);
    return true;
  }
  recentlyProcessed.set(phoneKey, now);

  return false;
}

export interface VoicemailWebhookPayload {
  callId: string;
  callerName: string;
  callerPhone: string;
  transcription: string;
  recordingUrl?: string;
  timestamp: string;
  duration?: number;
  voicemailBoxEmail?: string;
}

/**
 * Process incoming voicemail and create ticket
 */
export async function processVoicemail(
  payload: VoicemailWebhookPayload
): Promise<{ ticketId: number; success: boolean; error?: string }> {
  try {
    console.log(`[Voicemail] Processing voicemail from ${payload.callerPhone}`);

    // Deduplication check
    if (isDuplicate(payload)) {
      console.log(`[Voicemail] Skipping duplicate voicemail from ${payload.callerPhone} (callId: ${payload.callId})`);
      return { ticketId: 0, success: true, error: "Duplicate voicemail — skipped" };
    }

    // Analyze voicemail for sentiment and priority
    const analysis = await analyzeVoicemail(payload.transcription);

    console.log(
      `[Voicemail] Analysis: priority=${analysis.priority}, sentiment=${analysis.sentiment}`
    );

    // Get database connection
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get architect user (harry@gigitekai.com)
    const architect = await db
      .select()
      .from(users)
      .where(eq(users.email, "harry@gigitekai.com"))
      .limit(1);

    const assignedToId = architect[0]?.id || null;

    // Create ticket
    const ticketResult = await db
      .insert(tickets)
      .values({
        userId: assignedToId || 1, // Use architect ID or default to 1
        title: `Voicemail from ${payload.callerName}`,
        description: `**Voicemail from:** ${payload.callerName} (${payload.callerPhone})\n\n**Transcription:**\n${payload.transcription}\n\n**Analysis:**\n- Sentiment: ${analysis.sentiment} (${(analysis.sentimentScore * 100).toFixed(0)}%)\n- Keywords: ${analysis.keywords.join(", ") || "None"}\n- Suggested Action: ${analysis.suggestedAction}\n\n**Recording:** ${payload.recordingUrl || "Not available"}\n**Duration:** ${payload.duration ? `${payload.duration}s` : "Unknown"}\n**Timestamp:** ${payload.timestamp}`,
        status: "open",
        priority: analysis.priority,
        assignedTo: assignedToId,
        source: "phone",
      });

    const ticketId = (ticketResult as any)[0]?.insertId || (ticketResult as any).insertId || 0;

    console.log(`[Voicemail] Created ticket #${ticketId}`);

    // Post to Teams Helpdesk channel
    await postToTeamsHelpdesk(ticketId, payload, analysis);

    // Send email alert
    await sendEmailAlert(ticketId, payload, analysis);

    // Notify owner
    await notifyOwner({
      title: `New Voicemail Ticket #${ticketId}`,
      content: `From: ${payload.callerName} (${payload.callerPhone})\nPriority: ${analysis.priority}\n\n${payload.transcription.substring(0, 200)}...`,
    });

    return { ticketId, success: true };
  } catch (error) {
    console.error("[Voicemail Error]", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    // Notify owner of failure
    await notifyOwner({
      title: "Voicemail Processing Failed",
      content: `Failed to process voicemail from ${payload.callerPhone}: ${errorMsg}`,
    });

    return { ticketId: 0, success: false, error: errorMsg };
  }
}

/**
 * Post ticket to Teams Helpdesk channel
 */
async function postToTeamsHelpdesk(
  ticketId: number,
  payload: VoicemailWebhookPayload,
  analysis: Awaited<ReturnType<typeof analyzeVoicemail>>
): Promise<void> {
  const ticketUrl = `${process.env.VITE_APP_URL || "https://gigitekai.com"}/admin/helpdesk/${ticketId}`;

  const priorityColor = {
    critical: "Attention",
    high: "Warning",
    medium: "Accent",
    low: "Good",
  }[analysis.priority];

  const card = {
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: `📞 New Voicemail Ticket #${ticketId}`,
        weight: "bolder",
        size: "large",
        color: "Accent",
      },
      {
        type: "FactSet",
        facts: [
          {
            name: "From:",
            value: `${payload.callerName} (${payload.callerPhone})`,
          },
          {
            name: "Priority:",
            value: analysis.priority.toUpperCase(),
          },
          {
            name: "Sentiment:",
            value: `${analysis.sentiment} (${(analysis.sentimentScore * 100).toFixed(0)}%)`,
          },
          {
            name: "Duration:",
            value: `${payload.duration || "Unknown"}s`,
          },
        ],
      },
      {
        type: "TextBlock",
        text: "Transcription:",
        weight: "bolder",
        size: "medium",
      },
      {
        type: "TextBlock",
        text: payload.transcription.substring(0, 300) + "...",
        wrap: true,
        size: "small",
      },
      {
        type: "TextBlock",
        text: `Keywords: ${analysis.keywords.join(", ") || "None"}`,
        size: "small",
        color: "Accent",
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Ticket",
        url: ticketUrl,
        style: "positive",
      },
    ],
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  };

  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[Voicemail] No Teams webhook URL configured");
    return;
  }

  // Teams Incoming Webhook requires wrapping adaptive card in message attachment format
  const teamsPayload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: card,
      },
    ],
  };

  await sendToTeamsWithRetry(webhookUrl, teamsPayload, `voicemail-processor: ticket #${ticketId}`);
}

/**
 * Send email alert to support team
 */
async function sendEmailAlert(
  ticketId: number,
  payload: VoicemailWebhookPayload,
  analysis: Awaited<ReturnType<typeof analyzeVoicemail>>
): Promise<void> {
  const ticketUrl = `${process.env.VITE_APP_URL || "https://gigitekai.com"}/admin/helpdesk/${ticketId}`;

  const emailBody = `
New Voicemail Ticket #${ticketId}

From: ${payload.callerName} (${payload.callerPhone})
Priority: ${analysis.priority.toUpperCase()}
Sentiment: ${analysis.sentiment} (${(analysis.sentimentScore * 100).toFixed(0)}%)
Duration: ${payload.duration || "Unknown"}s
Timestamp: ${payload.timestamp}

Transcription:
${payload.transcription}

Keywords: ${analysis.keywords.join(", ") || "None"}
Suggested Action: ${analysis.suggestedAction}

View Ticket: ${ticketUrl}
Recording: ${payload.recordingUrl || "Not available"}
`;

  try {
    await sendEmail({
      to: "support@gigitekai.com",
      subject: `[${analysis.priority.toUpperCase()}] New Voicemail Ticket #${ticketId} from ${payload.callerName}`,
      body: emailBody,
      html: `
        <h2>New Voicemail Ticket #${ticketId}</h2>
        <p><strong>From:</strong> ${payload.callerName} (${payload.callerPhone})</p>
        <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(analysis.priority)}">${analysis.priority.toUpperCase()}</span></p>
        <p><strong>Sentiment:</strong> ${analysis.sentiment} (${(analysis.sentimentScore * 100).toFixed(0)}%)</p>
        <p><strong>Duration:</strong> ${payload.duration || "Unknown"}s</p>
        <p><strong>Timestamp:</strong> ${payload.timestamp}</p>
        
        <h3>Transcription</h3>
        <p>${payload.transcription.replace(/\n/g, "<br>")}</p>
        
        <p><strong>Keywords:</strong> ${analysis.keywords.join(", ") || "None"}</p>
        <p><strong>Suggested Action:</strong> ${analysis.suggestedAction}</p>
        
        <p><a href="${ticketUrl}" style="background-color: #00D4FF; color: #0A0E1A; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Ticket</a></p>
        
        ${payload.recordingUrl ? `<p><a href="${payload.recordingUrl}">Listen to Recording</a></p>` : ""}
      `,
    });
  } catch (error) {
    console.error("[Voicemail Email Error]", error);
  }
}

/**
 * Get color for priority level
 */
function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: "#FF0000",
    high: "#FF9900",
    medium: "#00D4FF",
    low: "#00AA00",
  };
  return colors[priority] || "#00D4FF";
}
