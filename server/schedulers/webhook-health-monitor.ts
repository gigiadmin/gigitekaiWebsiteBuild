import {
  recordHealthCheck,
  getAllWebhookStatuses,
  initializeWebhookMonitoring,
} from '../db-webhook-monitoring';
import { notifyOwner } from '../_core/notification';

/**
 * Webhook Health Monitor Scheduler
 * 
 * Runs periodic health checks on webhooks with intelligent failure detection.
 * Only sends alerts when thresholds are exceeded, preventing email spam.
 */

let healthCheckIntervalId: NodeJS.Timeout | null = null;

// Test payload for webhook health check
function getTestPayload() {
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: '🟢 GigitekAI Webhook Health Check',
              weight: 'bolder',
              color: 'good',
            },
            {
              type: 'TextBlock',
              text: `Timestamp: ${new Date().toISOString()}`,
              size: 'small',
            },
          ],
        },
      },
    ],
  };
}

/**
 * Ping a single webhook and record the result
 */
async function pingWebhook(webhookId: number, webhookUrl: string) {
  const startTime = Date.now();
  let httpStatus: number | null = null;
  let isSuccess = false;
  let errorMessage: string | undefined;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getTestPayload()),
      timeout: 10000, // 10 second timeout
    });

    httpStatus = response.status;
    isSuccess = response.status === 200 || response.status === 202;

    if (!isSuccess) {
      const text = await response.text();
      errorMessage = `HTTP ${response.status}: ${text.substring(0, 200)}`;
    }
  } catch (error) {
    httpStatus = null;
    isSuccess = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  const responseTime = Date.now() - startTime;

  // Record the check
  await recordHealthCheck(webhookId, httpStatus, responseTime, isSuccess, errorMessage);

  return { isSuccess, httpStatus, responseTime, errorMessage };
}

/**
 * Run health checks on all webhooks
 */
async function runHealthChecks() {
  try {
    console.log('[Webhook Monitor] Running health checks...');

    // Initialize if needed
    await initializeWebhookMonitoring();

    // Get all webhook statuses
    const statuses = await getAllWebhookStatuses();

    for (const { endpoint, state } of statuses) {
      if (!endpoint.isActive) {
        console.log(`[Webhook Monitor] Skipping inactive webhook: ${endpoint.name}`);
        continue;
      }

      console.log(`[Webhook Monitor] Checking: ${endpoint.name}`);

      const result = await pingWebhook(endpoint.id, endpoint.url);

      if (result.isSuccess) {
        console.log(
          `[Webhook Monitor] ✅ ${endpoint.name} - HTTP ${result.httpStatus} (${result.responseTime}ms)`
        );
      } else {
        console.log(
          `[Webhook Monitor] ❌ ${endpoint.name} - ${result.errorMessage}`
        );
      }

      // Check if we should send an alert
      if (state && state.alertStatus !== 'healthy' && !state.lastAlertSentAt) {
        console.log(
          `[Webhook Monitor] 🚨 Alert needed for ${endpoint.name} (status: ${state.alertStatus})`
        );

        // Send a single summary notification (not per-check)
        await notifyOwner({
          title: `⚠️ Webhook Alert: ${endpoint.name}`,
          content: `Status: ${state.alertStatus}\nConsecutive Failures: ${state.consecutiveFailures}\n\nCheck the Webhook Monitoring Dashboard for details.`,
        });
      }
    }

    console.log('[Webhook Monitor] Health checks completed');
  } catch (error) {
    console.error('[Webhook Monitor] Error during health checks:', error);
  }
}

/**
 * Start the webhook health monitor
 */
export function startWebhookHealthMonitor(): void {
  if (healthCheckIntervalId) {
    console.log('[Webhook Monitor] Already running');
    return;
  }

  const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  console.log('[Webhook Monitor] Starting (checks every 15 minutes)');

  // Run first check immediately
  runHealthChecks().catch(console.error);

  // Then run periodically
  healthCheckIntervalId = setInterval(() => {
    runHealthChecks().catch(console.error);
  }, INTERVAL_MS);

  console.log('[Webhook Monitor] ✅ Started');
}

/**
 * Stop the webhook health monitor (for testing)
 */
export function stopWebhookHealthMonitor(): void {
  if (healthCheckIntervalId) {
    clearInterval(healthCheckIntervalId);
    healthCheckIntervalId = null;
    console.log('[Webhook Monitor] Stopped');
  }
}

/**
 * Manually trigger a health check (for testing/dashboard)
 */
export async function triggerWebhookHealthCheck(webhookId?: number) {
  const statuses = await getAllWebhookStatuses();

  if (webhookId) {
    const status = statuses.find((s) => s.endpoint.id === webhookId);
    if (status) {
      return pingWebhook(status.endpoint.id, status.endpoint.url);
    }
  } else {
    // Check all
    return Promise.all(
      statuses.map((s) => pingWebhook(s.endpoint.id, s.endpoint.url))
    );
  }
}
