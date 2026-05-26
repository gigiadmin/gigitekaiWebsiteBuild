/**
 * Customer Sentiment Analysis Router
 * Tracks NPS/sentiment trends across all tickets and feedback
 * Identifies at-risk accounts early through sentiment degradation
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { customerFeedback, tickets } from "../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

interface SentimentScore {
  score: number; // -1 (very negative) to 1 (very positive)
  label: "very_negative" | "negative" | "neutral" | "positive" | "very_positive";
  confidence: number; // 0-100
}

interface AccountSentiment {
  ticketId: number;
  accountName?: string;
  overallSentiment: number; // -100 to 100
  sentimentTrend: "improving" | "stable" | "declining";
  npsScore: number; // 0-100
  feedbackCount: number;
  averageRating: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  topIssues: string[];
  lastFeedbackDate: string | null;
  recommendedAction: string;
}

/**
 * Analyze sentiment of text using LLM
 */
async function analyzeSentiment(text: string): Promise<SentimentScore> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with JSON only.",
        },
        {
          role: "user",
          content: `Analyze the sentiment of this text and respond with JSON:
          
Text: "${text}"

Respond with:
{
  "score": number between -1 and 1,
  "label": one of "very_negative", "negative", "neutral", "positive", "very_positive",
  "confidence": number between 0 and 100
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: {
                type: "number",
                minimum: -1,
                maximum: 1,
              },
              label: {
                type: "string",
                enum: ["very_negative", "negative", "neutral", "positive", "very_positive"],
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 100,
              },
            },
            required: ["score", "label", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      return {
        score: Math.max(-1, Math.min(1, parsed.score)),
        label: parsed.label,
        confidence: Math.max(0, Math.min(100, parsed.confidence)),
      };
    }
  } catch (error) {
    console.error("[Sentiment Analysis] Error:", error);
  }

  // Default neutral sentiment on error
  return {
    score: 0,
    label: "neutral",
    confidence: 0,
  };
}

/**
 * Get sentiment analysis for a ticket
 */
async function getTicketSentiment(ticketId: number): Promise<AccountSentiment> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get all feedback for ticket
  const feedbackRecords = await db
    .select()
    .from(customerFeedback)
    .where(eq(customerFeedback.ticketId, ticketId));

  // Calculate NPS score
  const npsScores = feedbackRecords
    .filter((f) => f.rating !== null)
    .map((f) => f.rating as number);

  let npsScore = 0;
  if (npsScores.length > 0) {
    const promoters = npsScores.filter((s) => s >= 9).length;
    const detractors = npsScores.filter((s) => s <= 6).length;
    npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);
  }

  // Analyze sentiment of feedback comments
  let totalSentimentScore = 0;
  let sentimentCount = 0;

  for (const feedback of feedbackRecords) {
    if (feedback.comment) {
      const sentiment = await analyzeSentiment(feedback.comment);
      totalSentimentScore += sentiment.score;
      sentimentCount++;
    }
  }

  const overallSentiment =
    sentimentCount > 0 ? Math.round((totalSentimentScore / sentimentCount) * 100) : 0;

  // Get average rating
  const averageRating =
    npsScores.length > 0 ? Math.round((npsScores.reduce((a, b) => a + b, 0) / npsScores.length) * 10) / 10 : 0;

  // Determine trend (compare last 7 days vs previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentFeedback = feedbackRecords.filter((f) => f.createdAt >= sevenDaysAgo.toISOString());
  const previousFeedback = feedbackRecords.filter(
    (f) => f.createdAt >= fourteenDaysAgo.toISOString() && f.createdAt < sevenDaysAgo.toISOString()
  );

  let recentSentiment = 0;
  let previousSentiment = 0;

  if (recentFeedback.length > 0) {
    recentSentiment = recentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / recentFeedback.length;
  }

  if (previousFeedback.length > 0) {
    previousSentiment = previousFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / previousFeedback.length;
  }

  let sentimentTrend: "improving" | "stable" | "declining" = "stable";
  if (recentSentiment > previousSentiment + 1) {
    sentimentTrend = "improving";
  } else if (recentSentiment < previousSentiment - 1) {
    sentimentTrend = "declining";
  }

  // Extract top issues from comments
  const topIssues: string[] = [];
  const issueKeywords = ["bug", "error", "slow", "crash", "broken", "issue", "problem", "not working"];
  for (const feedback of feedbackRecords) {
    if (feedback.comment) {
      for (const keyword of issueKeywords) {
        if (feedback.comment.toLowerCase().includes(keyword) && !topIssues.includes(keyword)) {
          topIssues.push(keyword);
          if (topIssues.length >= 3) break;
        }
      }
      if (topIssues.length >= 3) break;
    }
  }

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  if (npsScore < 0 && sentimentTrend === "declining") {
    riskLevel = "critical";
  } else if (npsScore < 30 || sentimentTrend === "declining") {
    riskLevel = "high";
  } else if (npsScore < 50) {
    riskLevel = "medium";
  }

  // Generate recommended action
  let recommendedAction = "";
  if (riskLevel === "critical") {
    recommendedAction = "🚨 URGENT: Schedule executive business review to address account health";
  } else if (riskLevel === "high") {
    recommendedAction = "⚠️ HIGH RISK: Assign dedicated account manager and increase support priority";
  } else if (riskLevel === "medium") {
    recommendedAction = "📌 MEDIUM RISK: Monitor closely and proactively reach out with solutions";
  } else {
    recommendedAction = "✅ LOW RISK: Maintain current support level";
  }

  return {
    ticketId,
    overallSentiment,
    sentimentTrend,
    npsScore,
    feedbackCount: feedbackRecords.length,
    averageRating,
    riskLevel,
    topIssues,
    lastFeedbackDate: feedbackRecords.length > 0 ? feedbackRecords[feedbackRecords.length - 1].createdAt : null,
    recommendedAction,
  };
}

export const sentimentAnalysisRouter = router({
  /**
   * Get sentiment analysis for a specific account
   */
  getAccountSentiment: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ input }) => {
      return await getTicketSentiment(parseInt(input.ticketId) || 0);
    }),

  /**
   * Get all tickets sorted by sentiment risk level
   */
  getAtRiskTickets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get unique ticket IDs from feedback
    const accounts = await db
      .selectDistinct({ ticketId: customerFeedback.ticketId })
      .from(customerFeedback);

    // Get sentiment for each account
    const sentiments = await Promise.all(
      accounts
        .filter((a) => a.ticketId)
        .map((a) => getTicketSentiment(a.ticketId!))
    );

    // Filter to only at-risk accounts
    return sentiments
      .filter((s) => s.riskLevel === "high" || s.riskLevel === "critical")
      .sort((a, b) => {
        // Sort by risk level first (critical > high)
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        }
        // Then by NPS score (lower first)
        return a.npsScore - b.npsScore;
      });
  }),

  /**
   * Get sentiment trends over time
   */
  getSentimentTrends: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get feedback from last 30 days
    const recentFeedback = await db
      .select()
      .from(customerFeedback)
      .where(gte(customerFeedback.createdAt, thirtyDaysAgo.toISOString()));

    // Group by week and calculate average sentiment
    const weeklyTrends = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const weekFeedback = recentFeedback.filter((f) => f.createdAt >= weekStart.toISOString() && f.createdAt < weekEnd.toISOString());

      const avgRating =
        weekFeedback.length > 0
          ? Math.round(
              (weekFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / weekFeedback.length) * 10
            ) / 10
          : 0;

      weeklyTrends.unshift({
        week: `Week of ${weekStart.toLocaleDateString()}`,
        averageRating: avgRating,
        feedbackCount: weekFeedback.length,
      });
    }

    return {
      weeklyTrends,
      overallAverageRating:
        recentFeedback.length > 0
          ? Math.round(
              (recentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / recentFeedback.length) * 10
            ) / 10
          : 0,
      totalFeedback: recentFeedback.length,
    };
  }),
});
