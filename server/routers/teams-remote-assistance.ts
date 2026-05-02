/**
 * Teams Channel Remote Assistance Integration
 * Sends Adaptive Cards to Teams channels for remote session initiation
 * Uses Microsoft Graph API and Teams Incoming Webhooks
 */

import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';

// ── Adaptive Card Templates ──────────────────────────────────────────────────

function buildRemoteSessionCard(params: {
  ticketId: number;
  ticketTitle: string;
  clientName: string;
  clientEmail: string;
  technicianName: string;
  sessionType: string;
  sessionLink: string;
  sessionCode: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}) {
  const urgencyColor = {
    low: 'Good',
    medium: 'Warning',
    high: 'Attention',
    critical: 'Attention',
  }[params.urgency];

  const urgencyEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  }[params.urgency];

  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'Container',
        style: 'emphasis',
        items: [
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 'auto',
                items: [
                  {
                    type: 'Image',
                    url: 'https://gigitekai.com/favicon.ico',
                    size: 'Small',
                    style: 'Person',
                  },
                ],
              },
              {
                type: 'Column',
                width: 'stretch',
                items: [
                  {
                    type: 'TextBlock',
                    text: '🖥️ Remote Assistance Session',
                    weight: 'Bolder',
                    size: 'Medium',
                    color: 'Accent',
                  },
                  {
                    type: 'TextBlock',
                    text: `GigitekAI Support • Ticket #${params.ticketId}`,
                    size: 'Small',
                    isSubtle: true,
                    spacing: 'None',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'Container',
        items: [
          {
            type: 'FactSet',
            facts: [
              { title: 'Issue:', value: params.ticketTitle },
              { title: 'Client:', value: `${params.clientName} (${params.clientEmail})` },
              { title: 'Technician:', value: params.technicianName },
              { title: 'Session Type:', value: params.sessionType },
              { title: 'Urgency:', value: `${urgencyEmoji} ${params.urgency.toUpperCase()}` },
              { title: 'Session Code:', value: `\`${params.sessionCode}\`` },
            ],
          },
        ],
      },
      {
        type: 'Container',
        style: urgencyColor,
        items: [
          {
            type: 'TextBlock',
            text: `⚡ Session is ready. Client has been notified to join.`,
            wrap: true,
            size: 'Small',
          },
        ],
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: '🚀 Join Session as Technician',
        url: params.sessionLink,
        style: 'positive',
      },
      {
        type: 'Action.OpenUrl',
        title: '🎫 View Ticket',
        url: `https://gigitekai.com/admin/helpdesk/tickets/${params.ticketId}`,
      },
      {
        type: 'Action.OpenUrl',
        title: '📊 Session Analytics',
        url: `https://gigitekai.com/admin/remote-assistance/analytics`,
      },
    ],
  };
}

function buildSessionEndedCard(params: {
  ticketId: number;
  technicianName: string;
  clientName: string;
  duration: number;
  resolved: boolean;
  notes?: string;
}) {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'Container',
        style: params.resolved ? 'good' : 'warning',
        items: [
          {
            type: 'TextBlock',
            text: params.resolved
              ? `✅ Remote Session Resolved — Ticket #${params.ticketId}`
              : `⚠️ Remote Session Ended — Ticket #${params.ticketId} (Follow-up needed)`,
            weight: 'Bolder',
            size: 'Medium',
            wrap: true,
          },
        ],
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Technician:', value: params.technicianName },
          { title: 'Client:', value: params.clientName },
          { title: 'Duration:', value: `${params.duration} minutes` },
          { title: 'Status:', value: params.resolved ? '✅ Resolved' : '⚠️ Needs Follow-up' },
          ...(params.notes ? [{ title: 'Notes:', value: params.notes }] : []),
        ],
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: '🎫 View Ticket',
        url: `https://gigitekai.com/admin/helpdesk/tickets/${params.ticketId}`,
      },
    ],
  };
}

// ── Teams Webhook Sender ─────────────────────────────────────────────────────

async function sendTeamsWebhook(webhookUrl: string, card: object): Promise<boolean> {
  try {
    const payload = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: card,
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (err) {
    console.error('[Teams Remote Assistance] Webhook send failed:', err);
    return false;
  }
}

// ── Router ───────────────────────────────────────────────────────────────────

export const teamsRemoteAssistanceRouter = router({
  /**
   * Notify Teams channel when a remote session is initiated from a ticket
   */
  notifySessionStarted: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        ticketTitle: z.string(),
        clientName: z.string(),
        clientEmail: z.string(),
        sessionType: z.enum(['screen_share_only', 'remote_control', 'file_transfer', 'collaborative']),
        sessionCode: z.string(),
        sessionLink: z.string(),
        urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        channelWebhookUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const technicianName = ctx.user?.name || ctx.user?.email || 'GigitekAI Technician';

      const sessionTypeLabels: Record<string, string> = {
        screen_share_only: 'Screen Share (View Only)',
        remote_control: 'Remote Control',
        file_transfer: 'File Transfer',
        collaborative: 'Collaborative Session',
      };
      const sessionTypeLabel = sessionTypeLabels[input.sessionType] ?? input.sessionType;

      const card = buildRemoteSessionCard({
        ticketId: input.ticketId,
        ticketTitle: input.ticketTitle,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        technicianName,
        sessionType: sessionTypeLabel ?? input.sessionType,
        sessionLink: input.sessionLink,
        sessionCode: input.sessionCode,
        urgency: input.urgency,
      });

      // Use provided webhook URL or fall back to env variable
      const webhookUrl =
        input.channelWebhookUrl || process.env.TEAMS_WEBHOOK_URL || '';

      if (!webhookUrl) {
        console.warn('[Teams Remote Assistance] No webhook URL configured');
        return { success: false, reason: 'No Teams webhook URL configured' };
      }

      const sent = await sendTeamsWebhook(webhookUrl, card);

      return {
        success: sent,
        card,
        technicianName,
        sessionType: sessionTypeLabel ?? input.sessionType,
      };
    }),

  /**
   * Notify Teams channel when a session ends
   */
  notifySessionEnded: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        clientName: z.string(),
        durationMinutes: z.number(),
        resolved: z.boolean(),
        notes: z.string().optional(),
        channelWebhookUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const technicianName = ctx.user?.name || ctx.user?.email || 'GigitekAI Technician';

      const card = buildSessionEndedCard({
        ticketId: input.ticketId,
        technicianName,
        clientName: input.clientName,
        duration: input.durationMinutes,
        resolved: input.resolved,
        notes: input.notes,
      });

      const webhookUrl =
        input.channelWebhookUrl || process.env.TEAMS_WEBHOOK_URL || '';

      if (!webhookUrl) {
        return { success: false, reason: 'No Teams webhook URL configured' };
      }

      const sent = await sendTeamsWebhook(webhookUrl, card);
      return { success: sent, card };
    }),

  /**
   * Send a daily digest of remote sessions to Teams
   */
  sendDailyDigest: adminProcedure
    .input(
      z.object({
        channelWebhookUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb() as any;

      // Get today's session stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let totalSessions = 0;
      let resolvedSessions = 0;
      let avgDuration = 0;

      try {
        // Query sessions from DB if table exists
        const sessions = await db.execute(
          `SELECT COUNT(*) as total,
                  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as resolved,
                  AVG(TIMESTAMPDIFF(MINUTE, created_at, ended_at)) as avg_duration
           FROM remote_assistance_sessions
           WHERE created_at >= ?`,
          [today]
        );
        if (sessions?.[0]) {
          totalSessions = sessions[0].total || 0;
          resolvedSessions = sessions[0].resolved || 0;
          avgDuration = Math.round(sessions[0].avg_duration || 0);
        }
      } catch {
        // Table may not exist yet
      }

      const resolutionRate =
        totalSessions > 0 ? Math.round((resolvedSessions / totalSessions) * 100) : 0;

      const digestCard = {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4',
        body: [
          {
            type: 'Container',
            style: 'emphasis',
            items: [
              {
                type: 'TextBlock',
                text: `📊 Daily Remote Assistance Digest — ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
                weight: 'Bolder',
                size: 'Medium',
                wrap: true,
              },
            ],
          },
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 'stretch',
                items: [
                  { type: 'TextBlock', text: '🖥️ Total Sessions', size: 'Small', isSubtle: true },
                  { type: 'TextBlock', text: `${totalSessions}`, size: 'ExtraLarge', weight: 'Bolder', color: 'Accent' },
                ],
              },
              {
                type: 'Column',
                width: 'stretch',
                items: [
                  { type: 'TextBlock', text: '✅ Resolved', size: 'Small', isSubtle: true },
                  { type: 'TextBlock', text: `${resolutionRate}%`, size: 'ExtraLarge', weight: 'Bolder', color: resolutionRate >= 80 ? 'Good' : 'Warning' },
                ],
              },
              {
                type: 'Column',
                width: 'stretch',
                items: [
                  { type: 'TextBlock', text: '⏱️ Avg Duration', size: 'Small', isSubtle: true },
                  { type: 'TextBlock', text: `${avgDuration}m`, size: 'ExtraLarge', weight: 'Bolder' },
                ],
              },
            ],
          },
        ],
        actions: [
          {
            type: 'Action.OpenUrl',
            title: '📊 View Full Analytics',
            url: 'https://gigitekai.com/admin/remote-assistance/analytics',
          },
        ],
      };

      const webhookUrl =
        input.channelWebhookUrl || process.env.TEAMS_WEBHOOK_URL || '';

      if (!webhookUrl) {
        return { success: false, reason: 'No Teams webhook URL configured' };
      }

      const sent = await sendTeamsWebhook(webhookUrl, digestCard);
      return {
        success: sent,
        stats: { totalSessions, resolvedSessions, resolutionRate, avgDuration },
      };
    }),

  /**
   * Test Teams webhook connectivity
   */
  testWebhook: adminProcedure
    .input(z.object({ webhookUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const webhookUrl = input.webhookUrl || process.env.TEAMS_WEBHOOK_URL || '';

      if (!webhookUrl) {
        return { success: false, reason: 'No webhook URL provided' };
      }

      const testCard = {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: '✅ GigitekAI Remote Assistance — Teams Integration Active',
            weight: 'Bolder',
            color: 'Good',
          },
          {
            type: 'TextBlock',
            text: 'Your Teams channel is successfully connected to the GigitekAI Remote Assistance system.',
            wrap: true,
            isSubtle: true,
          },
        ],
      };

      const sent = await sendTeamsWebhook(webhookUrl, testCard);
      return { success: sent };
    }),
});

export default teamsRemoteAssistanceRouter;
