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
 * DISABLED: Test endpoint was being called repeatedly by external scheduler
 * causing duplicate Teams notifications every 2 minutes
 */
voicemailRouter.post("/test", async (req: Request, res: Response) => {
  res.status(410).json({ error: "Test endpoint disabled" });
});

export default voicemailRouter;
