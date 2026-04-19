/**
 * AI-Powered Ticket Categorization
 * Automatically categorizes, tags, and prioritizes incoming tickets
 * using LLM analysis
 */

import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { invokeLLM } from '../_core/llm';
// Database helpers imported from db.ts

// Ticket categories
export const TICKET_CATEGORIES = {
  EXCHANGE: 'Exchange Online',
  TEAMS: 'Microsoft Teams',
  SHAREPOINT: 'SharePoint Online',
  ONEDRIVE: 'OneDrive',
  ENTRA: 'Entra ID / Azure AD',
  DEFENDER: 'Microsoft Defender',
  INTUNE: 'Intune / Device Management',
  COPILOT: 'Copilot / AI Services',
  GENERAL: 'General IT Support',
  BILLING: 'Billing & Licensing',
  ACCOUNT: 'Account Management',
  OTHER: 'Other',
} as const;

// Priority levels
export const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// Urgency indicators
export const URGENCY_KEYWORDS = {
  CRITICAL: ['down', 'outage', 'critical', 'emergency', 'urgent', 'broken', 'cannot access', 'all users'],
  HIGH: ['not working', 'error', 'issue', 'problem', 'failing', 'slow', 'degraded'],
  MEDIUM: ['question', 'help', 'assistance', 'setup', 'configure'],
  LOW: ['info', 'documentation', 'how to', 'best practice'],
};

interface TicketAnalysis {
  category: string;
  priority: string;
  urgency: string;
  affectedUsers: number;
  businessImpact: string;
  suggestedTags: string[];
  autoResolvable: boolean;
  suggestedResolution?: string;
  escalationRequired: boolean;
  estimatedResolutionTime: string;
}

/**
 * Analyze ticket and generate categorization
 */
export async function analyzeTicket(
  title: string,
  description: string,
  clientName?: string
): Promise<TicketAnalysis> {
  console.log(`[AI Ticket Analysis] Analyzing: "${title}"`);

  try {
    const prompt = `You are an expert IT support ticket analyzer for a Microsoft 365 MSP.

Analyze this support ticket and provide structured categorization:

TICKET TITLE: ${title}
TICKET DESCRIPTION: ${description}
CLIENT: ${clientName || 'Unknown'}

Provide analysis in JSON format with these fields:
{
  "category": "One of: Exchange Online, Microsoft Teams, SharePoint Online, OneDrive, Entra ID / Azure AD, Microsoft Defender, Intune / Device Management, Copilot / AI Services, General IT Support, Billing & Licensing, Account Management, Other",
  "priority": "critical | high | medium | low",
  "urgency": "immediate | high | normal | low",
  "affectedUsers": "number of affected users (estimate if not specified)",
  "businessImpact": "brief description of business impact",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "autoResolvable": "true if this ticket can be auto-resolved with a KB article or standard procedure",
  "suggestedResolution": "if autoResolvable is true, suggest the resolution",
  "escalationRequired": "true if this needs human review",
  "estimatedResolutionTime": "e.g., '15 minutes', '1 hour', '4 hours', '1 day'"
}

Consider:
- Service affected (Exchange, Teams, SharePoint, etc.)
- Number of users impacted
- Business criticality
- Whether this is a common issue with a known solution
- Urgency indicators in the title and description`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert IT support ticket analyzer. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ticket_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              priority: { type: 'string' },
              urgency: { type: 'string' },
              affectedUsers: { type: 'number' },
              businessImpact: { type: 'string' },
              suggestedTags: { type: 'array', items: { type: 'string' } },
              autoResolvable: { type: 'boolean' },
              suggestedResolution: { type: 'string' },
              escalationRequired: { type: 'boolean' },
              estimatedResolutionTime: { type: 'string' },
            },
            required: [
              'category',
              'priority',
              'urgency',
              'affectedUsers',
              'businessImpact',
              'suggestedTags',
              'autoResolvable',
              'escalationRequired',
              'estimatedResolutionTime',
            ],
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No response from LLM');
    }

    const analysis = JSON.parse(content) as TicketAnalysis;
    console.log(`[AI Ticket Analysis] ✅ Analysis complete:`, {
      category: analysis.category,
      priority: analysis.priority,
      autoResolvable: analysis.autoResolvable,
    });

    return analysis;
  } catch (error) {
    console.error('[AI Ticket Analysis] Error:', error);
    // Return default analysis on error
    return {
      category: TICKET_CATEGORIES.GENERAL,
      priority: PRIORITY_LEVELS.MEDIUM,
      urgency: 'normal',
      affectedUsers: 1,
      businessImpact: 'Unknown impact',
      suggestedTags: [],
      autoResolvable: false,
      escalationRequired: true,
      estimatedResolutionTime: '2 hours',
    };
  }
}

/**
 * tRPC router for ticket categorization
 */
export const aiTicketCategorization = router({
  /**
   * Analyze a ticket and get AI categorization
   */
  analyzeTicket: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        clientName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const analysis = await analyzeTicket(input.title, input.description, input.clientName);
      return analysis;
    }),

  /**
   * Get categorization suggestions for multiple tickets
   */
  batchAnalyzeTickets: protectedProcedure
    .input(
      z.object({
        tickets: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            clientName: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`[AI Batch Analysis] Analyzing ${input.tickets.length} tickets...`);

      const results = await Promise.all(
        input.tickets.map(async (ticket) => ({
          ticketId: ticket.id,
          analysis: await analyzeTicket(ticket.title, ticket.description, ticket.clientName),
        }))
      );

      console.log(`[AI Batch Analysis] ✅ Completed ${results.length} tickets`);
      return results;
    }),

  /**
   * Get available categories
   */
  getCategories: publicProcedure.query(() => {
    return Object.entries(TICKET_CATEGORIES).map(([key, value]) => ({
      id: key,
      name: value,
    }));
  }),

  /**
   * Get priority levels
   */
  getPriorityLevels: publicProcedure.query(() => {
    return Object.entries(PRIORITY_LEVELS).map(([key, value]) => ({
      id: key,
      name: value,
    }));
  }),
});
