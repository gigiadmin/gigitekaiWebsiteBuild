/**
 * ACS Call Recording Service
 * Handles starting/stopping ACS server-side recording for PSTN calls
 * and downloading completed recordings for Whisper transcription.
 *
 * Flow:
 * 1. callPoller detects a new PSTN call → startRecording(serverCallId)
 * 2. ACS fires RecordingFileStatusUpdated event → webhook at /api/acs/recording-webhook
 * 3. Webhook downloads audio → transcribes via Whisper → updates callLogs
 */

import { CallAutomationClient } from "@azure/communication-call-automation";
import path from "path";
import os from "os";
import fs from "fs";

// ─── ACS Client ──────────────────────────────────────────────────────────────
let _acsClient: CallAutomationClient | null = null;

function getAcsClient(): CallAutomationClient {
  if (!_acsClient) {
    const connectionString = process.env.ACS_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("ACS_CONNECTION_STRING environment variable is not set");
    }
    _acsClient = new CallAutomationClient(connectionString);
  }
  return _acsClient;
}

// ─── Start Recording ─────────────────────────────────────────────────────────
/**
 * Start ACS server-side recording for a PSTN call.
 * @param serverCallId - The serverCallId from the Teams/ACS call
 * @param callbackBaseUrl - The public URL of this server (for recording status callbacks)
 * @returns recordingId if successful, null on error
 */
export async function startAcsRecording(
  serverCallId: string,
  callbackBaseUrl: string
): Promise<string | null> {
  try {
    const client = getAcsClient();
    const callRecording = client.getCallRecording();

    const callbackUri = `${callbackBaseUrl}/api/acs/recording-callback`;

    const response = await callRecording.start({
      callLocator: { id: serverCallId, kind: "serverCallLocator" },
      recordingContent: "audio",
      recordingChannel: "mixed",
      recordingFormat: "wav",
      recordingStateCallbackEndpointUrl: callbackUri,
    });

    const recordingId = response.recordingId;
    console.log(`[ACS Recording] Started recording ${recordingId} for call ${serverCallId}`);
    return recordingId;
  } catch (err: any) {
    console.error(`[ACS Recording] Failed to start recording for ${serverCallId}:`, err.message);
    return null;
  }
}

// ─── Stop Recording ──────────────────────────────────────────────────────────
export async function stopAcsRecording(recordingId: string): Promise<boolean> {
  try {
    const client = getAcsClient();
    await client.getCallRecording().stop(recordingId);
    console.log(`[ACS Recording] Stopped recording ${recordingId}`);
    return true;
  } catch (err: any) {
    console.error(`[ACS Recording] Failed to stop recording ${recordingId}:`, err.message);
    return false;
  }
}

// ─── Download Recording ───────────────────────────────────────────────────────
/**
 * Download a completed ACS recording to a temp file.
 * @param contentLocation - The contentLocation URL from the RecordingFileStatusUpdated event
 * @returns Local file path of the downloaded audio, or null on error
 */
export async function downloadAcsRecording(contentLocation: string): Promise<string | null> {
  try {
    const client = getAcsClient();
    const callRecording = client.getCallRecording();

    const tmpFile = path.join(os.tmpdir(), `acs-recording-${Date.now()}.wav`);
    await callRecording.downloadToPath(contentLocation, tmpFile);

    console.log(`[ACS Recording] Downloaded recording to ${tmpFile}`);
    return tmpFile;
  } catch (err: any) {
    console.error(`[ACS Recording] Failed to download recording:`, err.message);
    return null;
  }
}

// ─── Upload to S3 and get URL ─────────────────────────────────────────────────
/**
 * Upload a local audio file to S3 and return the public URL.
 */
export async function uploadRecordingToStorage(localFilePath: string, callLogId: number): Promise<string | null> {
  try {
    const { storagePut } = await import("./storage");
    const fileBuffer = fs.readFileSync(localFilePath);
    const key = `call-recordings/${callLogId}-${Date.now()}.wav`;
    const { url } = await storagePut(key, fileBuffer, "audio/wav");
    console.log(`[ACS Recording] Uploaded recording to S3: ${url}`);
    return url;
  } catch (err: any) {
    console.error(`[ACS Recording] Failed to upload recording to S3:`, err.message);
    return null;
  } finally {
    // Clean up temp file
    try {
      fs.unlinkSync(localFilePath);
    } catch {
      // ignore
    }
  }
}
