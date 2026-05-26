/**
 * UptimeRobot Webhook Handler
 * Receives status change notifications from UptimeRobot
 * Creates alerts and sends Teams/email notifications
 */

import { Router, Request, Response } from 'express';
import { getDb } from './db';
import { uptimeAlerts } from '../drizzle/schema';
import { sendToTeamsWithRetry } from './_core/teamsWebhookUtils';
import { sendEmail } from './_core/email';
import { notifyOwner } from './_core/notification';
import { eq } from 'drizzle-orm';

const router = Router();

interface UptimeRobotWebhookPayload {
  monitorID: number;
  monitorName: string;
  monitorURL: string;
  monitorStatus: number; // 0 = paused, 1 = not checked yet, 2 = up, 8 = seems down, 9 = down
  statusCode?: number;
  alertDetails?: string;
  alertContactID?: number;
  customUptimeRatio?: string;
  customUptimeRatio7days?: string;
  customUptimeRatio30days?: string;
  customUptimeRatio365days?: string;
  customUptimeRatioAll?: string;
}

/**
 * Map UptimeRobot status codes to human-readable status
 */
function getStatusLabel(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'paused',
    1: 'not_checked',
    2: 'up',
    8: 'seems_down',
    9: 'down',
  };
  return statusMap[status] || 'unknown';
}

/**
 * Determine if status is considered "down"
 */
function isDownStatus(status: number): boolean {
  return status === 8 || status === 9; // seems_down or down
}

/**
 * Create Teams Adaptive Card for uptime alert
 */
function createUptimeAlertCard(
  monitorName: string,
  monitorUrl: string,
  transitionType: 'up_to_down' | 'down_to_up',
  downtimeMinutes?: number
) {
  const isDown = transitionType === 'up_to_down';
  const color = isDown ? '#FF6B6B' : '#51CF66'; // Red for down, green for up
  const title = isDown ? '🔴 Service Down' : '🟢 Service Recovered';
  const subtitle = isDown ? 'Alert: Service is down' : 'Alert: Service is back up';

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
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
                      width: 'stretch',
                      items: [
                        {
                          type: 'TextBlock',
                          text: title,
                          weight: 'bolder',
                          size: 'large',
                          color: isDown ? 'attention' : 'good',
                        },
                        {
                          type: 'TextBlock',
                          text: subtitle,
                          size: 'medium',
                          spacing: 'small',
                          color: 'default',
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
                    {
                      name: 'Monitor:',
                      value: monitorName,
                    },
                    {
                      name: 'URL:',
                      value: monitorUrl,
                    },
                    ...(downtimeMinutes
                      ? [
                          {
                            name: 'Downtime:',
                            value: `${downtimeMinutes} minute${downtimeMinutes !== 1 ? 's' : ''}`,
                          },
                        ]
                      : []),
                    {
                      name: 'Timestamp:',
                      value: new Date().toISOString(),
                    },
                  ],
                },
              ],
            },
            {
              type: 'Container',
              items: [
                {
                  type: 'ActionSet',
                  actions: [
                    {
                      type: 'Action.OpenUrl',
                      title: 'View Monitor',
                      url: `https://gigitekai.com/admin/uptime/${monitorName.replace(/\s+/g, '-').toLowerCase()}`,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

/**
 * POST /api/uptime/webhook
 * Receives status change notifications from UptimeRobot
 */
router.post('/api/uptime/webhook', async (req: Request, res: Response) => {
  try {
    const payload: UptimeRobotWebhookPayload = req.body;

    console.log('[Uptime Webhook] Received:', {
      monitorName: payload.monitorName,
      status: getStatusLabel(payload.monitorStatus),
    });

    // Validate payload
    if (!payload.monitorID || !payload.monitorName || !payload.monitorURL) {
      console.warn('[Uptime Webhook] Invalid payload - missing required fields');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const db = await getDb();
    if (!db) {
      console.error('[Uptime Webhook] Database connection failed');
      return res.status(500).json({ error: 'Database error' });
    }

    const isCurrentlyDown = isDownStatus(payload.monitorStatus);
    const currentStatus = isCurrentlyDown ? 'down' : 'up';

    // Get the most recent alert for this monitor to determine previous status
    const recentAlerts = await db
      .select()
      .from(uptimeAlerts)
      .where(eq(uptimeAlerts.monitorId, payload.monitorID))
      .orderBy((t) => t.createdAt)
      .limit(1);

    const previousAlert = recentAlerts[0];
    const previousStatus = previousAlert?.currentStatus || (isCurrentlyDown ? 'up' : 'down');

    // Only create alert if status actually changed
    if (previousStatus === currentStatus) {
      console.log('[Uptime Webhook] No status change detected - skipping alert');
      return res.json({ success: true, message: 'No status change' });
    }

    const transitionType: 'up_to_down' | 'down_to_up' =
      previousStatus === 'up' && currentStatus === 'down' ? 'up_to_down' : 'down_to_up';

    // Calculate downtime if transitioning to up
    let downtimeMinutes: number | undefined;
    if (transitionType === 'down_to_up' && previousAlert?.downStartedAt) {
      const downStart = new Date(previousAlert.downStartedAt).getTime();
      const downEnd = Date.now();
      downtimeMinutes = Math.round((downEnd - downStart) / (1000 * 60));
    }

    // Create alert record
    const alert = await db.insert(uptimeAlerts).values({
      monitorId: payload.monitorID,
      monitorName: payload.monitorName,
      monitorUrl: payload.monitorURL,
      previousStatus,
      currentStatus,
      transitionType,
      downtimeMinutes,
      downStartedAt: transitionType === 'up_to_down' ? new Date().toISOString() : previousAlert?.downStartedAt,
      downEndedAt: transitionType === 'down_to_up' ? new Date().toISOString() : undefined,
    });

    const alertId = (alert as any).insertId;
    console.log(`[Uptime Webhook] Created alert #${alertId}: ${transitionType}`);

    // Send Teams notification
    try {
      const card = createUptimeAlertCard(
        payload.monitorName,
        payload.monitorURL,
        transitionType,
        downtimeMinutes
      );

      // Send to Help Desk channel
      const webhookUrl = process.env.TEAMS_WEBHOOK_URL || '';
      const teamsResponse = await sendToTeamsWithRetry(
        webhookUrl,
        card,
        `uptime alert #${alertId}`
      );

      if (teamsResponse?.success) {
        await db
          .update(uptimeAlerts)
          .set({
            teamsNotificationSent: 1,
            teamsMessageId: alertId.toString(),
            teamsChannelId: process.env.TEAMS_BOT_CHANNEL_ID,
          })
          .where(eq(uptimeAlerts.id, alertId));

        console.log(`[Uptime Webhook] Teams notification sent for alert #${alertId}`);
      }
    } catch (teamsError) {
      console.error('[Uptime Webhook] Teams notification failed:', teamsError);
    }

    // Send email notification
    try {
      const emailSubject = `[${transitionType === 'up_to_down' ? 'ALERT' : 'RESOLVED'}] ${payload.monitorName} is ${currentStatus.toUpperCase()}`;
      const emailBody = `
        <h2>${emailSubject}</h2>
        <p><strong>Monitor:</strong> ${payload.monitorName}</p>
        <p><strong>URL:</strong> <a href="${payload.monitorURL}">${payload.monitorURL}</a></p>
        <p><strong>Status:</strong> ${currentStatus.toUpperCase()}</p>
        ${downtimeMinutes ? `<p><strong>Downtime:</strong> ${downtimeMinutes} minutes</p>` : ''}
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <hr />
        <p><a href="https://gigitekai.com/admin/uptime">View Uptime Dashboard</a></p>
      `;

      await sendEmail({
        to: 'support@gigitekai.com',
        subject: emailSubject,
        html: emailBody,
      });

      await db
        .update(uptimeAlerts)
        .set({ emailNotificationSent: 1 })
        .where(eq(uptimeAlerts.id, alertId));

      console.log(`[Uptime Webhook] Email notification sent for alert #${alertId}`);
    } catch (emailError) {
      console.error('[Uptime Webhook] Email notification failed:', emailError);
    }

    // Notify owner
    try {
      await notifyOwner({
        title: `Uptime Alert: ${payload.monitorName} is ${currentStatus.toUpperCase()}`,
        content: `Monitor: ${payload.monitorName}\nURL: ${payload.monitorURL}\nStatus: ${currentStatus}\n${downtimeMinutes ? `Downtime: ${downtimeMinutes} minutes` : ''}`,
      });
    } catch (notifyError) {
      console.error('[Uptime Webhook] Owner notification failed:', notifyError);
    }

    res.json({
      success: true,
      alertId,
      transitionType,
      message: `Alert created for ${transitionType}`,
    });
  } catch (error) {
    console.error('[Uptime Webhook] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
