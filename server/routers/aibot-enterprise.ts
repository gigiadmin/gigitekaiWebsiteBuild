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
          content: `Analyze the sentiment and intent of this customer support message for a Microsoft 365 Managed Services Provider.

Sentiment options: positive, neutral, negative, angry

Intent options (pick the MOST specific match):
- password_reset: user cannot log in, forgot password, locked out, MFA issue, authenticator app reset
- email_not_working: email not received, Outlook not syncing, mailbox full, email delivery failure
- billing_invoice: invoice questions, payment issues, billing dispute, subscription cost
- plan_details: pricing questions, tier comparison, what's included, upgrade/downgrade plan
- m365_install: installing Office apps, Microsoft 365 installation, app setup on new device
- mfa_reset: MFA not working, lost authenticator, need to reset two-factor authentication
- sharepoint_access: SharePoint access denied, can't access site, permission issues, SharePoint files
- teams_crash: Teams not opening, Teams crashing, Teams performance issues, Teams meetings
- onedrive_sync: OneDrive not syncing, sync errors, files not uploading, storage full
- sales: new service inquiry, want to buy, schedule demo, partnership
- billing: general billing (use billing_invoice for specifics)
- complaint: unhappy with service, escalation request, formal complaint
- general: anything else not covered above

Respond with JSON only (no markdown):
{"sentiment": "...", "sentimentScore": 0.0-1.0, "intent": "...", "intentConfidence": 0.0-1.0}

Routing:
- sales intent → sales@gigitekai.com
- billing/billing_invoice intent → billing@gigitekai.com
- all other intents → support@gigitekai.com`
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
    else if (analysis.intent === "billing" || analysis.intent === "billing_invoice") routedTo = "billing@gigitekai.com";

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
