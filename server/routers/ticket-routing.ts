/**
 * Intelligent Ticket Routing & Escalation System
 * Automatically routes tickets to appropriate agents and escalates when needed
 * Optimizes ticket distribution and ensures SLA compliance
 */

import { protectedProcedure, adminProcedure, router } from '../_core/trpc';
import { z } from 'zod';

/**
 * Routing rules based on ticket category and priority
 */
export const ROUTING_RULES = {
  // Exchange Online tickets
  'Exchange Online': {
    tier1: ['Password reset', 'Cannot access', 'Connection error'],
    tier2: ['Send/receive issues', 'Calendar sync', 'Mailbox quota'],
    tier3: ['Server errors', 'Data recovery', 'Migration issues'],
  },

  // Microsoft Teams tickets
  'Microsoft Teams': {
    tier1: ['Cannot sign in', 'Audio/video not working', 'Connection issues'],
    tier2: ['Meeting issues', 'Chat problems', 'Channel access'],
    tier3: ['Performance issues', 'Integration problems', 'Custom development'],
  },

  // SharePoint Online tickets
  'SharePoint Online': {
    tier1: ['Access denied', 'File upload issues', 'Permission problems'],
    tier2: ['Site sync', 'Performance', 'Workflow issues'],
    tier3: ['Custom development', 'Migration', 'Advanced configuration'],
  },

  // OneDrive tickets
  'OneDrive': {
    tier1: ['Sync issues', 'Storage quota', 'File access'],
    tier2: ['Performance', 'Sharing problems', 'Version history'],
    tier3: ['Recovery', 'Advanced sync', 'Custom configuration'],
  },

  // Entra ID / Azure AD tickets
  'Entra ID / Azure AD': {
    tier1: ['Password reset', 'MFA setup', 'Account lockout'],
    tier2: ['License assignment', 'Group management', 'Conditional access'],
    tier3: ['Custom policies', 'Advanced security', 'Integration'],
  },

  // General IT Support
  'General IT Support': {
    tier1: ['FAQ', 'General questions', 'Account management'],
    tier2: ['Troubleshooting', 'Setup assistance', 'Documentation'],
    tier3: ['Complex issues', 'Custom solutions', 'Advanced support'],
  },
};

/**
 * Escalation triggers
 */
export const ESCALATION_TRIGGERS = {
  failedAttempts: 2, // Escalate after 2 failed resolution attempts
  timeThreshold: 30, // Escalate if unresolved for 30 minutes
  customerRequest: true, // Always escalate if customer requests human support
  serviceOutage: true, // Always escalate service outages
  securityIncident: true, // Always escalate security incidents
  dataLoss: true, // Always escalate data loss issues
  multipleUsers: true, // Escalate if affecting multiple users
};

/**
 * Agent specialization levels
 */
export const AGENT_SPECIALIZATIONS = {
  tier1: {
    name: 'Tier 1 Support',
    skills: ['Password reset', 'Account management', 'FAQ', 'Basic troubleshooting'],
    maxTickets: 20,
    avgResolutionTime: '15 minutes',
    autoResolveRate: '60-70%',
  },
  tier2: {
    name: 'Tier 2 Support',
    skills: ['Advanced troubleshooting', 'Configuration', 'Integration', 'Performance'],
    maxTickets: 10,
    avgResolutionTime: '45 minutes',
    autoResolveRate: '40-50%',
  },
  tier3: {
    name: 'Tier 3 Support',
    skills: ['Complex issues', 'Custom development', 'Architecture', 'Emergency response'],
    maxTickets: 5,
    avgResolutionTime: '2-4 hours',
    autoResolveRate: '20-30%',
  },
};

/**
 * SLA targets by priority
 */
export const SLA_TARGETS = {
  critical: {
    responseTime: 15, // minutes
    resolutionTime: 60, // minutes
    escalationTime: 30, // minutes
  },
  high: {
    responseTime: 30,
    resolutionTime: 240, // 4 hours
    escalationTime: 60,
  },
  medium: {
    responseTime: 60,
    resolutionTime: 480, // 8 hours
    escalationTime: 120,
  },
  low: {
    responseTime: 120,
    resolutionTime: 1440, // 24 hours
    escalationTime: 480,
  },
};

/**
 * Routing decision interface
 */
export interface RoutingDecision {
  agentTier: 'tier1' | 'tier2' | 'tier3' | 'ai';
  category: string;
  priority: string;
  shouldEscalate: boolean;
  escalationReason?: string;
  estimatedResolutionTime: string;
  suggestedAgent?: string;
  autoResolveAttempt: boolean;
  slaDeadline: number; // timestamp
}

/**
 * Determine routing decision for a ticket
 */
export function determineRouting(
  category: string,
  priority: string,
  description: string,
  failedAttempts: number = 0
): RoutingDecision {
  const now = Date.now();
  let agentTier: 'tier1' | 'tier2' | 'tier3' | 'ai' = 'ai';
  let shouldEscalate = false;
  let escalationReason: string | undefined;
  let autoResolveAttempt = true;

  // Check escalation triggers
  if (failedAttempts >= ESCALATION_TRIGGERS.failedAttempts) {
    shouldEscalate = true;
    escalationReason = `Failed after ${failedAttempts} attempts`;
    autoResolveAttempt = false;
  }

  if (
    ESCALATION_TRIGGERS.serviceOutage &&
    (description.toLowerCase().includes('outage') ||
      description.toLowerCase().includes('down') ||
      description.toLowerCase().includes('all users'))
  ) {
    shouldEscalate = true;
    escalationReason = 'Potential service outage';
    autoResolveAttempt = false;
  }

  if (
    ESCALATION_TRIGGERS.securityIncident &&
    (description.toLowerCase().includes('security') ||
      description.toLowerCase().includes('breach') ||
      description.toLowerCase().includes('unauthorized'))
  ) {
    shouldEscalate = true;
    escalationReason = 'Security incident';
    autoResolveAttempt = false;
  }

  if (
    ESCALATION_TRIGGERS.dataLoss &&
    (description.toLowerCase().includes('data loss') ||
      description.toLowerCase().includes('deleted') ||
      description.toLowerCase().includes('recovery'))
  ) {
    shouldEscalate = true;
    escalationReason = 'Data loss issue';
    autoResolveAttempt = false;
  }

  // Determine tier based on category and priority
  if (!shouldEscalate) {
    if (priority === 'critical' || priority === 'high') {
      agentTier = 'tier2';
    } else if (priority === 'medium') {
      agentTier = 'tier1';
    } else {
      agentTier = 'ai'; // Try AI first for low priority
    }
  } else {
    agentTier = 'tier3';
  }

  // Determine SLA deadline
  const slaMinutes = SLA_TARGETS[priority as keyof typeof SLA_TARGETS]?.resolutionTime || 480;
  const slaDeadline = now + slaMinutes * 60 * 1000;

  // Estimate resolution time
  let estimatedResolutionTime = '30 minutes';
  if (priority === 'critical') {
    estimatedResolutionTime = '1 hour';
  } else if (priority === 'high') {
    estimatedResolutionTime = '2-4 hours';
  } else if (priority === 'medium') {
    estimatedResolutionTime = '4-8 hours';
  } else {
    estimatedResolutionTime = '24 hours';
  }

  return {
    agentTier,
    category,
    priority,
    shouldEscalate,
    escalationReason,
    estimatedResolutionTime,
    autoResolveAttempt,
    slaDeadline,
  };
}

/**
 * Get routing rules for a category
 */
export function getRoutingRulesForCategory(category: string) {
  return ROUTING_RULES[category as keyof typeof ROUTING_RULES] || ROUTING_RULES['General IT Support'];
}

/**
 * Check if ticket should be escalated
 */
export function shouldEscalateTicket(
  priority: string,
  failedAttempts: number,
  timeElapsed: number, // in minutes
  description: string
): boolean {
  // Check failed attempts
  if (failedAttempts >= ESCALATION_TRIGGERS.failedAttempts) {
    return true;
  }

  // Check time threshold
  const timeThreshold = SLA_TARGETS[priority as keyof typeof SLA_TARGETS]?.escalationTime || 120;
  if (timeElapsed > timeThreshold) {
    return true;
  }

  // Check for keywords
  const escalationKeywords = [
    'outage',
    'down',
    'security',
    'breach',
    'data loss',
    'deleted',
    'recovery',
    'all users',
    'emergency',
    'urgent',
  ];
  if (escalationKeywords.some((keyword) => description.toLowerCase().includes(keyword))) {
    return true;
  }

  return false;
}

/**
 * tRPC router for ticket routing
 */
export const ticketRoutingRouter = router({
  /**
   * Determine routing for a ticket
   */
  determineRouting: protectedProcedure
    .input(
      z.object({
        category: z.string(),
        priority: z.string(),
        description: z.string(),
        failedAttempts: z.number().optional().default(0),
      })
    )
    .query(({ input }) => {
      return determineRouting(input.category, input.priority, input.description, input.failedAttempts);
    }),

  /**
   * Get routing rules for category
   */
  getRoutingRules: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => {
      return getRoutingRulesForCategory(input.category);
    }),

  /**
   * Check if ticket should be escalated
   */
  checkEscalation: protectedProcedure
    .input(
      z.object({
        priority: z.string(),
        failedAttempts: z.number(),
        timeElapsed: z.number(), // in minutes
        description: z.string(),
      })
    )
    .query(({ input }) => {
      return {
        shouldEscalate: shouldEscalateTicket(
          input.priority,
          input.failedAttempts,
          input.timeElapsed,
          input.description
        ),
      };
    }),

  /**
   * Get SLA targets
   */
  getSlaTargets: protectedProcedure.query(() => {
    return SLA_TARGETS;
  }),

  /**
   * Get agent specializations
   */
  getAgentSpecializations: protectedProcedure.query(() => {
    return AGENT_SPECIALIZATIONS;
  }),

  /**
   * Get escalation triggers
   */
  getEscalationTriggers: protectedProcedure.query(() => {
    return ESCALATION_TRIGGERS;
  }),

  /**
   * Get all routing rules
   */
  getAllRoutingRules: protectedProcedure.query(() => {
    return ROUTING_RULES;
  }),

  /**
   * Calculate SLA deadline
   */
  calculateSlaDeadline: protectedProcedure
    .input(z.object({ priority: z.string() }))
    .query(({ input }) => {
      const slaMinutes = SLA_TARGETS[input.priority as keyof typeof SLA_TARGETS]?.resolutionTime || 480;
      const deadline = Date.now() + slaMinutes * 60 * 1000;
      return {
        deadline,
        slaMinutes,
        formattedDeadline: new Date(deadline).toISOString(),
      };
    }),

  /**
   * Get estimated resolution time
   */
  getEstimatedResolutionTime: protectedProcedure
    .input(z.object({ priority: z.string() }))
    .query(({ input }) => {
      const estimates = {
        critical: '1 hour',
        high: '2-4 hours',
        medium: '4-8 hours',
        low: '24 hours',
      };
      return estimates[input.priority as keyof typeof estimates] || '24 hours';
    }),
});
