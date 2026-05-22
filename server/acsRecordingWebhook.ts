/**
 * ACS Recording Webhook Handler
 *
 * Registers two Express routes:
 *   POST /api/acs/recording-webhook   — Azure Event Grid subscription validation + RecordingFileStatusUpdated events
 *   POST /api/acs/recording-callback  — ACS recording state callbacks (RecordingStateChanged)
 *
 * When a recording completes:
 *   1. Downloads the WAV file from ACS
 *   2. Uploads it to S3
 *   3. Transcribes via Whisper AI
 *   4. Updates callLogs with transcript + transcriptionStatus=done
 *   5. Appends transcript to linked callDraftTickets description
 */

import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { callLogs, callDraftTickets } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { downloadAcsRecording, uploadRecordingToStorage } from "./acsRecordingService";
import { transcribeAudio } from "./_core/voiceTranscription";

// ─── Register Routes ──────────────────────────────────────────────────────────
export function registerAcsRecordingWebhook(app: Express): void {
  /**
   * Azure Event Grid webhook for RecordingFileStatusUpdated events.
   * Azure sends a validation request first (SubscriptionValidationEvent),
   * then fires real events when recordings are ready.
   */
  app.post("/api/acs/recording-webhook", async (req: Request, res: Response) => {
    try {
      const events = Array.isArray(req.body) ? req.body : [req.body];

      for (const event of events) {
        const eventType = event.eventType || event.type;

        // ── Event Grid subscription validation ──────────────────────────────
        if (eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
          const validationCode = event.data?.validationCode;
          console.log("[ACS Webhook] Event Grid subscription validation request received");
          return res.json({ validationResponse: validationCode });
        }

        // ── Recording file ready ─────────────────────────────────────────────
        if (eventType === "Microsoft.Communication.RecordingFileStatusUpdated") {
          const recordingStorageInfo = event.data?.recordingStorageInfo;
          const chunks = recordingStorageInfo?.recordingChunks;

          if (!chunks || chunks.length === 0) {
            console.warn("[ACS Webhook] No recording chunks in event");
            continue;
          }

          // Process each chunk (usually just one for a single call)
          for (const chunk of chunks) {
            const contentLocation: string = chunk.contentLocation;
            const metadataLocation: string = chunk.metadataLocation;

            console.log(`[ACS Webhook] Recording ready: ${contentLocation}`);

            // Find the call log by matching the recording ID from metadata
            // We store the ACS recordingId in callLogs when we start recording
            const recordingId: string = chunk.documentId || "";
            await processCompletedRecording(contentLocation, recordingId);
          }
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[ACS Webhook] Error processing event:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * ACS recording state callback (fires during recording lifecycle).
   * Used to detect when a recording has started/stopped.
   */
  app.post("/api/acs/recording-callback", async (req: Request, res: Response) => {
    try {
      const events = Array.isArray(req.body) ? req.body : [req.body];

      for (const event of events) {
        const kind = event.type || event.eventType;
        console.log(`[ACS Recording Callback] Event: ${kind}`);

        if (kind === "Microsoft.Communication.CallRecordingStateChanged") {
          const state = event.data?.state;
          const recordingId = event.data?.recordingId;
          console.log(`[ACS Recording Callback] Recording ${recordingId} state: ${state}`);
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[ACS Recording Callback] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  console.log("[ACS Recording] Webhook routes registered at /api/acs/recording-webhook and /api/acs/recording-callback");
}

// ─── Process Completed Recording ─────────────────────────────────────────────
/**
 * Download, upload to S3, transcribe, and update the call log.
 */
async function processCompletedRecording(
  contentLocation: string,
  recordingId: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[ACS Recording] Database unavailable, cannot process recording");
    return;
  }

  // Find the call log by ACS recording ID
  const callLogResults = await db
    .select()
    .from(callLogs)
    .where(eq((callLogs as any).acsRecordingId, recordingId))
    .limit(1);

  const callLog = callLogResults[0];
  if (!callLog) {
    console.warn(`[ACS Recording] No call log found for recordingId=${recordingId}. Trying by transcriptionStatus=transcribing...`);
    // Fallback: find the most recent call log that is still transcribing
    const pendingResults = await db
      .select()
      .from(callLogs)
      .where(eq((callLogs as any).transcriptionStatus, "transcribing"))
      .limit(1);

    if (!pendingResults[0]) {
      console.error("[ACS Recording] No pending call log found, skipping");
      return;
    }
  }

  const targetLog = callLog || (await db.select().from(callLogs).where(eq((callLogs as any).transcriptionStatus, "transcribing")).limit(1))[0];
  if (!targetLog) return;

  const callLogId = targetLog.id;

  try {
    // Step 1: Download recording from ACS
    console.log(`[ACS Recording] Downloading recording for callLog ${callLogId}...`);
    const localFile = await downloadAcsRecording(contentLocation);
    if (!localFile) throw new Error("Failed to download recording from ACS");

    // Step 2: Upload to S3 for permanent storage
    const recordingUrl = await uploadRecordingToStorage(localFile, callLogId);

    // Step 3: Transcribe via Whisper
    console.log(`[ACS Recording] Transcribing recording for callLog ${callLogId}...`);
    const transcriptionResult = await transcribeAudio({
      audioUrl: recordingUrl || contentLocation,
      language: "en",
      prompt: "IT helpdesk call. May include terms like Microsoft 365, Azure AD, Teams, MSAL, SharePoint, OneDrive, Intune.",
    });

    let transcript: string | null = null;
    if ("text" in transcriptionResult && transcriptionResult.text) {
      transcript = transcriptionResult.text;
    }

    if (!transcript) {
      throw new Error("Whisper returned empty transcript");
    }

    // Step 4: Update call log
    await db
      .update(callLogs)
      .set({
        transcriptText: transcript,
        hasTranscript: true,
        transcriptionStatus: "done" as any,
        ...(recordingUrl ? { acsRecordingUrl: recordingUrl } as any : {}),
      })
      .where(eq(callLogs.id, callLogId));

    // Step 5: Append transcript to draft ticket description
    const draftResults = await db
      .select()
      .from(callDraftTickets)
      .where(eq(callDraftTickets.callLogId, callLogId))
      .limit(1);

    if (draftResults.length > 0) {
      const draft = draftResults[0];
      const updatedDesc =
        (draft.description || "") +
        `\n\n---\n**Call Transcript (auto-transcribed via ACS + Whisper AI):**\n${transcript}`;
      await db
        .update(callDraftTickets)
        .set({ description: updatedDesc })
        .where(eq(callDraftTickets.id, draft.id));
    }

    console.log(`[ACS Recording] ✅ Transcription complete for callLog ${callLogId} (${transcript.length} chars)`);
  } catch (err: any) {
    console.error(`[ACS Recording] ❌ Failed to process recording for callLog ${callLogId}:`, err.message);
    // Mark as failed
    await db
      .update(callLogs)
      .set({ transcriptionStatus: "failed" as any })
      .where(eq(callLogs.id, callLogId));
  }
}
