/**
 * Aria TTS Router — Azure AI Speech Service
 * Converts text to speech using en-US-JennyNeural (consistent female voice)
 * Returns MP3 audio stream — no browser voice dependency
 */
import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

const SPEECH_KEY = process.env.AZURE_SPEECH_KEY || "";
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "eastus";
const TTS_URL = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

// Aria's locked voice — never changes
const ARIA_VOICE = "en-US-JennyNeural";

/**
 * POST /api/aria/tts
 * Body: { text: string, rate?: string, pitch?: string }
 * Returns: audio/mpeg stream
 */
router.post("/tts", async (req: Request, res: Response) => {
  const { text, rate = "0%", pitch = "0%" } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "text is required" });
  }

  if (!SPEECH_KEY) {
    return res.status(503).json({ error: "Azure Speech Service not configured" });
  }

  // Sanitize text — strip markdown, limit length
  const clean = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] || c))
    .trim()
    .slice(0, 3000); // Azure TTS limit

  if (!clean) {
    return res.status(400).json({ error: "text is empty after sanitization" });
  }

  const ssml = `<speak version="1.0" xml:lang="en-US">
    <voice name="${ARIA_VOICE}">
      <prosody rate="${rate}" pitch="${pitch}">
        ${clean}
      </prosody>
    </voice>
  </speak>`;

  try {
    const response = await axios.post(TTS_URL, ssml, {
      headers: {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "GigitekAI-Aria/1.0",
      },
      responseType: "arraybuffer",
      timeout: 15000,
    });

    res.set({
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
      "X-Aria-Voice": ARIA_VOICE,
    });
    res.send(Buffer.from(response.data));
  } catch (err: any) {
    const status = err.response?.status || 500;
    const msg = err.response?.data
      ? Buffer.from(err.response.data).toString("utf8")
      : err.message;
    console.error("[Aria TTS] Azure Speech error:", status, msg);
    res.status(status).json({ error: "TTS generation failed", detail: msg });
  }
});

/**
 * GET /api/aria/tts/voices
 * Returns the locked Aria voice info
 */
router.get("/voices", (_req: Request, res: Response) => {
  res.json({
    voice: ARIA_VOICE,
    region: SPEECH_REGION,
    provider: "Azure AI Speech",
    stable: true,
  });
});

export default router;
