/**
 * Voicemail Processing Service
 * Analyzes Teams voicemails for sentiment and priority classification
 * Creates tickets automatically with appropriate priority levels
 */

import { invokeLLM, type Message } from "./_core/llm";

export type VoicemailPriority = "low" | "medium" | "high" | "critical";

export interface VoicemailAnalysis {
  transcription: string;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number; // -1 to 1
  priority: VoicemailPriority;
  keywords: string[];
  summary: string;
  suggestedAction: string;
}

/**
 * Keywords that indicate priority levels
 */
const PRIORITY_KEYWORDS = {
  critical: [
    "down",
    "outage",
    "emergency",
    "urgent",
    "critical",
    "broken",
    "crash",
    "not working",
    "immediate",
    "asap",
    "now",
    "disaster",
    "security",
    "breach",
    "hacked",
    "compromised",
  ],
  high: [
    "issue",
    "problem",
    "error",
    "fail",
    "stuck",
    "blocked",
    "unable",
    "can't",
    "won't",
    "doesn't work",
    "frustrated",
    "angry",
    "upset",
    "important",
    "urgent",
  ],
  medium: [
    "question",
    "help",
    "support",
    "need",
    "request",
    "slow",
    "delay",
    "concern",
    "worried",
  ],
  low: [
    "thanks",
    "appreciate",
    "info",
    "fyi",
    "follow up",
    "just checking",
  ],
};

/**
 * Analyze voicemail transcription for sentiment and priority
 */
export async function analyzeVoicemail(
  transcription: string
): Promise<VoicemailAnalysis> {
  if (!transcription || transcription.trim().length === 0) {
    return {
      transcription: "",
      sentiment: "neutral",
      sentimentScore: 0,
      priority: "low",
      keywords: [],
      summary: "Empty voicemail",
      suggestedAction: "Review manually",
    };
  }

  try {
    // Use LLM for sentiment analysis and priority classification
    const systemPrompt = `You are a voicemail analysis expert. Analyze the following voicemail transcription and provide:
1. Sentiment (positive, neutral, or negative)
2. Sentiment score (-1 to 1)
3. Priority level (low, medium, high, or critical) based on urgency, keywords, and tone
4. Key topics/keywords mentioned
5. Brief summary (1-2 sentences)
6. Suggested action

Return ONLY valid JSON with no markdown formatting:
{
  "sentiment": "positive|neutral|negative",
  "sentimentScore": number,
  "priority": "low|medium|high|critical",
  "keywords": ["keyword1", "keyword2"],
  "summary": "string",
  "suggestedAction": "string"
}`;

    const messages: Message[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Analyze this voicemail: "${transcription}"`,
      },
    ];

    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "voicemail_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentiment: {
                type: "string",
                enum: ["positive", "neutral", "negative"],
              },
              sentimentScore: {
                type: "number",
                minimum: -1,
                maximum: 1,
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
              },
              keywords: {
                type: "array",
                items: { type: "string" },
              },
              summary: { type: "string" },
              suggestedAction: { type: "string" },
            },
            required: [
              "sentiment",
              "sentimentScore",
              "priority",
              "keywords",
              "summary",
              "suggestedAction",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);

    // Validate and adjust priority based on keywords
    let finalPriority = parsed.priority as VoicemailPriority;

    // Check for critical keywords
    const lowerTranscription = transcription.toLowerCase();
    for (const keyword of PRIORITY_KEYWORDS.critical) {
      if (lowerTranscription.includes(keyword)) {
        finalPriority = "critical";
        break;
      }
    }

    // Check for high priority keywords if not already critical
    if (finalPriority !== "critical") {
      for (const keyword of PRIORITY_KEYWORDS.high) {
        if (lowerTranscription.includes(keyword)) {
          finalPriority = "high";
          break;
        }
      }
    }

    // Boost priority if sentiment is negative
    if (parsed.sentiment === "negative" && parsed.sentimentScore < -0.5) {
      if (finalPriority === "low") finalPriority = "medium";
      else if (finalPriority === "medium") finalPriority = "high";
    }

    return {
      transcription,
      sentiment: parsed.sentiment,
      sentimentScore: parsed.sentimentScore,
      priority: finalPriority,
      keywords: parsed.keywords || [],
      summary: parsed.summary || "No summary available",
      suggestedAction: parsed.suggestedAction || "Review and respond",
    };
  } catch (error) {
    console.error("[Voicemail Analysis Error]", error);

    // Fallback: keyword-based analysis
    return analyzeVoicemailFallback(transcription);
  }
}

/**
 * Fallback analysis using keyword matching
 */
function analyzeVoicemailFallback(transcription: string): VoicemailAnalysis {
  const lower = transcription.toLowerCase();

  // Determine priority
  let priority: VoicemailPriority = "low";

  for (const keyword of PRIORITY_KEYWORDS.critical) {
    if (lower.includes(keyword)) {
      priority = "critical";
      break;
    }
  }

  if (priority !== "critical") {
    for (const keyword of PRIORITY_KEYWORDS.high) {
      if (lower.includes(keyword)) {
        priority = "high";
        break;
      }
    }
  }

  if (priority === "low") {
    for (const keyword of PRIORITY_KEYWORDS.medium) {
      if (lower.includes(keyword)) {
        priority = "medium";
        break;
      }
    }
  }

  // Simple sentiment detection
  const negativeWords = [
    "angry",
    "frustrated",
    "upset",
    "problem",
    "issue",
    "error",
    "broken",
  ];
  const positiveWords = ["thanks", "appreciate", "great", "good", "excellent"];

  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let sentimentScore = 0;

  const negCount = negativeWords.filter((w) => lower.includes(w)).length;
  const posCount = positiveWords.filter((w) => lower.includes(w)).length;

  if (negCount > posCount) {
    sentiment = "negative";
    sentimentScore = -0.5;
  } else if (posCount > negCount) {
    sentiment = "positive";
    sentimentScore = 0.5;
  }

  // Extract keywords
  const keywords = [];
  const allKeywords = Object.values(PRIORITY_KEYWORDS).flat();
  for (const keyword of allKeywords) {
    if (lower.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  return {
    transcription,
    sentiment,
    sentimentScore,
    priority,
    keywords: Array.from(new Set(keywords)),
    summary: transcription.substring(0, 150) + "...",
    suggestedAction: `Review and respond - Priority: ${priority}`,
  };
}

/**
 * Extract caller name and phone from voicemail metadata
 */
export function extractCallerInfo(
  voicemailData: Record<string, any>
): { callerName: string; callerPhone: string } {
  const callerName =
    voicemailData.callerName ||
    voicemailData.from ||
    voicemailData.caller ||
    "Unknown Caller";
  const callerPhone =
    voicemailData.callerPhone ||
    voicemailData.phoneNumber ||
    voicemailData.phone ||
    "Unknown";

  return {
    callerName: String(callerName).trim(),
    callerPhone: String(callerPhone).trim(),
  };
}
