import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { kbArticles, tickets } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface CallTranscript {
  callId: string;
  participants: string[];
  duration: number; // in seconds
  transcriptText: string;
  recordingUrl?: string;
  recordedAt: Date;
}

export interface CallAnalysis {
  callId: string;
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  sentiment: "positive" | "negative" | "neutral";
  resolution: boolean;
  suggestedKBArticle?: string;
  ticketId?: number;
}

/**
 * Analyze a Teams call transcript using AI
 * Extracts key topics, action items, and suggests KB articles
 */
export async function analyzeCallTranscript(transcript: CallTranscript): Promise<CallAnalysis> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes customer support call transcripts. 
          Extract the following information:
          1. A brief summary (2-3 sentences)
          2. Key topics discussed (list of 3-5 topics)
          3. Action items (list of tasks to be completed)
          4. Overall sentiment (positive/negative/neutral)
          5. Whether the issue was resolved (true/false)
          
          Return a JSON object with keys: summary, keyTopics, actionItems, sentiment, resolution`,
        },
        {
          role: "user",
          content: `Analyze this support call transcript:\n\n${transcript.transcriptText}`,
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
              summary: { type: "string", description: "Brief summary of the call" },
              keyTopics: {
                type: "array",
                items: { type: "string" },
                description: "Key topics discussed",
              },
              actionItems: {
                type: "array",
                items: { type: "string" },
                description: "Action items from the call",
              },
              sentiment: {
                type: "string",
                enum: ["positive", "negative", "neutral"],
                description: "Overall sentiment",
              },
              resolution: {
                type: "boolean",
                description: "Whether the issue was resolved",
              },
            },
            required: ["summary", "keyTopics", "actionItems", "sentiment", "resolution"],
            additionalProperties: false,
          },
        },
      },
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText || typeof analysisText !== "string") {
      throw new Error("No response from LLM");
    }

    const analysis = JSON.parse(analysisText);

    // Find matching KB article based on key topics
    const db = await getDb();
    let suggestedKBArticle: string | undefined;

    if (db && analysis.keyTopics.length > 0) {
      const searchQuery = analysis.keyTopics.slice(0, 3).join(" ");
      const articles = await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.isPublished, 1))
        .limit(1);

      if (articles.length > 0) {
        suggestedKBArticle = articles[0].title;
      }
    }

    return {
      callId: transcript.callId,
      summary: analysis.summary,
      keyTopics: analysis.keyTopics,
      actionItems: analysis.actionItems,
      sentiment: analysis.sentiment,
      resolution: analysis.resolution,
      suggestedKBArticle,
    };
  } catch (error) {
    console.error("[CallAnalyzer] Failed to analyze transcript:", error);
    throw error;
  }
}

/**
 * Generate a KB article from call analysis
 * Only generates if issue was resolved and has clear action items
 */
export async function generateKBFromCallAnalysis(analysis: CallAnalysis): Promise<string | null> {
  try {
    if (!analysis.resolution || analysis.actionItems.length === 0) {
      return null;
    }

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert technical writer. Create a concise KB article based on the call analysis.
          The article should:
          1. Have a clear title
          2. Include a problem statement
          3. Provide step-by-step solution
          4. Include any relevant warnings or tips
          
          Format as markdown with proper headings.`,
        },
        {
          role: "user",
          content: `Create a KB article from this call analysis:
          Summary: ${analysis.summary}
          Key Topics: ${analysis.keyTopics.join(", ")}
          Action Items: ${analysis.actionItems.join(", ")}`,
        },
      ],
    });

    const articleContent = response.choices[0]?.message?.content;
    if (!articleContent || typeof articleContent !== "string") {
      return null;
    }

    // Extract title from markdown (first # heading)
    const titleMatch = articleContent.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : `Support Solution - ${new Date().toISOString().split("T")[0]}`;

    // Save to database
    const db = await getDb();
    if (db) {
      try {
        await db.insert(kbArticles).values({
          title,
          content: articleContent,
          category: "auto_generated",
          isPublished: 0, // Requires admin review
        });

        console.log(`[CallAnalyzer] Generated KB article: ${title}`);
        return title;
      } catch (dbError) {
        console.warn("[CallAnalyzer] Failed to save KB article:", dbError);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("[CallAnalyzer] Failed to generate KB article:", error);
    return null;
  }
}

/**
 * Process a batch of call transcripts
 */
export async function processBatchTranscripts(
  transcripts: CallTranscript[]
): Promise<CallAnalysis[]> {
  const results: CallAnalysis[] = [];

  for (const transcript of transcripts) {
    try {
      const analysis = await analyzeCallTranscript(transcript);
      results.push(analysis);

      // Try to generate KB article if applicable
      const kbArticle = await generateKBFromCallAnalysis(analysis);
      if (kbArticle) {
        analysis.suggestedKBArticle = kbArticle;
      }
    } catch (error) {
      console.error(`[CallAnalyzer] Failed to process transcript ${transcript.callId}:`, error);
    }
  }

  return results;
}
