import { getDb } from "./db";
import { kbArticles, callLogs } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import axios from "axios";

// Note: callLogs table stores transcription data with graphCallId, transcriptText, aiSummary, and hasTranscript fields

export interface CallTranscriptionRequest {
  callId: string;
  recordingUrl: string;
  participantNames?: string[];
  callDuration?: number;
}

export interface TranscriptionResult {
  callId: string;
  transcript: string;
  keyTopics: string[];
  actionItems: string[];
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
  suggestedKBArticles?: string[];
}

/**
 * Transcribe call recording using Azure Speech-to-Text
 */
async function transcribeCallRecording(recordingUrl: string): Promise<string> {
  try {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION || "eastus";

    if (!speechKey) {
      throw new Error("AZURE_SPEECH_KEY not configured");
    }

    // Download recording
    const response = await axios.get(recordingUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(response.data);

    // Call Azure Speech-to-Text API
    const speechUrl = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;

    const transcriptionResponse = await axios.post(speechUrl, audioBuffer, {
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey,
        "Content-Type": "audio/wav",
      },
      params: {
        language: "en-US",
      },
    });

    return transcriptionResponse.data.DisplayText || "";
  } catch (error) {
    console.error("[Call Transcription] Error transcribing call:", error);
    throw error;
  }
}

/**
 * Analyze transcript with LLM to extract topics, action items, and sentiment
 */
async function analyzeTranscript(transcript: string): Promise<{
  keyTopics: string[];
  actionItems: string[];
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert call analyzer. Analyze the following call transcript and extract:
1. Key topics discussed (list of 3-5 topics)
2. Action items (list of tasks mentioned)
3. Overall sentiment (positive, negative, or neutral)
4. Brief summary (2-3 sentences)

Return as JSON with keys: keyTopics (array), actionItems (array), sentiment (string), summary (string)`,
        },
        {
          role: "user",
          content: `Analyze this call transcript:\n\n${transcript}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "call_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              keyTopics: {
                type: "array",
                items: { type: "string" },
                description: "Key topics discussed in the call",
              },
              actionItems: {
                type: "array",
                items: { type: "string" },
                description: "Action items from the call",
              },
              sentiment: {
                type: "string",
                enum: ["positive", "negative", "neutral"],
                description: "Overall sentiment of the call",
              },
              summary: {
                type: "string",
                description: "Brief summary of the call",
              },
            },
            required: ["keyTopics", "actionItems", "sentiment", "summary"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error("[Call Analysis] Error analyzing transcript:", error);
    throw error;
  }
}

/**
 * Generate KB article from call transcript
 */
async function generateKBArticleFromCall(
  transcript: string,
  analysis: any
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert technical writer. Create a comprehensive KB article based on the call transcript.
The article should:
1. Have a clear title
2. Include problem statement
3. Provide step-by-step solution
4. Include relevant code snippets or commands if applicable
5. Add troubleshooting tips
6. Include related links

Format as markdown.`,
        },
        {
          role: "user",
          content: `Create a KB article from this call:
Topics: ${analysis.keyTopics.join(", ")}
Summary: ${analysis.summary}
Transcript: ${transcript.substring(0, 2000)}...`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === "string" ? content : JSON.stringify(content);
  } catch (error) {
    console.error("[KB Generation] Error generating KB article:", error);
    throw error;
  }
}

/**
 * Process call recording and generate KB article
 */
export async function processCallRecording(
  request: CallTranscriptionRequest
): Promise<TranscriptionResult> {
  try {
    console.log(`[Call Transcription] Processing call ${request.callId}`);

    // Step 1: Transcribe the call
    const transcript = await transcribeCallRecording(request.recordingUrl);
    console.log(`[Call Transcription] Transcribed ${transcript.length} characters`);

    // Step 2: Analyze transcript
    const analysis = await analyzeTranscript(transcript);
    console.log(`[Call Analysis] Extracted ${analysis.keyTopics.length} topics`);

    // Step 3: Generate KB article
    const kbContent = await generateKBArticleFromCall(transcript, analysis);

    // Step 4: Save to database
    const db = await getDb();
    if (db) {
      // Save transcription
      await db.insert(callLogs).values({
        graphCallId: request.callId,
        transcriptText: transcript,
        aiSummary: analysis.summary,
        hasTranscript: true,
        status: "analyzed",
        createdAt: new Date(),
      });

      // Create KB article if content is substantial
      if (kbContent.length > 200) {
        const title = `[Auto-Generated] ${analysis.keyTopics[0] || "Call Summary"}`;
        await db.insert(kbArticles).values({
          title,
          content: kbContent,
          category: "auto-generated",
          tags: JSON.stringify(analysis.keyTopics),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return {
      callId: request.callId,
      transcript,
      keyTopics: analysis.keyTopics,
      actionItems: analysis.actionItems,
      sentiment: analysis.sentiment,
      summary: analysis.summary,
      suggestedKBArticles: analysis.keyTopics,
    };
  } catch (error) {
    console.error(`[Call Transcription] Error processing call ${request.callId}:`, error);
    throw error;
  }
}

/**
 * Batch process multiple call recordings
 */
export async function batchProcessCallRecordings(
  requests: CallTranscriptionRequest[]
): Promise<TranscriptionResult[]> {
  const results: TranscriptionResult[] = [];

  for (const request of requests) {
    try {
      const result = await processCallRecording(request);
      results.push(result);
    } catch (error) {
      console.error(`[Batch Processing] Failed to process call ${request.callId}:`, error);
      results.push({
        callId: request.callId,
        transcript: "",
        keyTopics: [],
        actionItems: [],
        sentiment: "neutral",
        summary: "Failed to process",
      });
    }
  }

  return results;
}
