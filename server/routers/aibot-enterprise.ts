// Enterprise features for AIBot: Sentiment Analysis, Intent Routing, Summarization, Ratings, Teams Integration
// This module extends the base aibot router with advanced capabilities

import { invokeLLM } from "../_core/llm";
import { 
  saveChatAnalytic,
  saveResponseRating,
  saveConversationSummary,
  saveTeamsIntegration,
  getChatMessages
} from "../db";

/**
 * Analyze sentiment and intent of user message
 * Returns: { sentiment, sentimentScore, intent, intentConfidence, routedTo }
 */
export async function analyzeSentimentAndIntent(message: string) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Analyze the sentiment and intent of this customer message.
          
Sentiment options: positive, neutral, negative, angry
Intent options: sales, support, billing, general, complaint

Respond with JSON only (no markdown):
{"sentiment": "...", "sentimentScore": 0.0-1.0, "intent": "...", "intentConfidence": 0.0-1.0}

Routing:
- sales intent → sales@gigitekai.com
- billing intent → billing@gigitekai.com  
- support/complaint intent → support@gigitekai.com
- general intent → support@gigitekai.com`
        },
        { role: "user", content: message }
      ]
    });

    const responseContent = response.choices[0]?.message?.content;
    const responseText = typeof responseContent === 'string' ? responseContent : '';
    if (!responseText) throw new Error("No response from LLM");

    // Strip markdown code fences that LLMs sometimes wrap JSON in (e.g. ```json ... ```)
    const cleanedText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const analysis = JSON.parse(cleanedText);
    
    // Determine routing email based on intent
    let routedTo = "support@gigitekai.com";
    if (analysis.intent === "sales") routedTo = "sales@gigitekai.com";
    else if (analysis.intent === "billing") routedTo = "billing@gigitekai.com";
    else if (analysis.intent === "support" || analysis.intent === "complaint") routedTo = "support@gigitekai.com";

    return {
      sentiment: analysis.sentiment || "neutral",
      sentimentScore: String(analysis.sentimentScore || 0.5),
      intent: analysis.intent || "general",
      intentConfidence: String(analysis.intentConfidence || 0.5),
      routedTo
    };
  } catch (error) {
    console.warn("[AIBot] Sentiment analysis failed:", error);
    return {
      sentiment: "neutral",
      sentimentScore: "0.5",
      intent: "general",
      intentConfidence: "0.5",
      routedTo: "support@gigitekai.com"
    };
  }
}

/**
 * Generate conversation summary for support team
 * Called every 5 messages to keep summaries fresh
 */
export async function generateConversationSummary(sessionId: string, recentMessages: any[]) {
  try {
    const conversationText = recentMessages
      .map(m => `${m.role === 'user' ? 'Customer' : 'Bot'}: ${m.message}`)
      .join('\n');

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a support team assistant. Summarize this customer conversation concisely.
          
Respond with JSON only (no markdown):
{"summary": "2-3 sentence summary", "keyPoints": ["point1", "point2"], "suggestedActions": ["action1", "action2"]}`
        },
        { role: "user", content: `Summarize this conversation:\n\n${conversationText}` }
      ]
    });

    const responseContent = response.choices[0]?.message?.content;
    const responseText = typeof responseContent === 'string' ? responseContent : '';
    if (!responseText) throw new Error("No response from LLM");

    // Strip markdown code fences that LLMs sometimes wrap JSON in (e.g. ```json ... ```)
    const cleanedText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const summary = JSON.parse(cleanedText);
    return {
      summary: summary.summary || "",
      keyPoints: JSON.stringify(summary.keyPoints || []),
      suggestedActions: JSON.stringify(summary.suggestedActions || [])
    };
  } catch (error) {
    console.warn("[AIBot] Summary generation failed:", error);
    return {
      summary: "Conversation in progress",
      keyPoints: JSON.stringify([]),
      suggestedActions: JSON.stringify([])
    };
  }
}

/**
 * Check if customer should be escalated based on sentiment
 */
export function shouldAutoEscalate(sentiment: string, sentimentScore: string): boolean {
  return sentiment === "angry" && parseFloat(sentimentScore) > 0.7;
}

/**
 * Format sentiment for display
 */
export function getSentimentEmoji(sentiment: string): string {
  const emojis: Record<string, string> = {
    positive: "😊",
    neutral: "😐",
    negative: "😞",
    angry: "😠"
  };
  return emojis[sentiment] || "😐";
}

/**
 * Format intent for display
 */
export function getIntentLabel(intent: string): string {
  const labels: Record<string, string> = {
    sales: "Sales Inquiry",
    support: "Support Request",
    billing: "Billing Question",
    general: "General Question",
    complaint: "Complaint"
  };
  return labels[intent] || "General";
}
