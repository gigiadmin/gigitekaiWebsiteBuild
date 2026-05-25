/**
 * Voicemail Webhook Route
 * Receives voicemail events from Teams and processes them
 */

import { Router, Request, Response } from "express";
import { processVoicemail, VoicemailWebhookPayload } from "./voicemailWebhook";

export const voicemailRouter = Router();

/**
 * POST /api/voicemail/webhook
 * Receives voicemail from Teams
 */
voicemailRouter.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload: VoicemailWebhookPayload = req.body;

    // Validate required fields
    if (!payload.transcription || !payload.callerPhone) {
      return res.status(400).json({
        error: "Missing required fields: transcription, callerPhone",
      });
    }

    console.log(`[Voicemail Webhook] Received from ${payload.callerPhone}`);

    // Process asynchronously
    processVoicemail(payload)
      .then((result) => {
        console.log(
          `[Voicemail] Processed: ticket #${result.ticketId}, success=${result.success}`
        );
      })
      .catch((error) => {
        console.error("[Voicemail] Processing error:", error);
      });

    // Return immediately
    res.json({
      success: true,
      message: "Voicemail received and queued for processing",
    });
  } catch (error) {
    console.error("[Voicemail Webhook Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/voicemail/test
 * Test endpoint for voicemail processing
 */
voicemailRouter.post("/test", async (req: Request, res: Response) => {
  try {
    const testPayload: VoicemailWebhookPayload = {
      callId: `test-${Date.now()}`,
      callerName: "Test Caller",
      callerPhone: "+1-555-0123",
      transcription:
        "Hi, this is Bill Gates calling. I have a critical issue with my email not sending. This is urgent and I need this fixed immediately. Please call me back as soon as possible.",
      recordingUrl: "https://example.com/recording.mp3",
      timestamp: new Date().toISOString(),
      duration: 45,
    };

    const result = await processVoicemail(testPayload);

    res.json({
      success: result.success,
      ticketId: result.ticketId,
      error: result.error,
    });
  } catch (error) {
    console.error("[Voicemail Test Error]", error);
    res.status(500).json({ error: "Test failed" });
  }
});

export default voicemailRouter;
