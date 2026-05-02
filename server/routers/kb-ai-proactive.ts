/**
 * AI Bot Proactive KB Suggestions
 * Automatically suggests relevant KB articles based on user queries
 */

import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { kbArticles } from '../../drizzle/schema';
import { invokeLLM } from '../_core/llm';
import { eq } from 'drizzle-orm';

/**
 * Proactive KB suggestion keywords and patterns
 */
const KB_SUGGESTION_KEYWORDS: Record<string, string[]> = {
  'Cannot Access Exchange Online / Outlook': [
    'cannot access outlook',
    'outlook not working',
    'cannot connect to exchange',
    'outlook login failed',
    'outlook authentication',
  ],
  'Cannot Send or Receive Emails in Outlook': [
    'cannot send email',
    'cannot receive email',
    'email stuck',
    'email not syncing',
    'outlook sync issue',
  ],
  'Calendar Not Syncing in Outlook': [
    'calendar not syncing',
    'calendar missing',
    'calendar events not showing',
    'outlook calendar issue',
  ],
  'Cannot Access Microsoft Teams': [
    'cannot access teams',
    'teams not working',
    'teams login failed',
    'cannot join teams meeting',
  ],
  'No Audio or Video in Teams Meetings': [
    'no audio in teams',
    'no video in teams',
    'teams audio not working',
    'teams camera not working',
    'teams microphone issue',
  ],
  'Access Denied to SharePoint Site': [
    'access denied sharepoint',
    'cannot access sharepoint',
    'sharepoint permission denied',
  ],
  'SharePoint Files Not Syncing to Computer': [
    'sharepoint sync not working',
    'sharepoint files not syncing',
    'sharepoint sync issue',
  ],
  'OneDrive Sync Stuck or Not Syncing': [
    'onedrive not syncing',
    'onedrive sync stuck',
    'onedrive sync issue',
  ],
  'Reset Your Password in Entra ID': [
    'reset password',
    'forgot password',
    'password reset',
    'change password',
  ],
  'Setup Multi-Factor Authentication (MFA)': [
    'setup mfa',
    'enable mfa',
    'two factor authentication',
    'mfa setup',
    'authenticator app',
  ],
  'Microsoft 365 Services Running Slow': [
    'microsoft 365 slow',
    'office slow',
    'performance issue',
    'slow performance',
  ],
  'License Not Assigned or License Error': [
    'license error',
    'license not assigned',
    'license issue',
    'subscription error',
  ],
  'Cloud Security Best Practices: Zero Trust Architecture': [
    'zero trust',
    'security architecture',
    'access control',
    'identity verification',
  ],
  'Data Protection and Encryption Standards': [
    'encryption',
    'data protection',
    'aes-256',
    'tls',
    'secure data',
  ],
  'Ransomware Prevention and Response Strategy': [
    'ransomware',
    'malware',
    'virus',
    'security threat',
    'backup recovery',
  ],
  'AI-Driven IT Operations: Intelligent Automation for MSPs': [
    'ai automation',
    'intelligent automation',
    'ai operations',
    'automation for msp',
  ],
};

/**
 * tRPC router for proactive KB suggestions
 */
export const kbAiProactiveRouter = router({
  /**
   * Get proactive KB suggestions based on user query
   * Analyzes user input and suggests relevant KB articles
   */
  getSuggestions: protectedProcedure
    .input(
      z.object({
        userQuery: z.string(),
        limit: z.number().optional().default(3),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const queryLower = input.userQuery.toLowerCase();
      const suggestions: Array<{ articleTitle: string; relevance: number; articleId?: number }> = [];

      // Match against keyword patterns
      for (const [articleTitle, keywords] of Object.entries(KB_SUGGESTION_KEYWORDS)) {
        for (const keyword of keywords) {
          if (queryLower.includes(keyword)) {
            suggestions.push({
              articleTitle,
              relevance: keyword.length, // Longer matches are more specific
            });
            break; // Only count once per article
          }
        }
      }

      // Sort by relevance (longest keyword match first)
      suggestions.sort((a, b) => b.relevance - a.relevance);

      // Get article IDs from database
      const uniqueTitles = Array.from(new Set(suggestions.map(s => s.articleTitle))).slice(0, input.limit);
      const articles = await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.isPublished, true));

      return uniqueTitles
        .map(title => {
          const article = articles.find(a => a.title === title);
          return {
            articleTitle: title,
            articleId: article?.id,
            relevance: 'high',
          };
        })
        .filter(s => s.articleId);
    }),

  /**
   * Generate AI-powered suggestion message
   * Creates a natural language suggestion to present to the user
   */
  generateSuggestionMessage: protectedProcedure
    .input(
      z.object({
        userQuery: z.string(),
        suggestedArticles: z.array(z.object({ articleTitle: z.string(), articleId: z.number() })),
      })
    )
    .query(async ({ input }) => {
      if (input.suggestedArticles.length === 0) {
        return null;
      }

      try {
        const articleList = input.suggestedArticles
          .map((a, i) => `${i + 1}. ${a.articleTitle}`)
          .join('\n');

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are a helpful IT support assistant. Generate a brief, friendly suggestion message (1-2 sentences) recommending KB articles that might help solve the user's issue. Be concise and encouraging.`,
            },
            {
              role: 'user',
              content: `User's issue: "${input.userQuery}"\n\nSuggested KB articles:\n${articleList}\n\nGenerate a brief suggestion message.`,
            },
          ],
        });

        return response.choices[0]?.message?.content || null;
      } catch (error) {
        console.error('Error generating suggestion message:', error);
        return null;
      }
    }),

  /**
   * Log KB suggestion interaction
   * Tracks whether users found suggestions helpful
   */
  logSuggestionInteraction: protectedProcedure
    .input(
      z.object({
        userQuery: z.string(),
        suggestedArticleIds: z.array(z.number()),
        clicked: z.boolean(),
        helpful: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In production, store this in a suggestions_log table
      return {
        success: true,
        message: 'Suggestion interaction logged',
        data: {
          query: input.userQuery,
          articleCount: input.suggestedArticleIds.length,
          clicked: input.clicked,
          helpful: input.helpful,
          timestamp: new Date().toISOString(),
        },
      };
    }),

  /**
   * Get proactive suggestion context for AI Bot
   * Returns system prompt guidance for the AI Bot to proactively suggest KB articles
   */
  getAiBotContext: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const articles = await db.select().from(kbArticles).where(eq(kbArticles.isPublished, true));

    const context = {
      systemPrompt: `You are GigitekAI's intelligent support assistant. Your role includes proactively suggesting relevant KB articles when users describe issues.

## KB Article Suggestion Guidelines

When a user describes an issue or asks a question:
1. Analyze their description for keywords related to KB articles
2. If you identify relevant KB articles, suggest them BEFORE providing your own solution
3. Use phrases like: "I found a KB article that might help..." or "Before we troubleshoot, let me suggest..."
4. Provide the article title and a brief explanation of why it's relevant
5. Offer to help further if the KB article doesn't fully resolve their issue

## Available KB Articles by Category

### Microsoft 365 Support
- Cannot Access Exchange Online / Outlook
- Cannot Send or Receive Emails in Outlook
- Calendar Not Syncing in Outlook
- Cannot Access Microsoft Teams
- No Audio or Video in Teams Meetings
- Access Denied to SharePoint Site
- SharePoint Files Not Syncing to Computer
- OneDrive Sync Stuck or Not Syncing
- Reset Your Password in Entra ID
- Setup Multi-Factor Authentication (MFA)
- Microsoft 365 Services Running Slow
- License Not Assigned or License Error

### Cloud & Security
- Cloud Security Best Practices: Zero Trust Architecture
- Azure Architecture Patterns for Scalable Applications
- Data Protection and Encryption Standards
- Ransomware Prevention and Response Strategy

### AI & Operations
- AI-Driven IT Operations: Intelligent Automation for MSPs
- Intelligent Chatbots and Knowledge Management
- MSP Service Delivery Best Practices
- Building a Scalable MSP Infrastructure

### Procedures & Guides
- QuickAssist: Remote Assistance and Screen Sharing Guide
- Creating and Managing Support Tickets: Complete Guide

## Suggestion Format

When suggesting articles, use this format:
"I found a KB article that might help: **[Article Title]**. This article covers [brief description]. Would you like me to summarize it, or shall we continue troubleshooting?"

## Tracking Suggestions

Track when users:
- Click on suggested articles
- Find suggestions helpful
- Provide feedback on suggestions

Use this data to improve future suggestions.`,

      keywordMap: KB_SUGGESTION_KEYWORDS,
      totalArticles: articles.length,
      categories: Array.from(new Set(articles.map(a => a.category))),
    };

    return context;
  }),

  /**
   * Get suggestion effectiveness metrics
   * Shows how often users find proactive suggestions helpful
   */
  getMetrics: protectedProcedure.query(async () => {
    // In production, query from suggestions_log table
    return {
      totalSuggestions: 0,
      clickedSuggestions: 0,
      helpfulSuggestions: 0,
      clickThroughRate: 0,
      helpfulRate: 0,
      topSuggestedArticles: [],
      message: 'Metrics will be populated as suggestions are tracked',
    };
  }),
});
