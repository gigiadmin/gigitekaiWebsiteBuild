/**
 * Voice transcription helper (legacy Manus Forge Whisper replacement stub).
 *
 * The original implementation routed transcription requests through the Manus
 * platform's speech-to-text gateway. As part of the off-Manus migration,
 * transcription should be replaced with a direct provider integration such as:
 *   - OpenAI Whisper API
 *   - Azure OpenAI Whisper
 *   - Azure AI Speech (batch/continuous)
 *
 * For now, calling this function returns a TranscriptionError explaining that
 * the Manus transcription service is no longer available and a provider must
 * be wired directly.
 */

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type WhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};

export type WhisperResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
};

export type TranscriptionResponse = WhisperResponse;

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "UPLOAD_FAILED" | "SERVICE_ERROR";
  details?: string;
};

export async function transcribeAudio(
  _options: TranscribeOptions
): Promise<TranscriptionResponse | TranscriptionError> {
  return {
    error: "Voice transcription service is not configured",
    code: "SERVICE_ERROR",
    details:
      "Manus Forge speech-to-text gateway is no longer available. " +
      "Replace with a direct provider (OpenAI Whisper, Azure OpenAI Whisper, or Azure AI Speech).",
  };
}
