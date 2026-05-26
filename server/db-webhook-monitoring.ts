import { db } from './db';
import {
  webhookEndpoints,
  webhookHealthChecks,
  webhookAlertState,
  webhookAlerts,
  webhookStats,
  InsertWebhookHealthCheck,
  InsertWebhookAlertState,
  InsertWebhookAlert,
} from '@/drizzle/schema-webhook-monitoring';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Database helpers for webhook monitoring
 */

// Get or create webhook endpoint
export async function getOrCreateWebhookEndpoint(
  name: string,
  url: string,
  type: string = 'teams'
) {
  const existing = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.name, name))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(webhookEndpoints).values({
    name,
    url,
    type,
    isActive: 1,
  });

  return db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.id, Number(result.insertId)))
    .limit(1)
    .then((rows) => rows[0]);
}

// Record a health check attempt
export async function recordHealthCheck(
  webhookId: number,
  httpStatus: number | null,
  responseTime: number,
  isSuccess: boolean,
  errorMessage?: string
) {
  const check: InsertWebhookHealthCheck = {
    webhookId,
    httpStatus,
    responseTime,
    isSuccess: isSuccess ? 1 : 0,
    errorMessage: errorMessage || null,
  };

  await db.insert(webhookHealthChecks).values(check);

  // Update alert state based on this check
  await updateAlertState(webhookId, isSuccess);
}

// Update alert state based on health check result
async function updateAlertState(webhookId: number, isSuccess: boolean) {
  const state = await db
    .select()
    .from(webhookAlertState)
    .where(eq(webhookAlertState.webhookId, webhookId))
    .limit(1);

  const currentState = state[0];

  if (isSuccess) {
    // Success: reset failure counter
    if (currentState?.consecutiveFailures > 0) {
      // Recovery detected
      await db
        .update(webhookAlertState)
        .set({
          consecutiveFailures: 0,
          lastSuccessTime: new Date().toISOString(),
          alertStatus: 'healthy',
          recoveryNotifiedAt: new Date().toISOString(),
        })
        .where(eq(webhookAlertState.webhookId, webhookId));

      // Create recovery alert
      await createAlert(webhookId, 'recovery', 'info', 'Webhook recovered');
    }
  } else {
    // Failure: increment counter
    const newFailureCount = (currentState?.consecutiveFailures || 0) + 1;
    const alertThreshold = currentState?.alertThreshold || 3;

    const newStatus =
      newFailureCount >= alertThreshold * 2 ? 'critical' : 'degraded';

    await db
      .update(webhookAlertState)
      .set({
        consecutiveFailures: newFailureCount,
        lastFailureTime: new Date().toISOString(),
        alertStatus: newStatus,
      })
      .where(eq(webhookAlertState.webhookId, webhookId));

    // Create alert if threshold reached
    if (newFailureCount === alertThreshold) {
      await createAlert(
        webhookId,
        'failure',
        'warning',
        `Webhook failed ${alertThreshold} times consecutively`
      );
    } else if (newFailureCount === alertThreshold * 2) {
      await createAlert(
        webhookId,
        'degradation',
        'critical',
        `Webhook is in critical state (${newFailureCount} failures)`
      );
    }
  }
}

// Create an alert
export async function createAlert(
  webhookId: number,
  alertType: 'failure' | 'recovery' | 'degradation',
  severity: 'warning' | 'critical' | 'info',
  message: string,
  details?: string
) {
  const alert: InsertWebhookAlert = {
    webhookId,
    alertType,
    severity,
    message,
    details: details || null,
    notificationSent: 0,
  };

  await db.insert(webhookAlerts).values(alert);
}

// Get pending alerts (not yet notified)
export async function getPendingAlerts() {
  return db
    .select()
    .from(webhookAlerts)
    .where(eq(webhookAlerts.notificationSent, 0))
    .orderBy(desc(webhookAlerts.createdAt));
}

// Mark alert as notified
export async function markAlertNotified(alertId: number) {
  await db
    .update(webhookAlerts)
    .set({
      notificationSent: 1,
      notificationSentAt: new Date().toISOString(),
    })
    .where(eq(webhookAlerts.id, alertId));
}

// Get webhook status summary
export async function getWebhookStatus(webhookId: number) {
  const endpoint = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.id, webhookId))
    .limit(1);

  const state = await db
    .select()
    .from(webhookAlertState)
    .where(eq(webhookAlertState.webhookId, webhookId))
    .limit(1);

  // Get last 10 checks
  const recentChecks = await db
    .select()
    .from(webhookHealthChecks)
    .where(eq(webhookHealthChecks.webhookId, webhookId))
    .orderBy(desc(webhookHealthChecks.checkTimestamp))
    .limit(10);

  return {
    endpoint: endpoint[0],
    state: state[0],
    recentChecks,
  };
}

// Get all webhook statuses
export async function getAllWebhookStatuses() {
  const endpoints = await db.select().from(webhookEndpoints);

  const statuses = await Promise.all(
    endpoints.map(async (ep) => ({
      endpoint: ep,
      state: await db
        .select()
        .from(webhookAlertState)
        .where(eq(webhookAlertState.webhookId, ep.id))
        .limit(1)
        .then((rows) => rows[0]),
    }))
  );

  return statuses;
}

// Calculate uptime for a webhook (last 24 hours)
export async function calculateUptime(webhookId: number) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const checks = await db
    .select()
    .from(webhookHealthChecks)
    .where(
      and(
        eq(webhookHealthChecks.webhookId, webhookId),
        sql`${webhookHealthChecks.checkTimestamp} > ${oneDayAgo}`
      )
    );

  if (checks.length === 0) return null;

  const successCount = checks.filter((c) => c.isSuccess === 1).length;
  const uptime = (successCount / checks.length) * 100;

  return {
    totalChecks: checks.length,
    successCount,
    failureCount: checks.length - successCount,
    uptime: parseFloat(uptime.toFixed(2)),
  };
}

// Initialize webhook endpoint if not exists
export async function initializeWebhookMonitoring() {
  const existing = await db
    .select()
    .from(webhookEndpoints)
    .where(eq(webhookEndpoints.name, 'Teams Help Desk'));

  if (existing.length === 0) {
    const endpoint = await getOrCreateWebhookEndpoint(
      'Teams Help Desk',
      process.env.TEAMS_WEBHOOK_URL || '',
      'teams'
    );

    // Initialize alert state
    await db.insert(webhookAlertState).values({
      webhookId: endpoint.id,
      consecutiveFailures: 0,
      alertStatus: 'healthy',
      alertThreshold: 3,
    });

    console.log('[Webhook Monitoring] Initialized Teams Help Desk webhook');
  }
}
