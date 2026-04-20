/**
 * Health Check Scheduler
 * Runs periodic health checks for critical services
 * Stores results in history and updates uptime statistics
 */

import { checkEmailApiHealth, checkHelpdeskHealth, checkM365Health, ServiceHealthStatus } from "../routers/service-health-monitoring";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { storeHealthCheck, updateUptimeStatistics } from "../utils/uptimeCalculator";
import { getAlertThreshold } from "../utils/alertThresholds";
import { getDb } from "../db";
import { serviceStatusSubscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface HealthCheckLog {
  timestamp: Date;
  service: string;
  status: ServiceHealthStatus;
  message: string;
  responseTime: number;
}

const healthCheckLogs: HealthCheckLog[] = [];
const MAX_LOGS = 1000;
const previousStatus: Record<string, ServiceHealthStatus> = {
  "Email API": ServiceHealthStatus.HEALTHY,
  "Helpdesk System": ServiceHealthStatus.HEALTHY,
  "M365 Service Health": ServiceHealthStatus.HEALTHY,
};

function logHealthCheck(log: HealthCheckLog) {
  healthCheckLogs.push(log);
  if (healthCheckLogs.length > MAX_LOGS) {
    healthCheckLogs.shift();
  }

  const statusEmoji = {
    [ServiceHealthStatus.HEALTHY]: "✅",
    [ServiceHealthStatus.DEGRADED]: "⚠️",
    [ServiceHealthStatus.CRITICAL]: "🔴",
    [ServiceHealthStatus.OFFLINE]: "⛔",
  };

  console.log(
    `[Health Check] ${statusEmoji[log.status]} ${log.service}: ${log.status} (${log.responseTime}ms)`
  );
}

async function sendAlertIfStatusChanged(
  service: string,
  newStatus: ServiceHealthStatus,
  message: string
) {
  const previousSt = previousStatus[service] || ServiceHealthStatus.HEALTHY;
  previousStatus[service] = newStatus;

  // Get alert threshold configuration
  const threshold = await getAlertThreshold(service);
  if (!threshold || !threshold.enabled) {
    return;
  }

  let shouldNotify = false;
  let alertType = "";

  if (
    newStatus === ServiceHealthStatus.CRITICAL &&
    threshold.notifyOnCritical
  ) {
    shouldNotify = true;
    alertType = "CRITICAL";
  } else if (
    newStatus === ServiceHealthStatus.DEGRADED &&
    previousSt === ServiceHealthStatus.HEALTHY &&
    threshold.notifyOnDegraded
  ) {
    shouldNotify = true;
    alertType = "DEGRADED";
  } else if (
    (previousSt === ServiceHealthStatus.CRITICAL ||
      previousSt === ServiceHealthStatus.OFFLINE) &&
    newStatus === ServiceHealthStatus.HEALTHY &&
    threshold.notifyOnRecovery
  ) {
    shouldNotify = true;
    alertType = "RECOVERED";
  }

  if (!shouldNotify) {
    return;
  }

  console.error(`[Health Alert] ${alertType}: ${service} is ${newStatus}`);

  try {
    await notifyOwner({
      title: `🚨 ${alertType}: ${service} Status Alert`,
      content: `Service: ${service}\nStatus: ${newStatus}\nMessage: ${message}\n\nTime: ${new Date().toISOString()}`,
    });

    // Send emails to subscribers
    await sendEmailsToSubscribers(service, newStatus, alertType, message);
  } catch (error) {
    console.error(`[Health Alert] Failed to send notification:`, error);
  }
}

async function sendEmailsToSubscribers(
  service: string,
  status: ServiceHealthStatus,
  alertType: string,
  message: string
) {
  try {
    const db = await getDb();
    if (!db) return;

    let preferenceField: "notifyOnHealthy" | "notifyOnDegraded" | "notifyOnCritical" | "notifyOnOffline";
    let emailSubject: string;
    let emailContent: string;

    switch (status) {
      case ServiceHealthStatus.HEALTHY:
        preferenceField = "notifyOnHealthy";
        emailSubject = `✅ ${service} is now healthy`;
        emailContent = `Good news! ${service} has recovered and is now operating normally.`;
        break;
      case ServiceHealthStatus.DEGRADED:
        preferenceField = "notifyOnDegraded";
        emailSubject = `⚠️ ${service} is experiencing degradation`;
        emailContent = `${service} is experiencing performance degradation. We're investigating the issue.`;
        break;
      case ServiceHealthStatus.CRITICAL:
        preferenceField = "notifyOnCritical";
        emailSubject = `🔴 ${service} has critical issues`;
        emailContent = `${service} is experiencing critical issues and may be unavailable. Our team is working on a resolution.`;
        break;
      case ServiceHealthStatus.OFFLINE:
        preferenceField = "notifyOnOffline";
        emailSubject = `⛔ ${service} is offline`;
        emailContent = `${service} is currently offline. We're working to restore service as quickly as possible.`;
        break;
      default:
        return;
    }

    const subscribers = await db
      .select()
      .from(serviceStatusSubscriptions)
      .where(
        and(
          eq(serviceStatusSubscriptions.service, service),
          eq(serviceStatusSubscriptions.isActive, true),
          eq(serviceStatusSubscriptions[preferenceField], true)
        )
      );

    for (const subscriber of subscribers) {
      try {
        const unsubscribeLink = `https://gigitekai.com/status/unsubscribe?token=${subscriber.unsubscribeToken}`;

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0A0E1A 0%, #0F1A30 100%); color: #00D4FF; padding: 24px; text-align: center; border-bottom: 2px solid #00D4FF;">
              <h2 style="margin: 0; font-size: 22px;">${emailSubject}</h2>
            </div>
            <div style="padding: 24px; background: #f5f5f5;">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">${emailContent}</p>
              <p style="color: #666; font-size: 14px; margin-top: 16px;">${message}</p>
              <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 12px;">
                <a href="${unsubscribeLink}" style="color: #0099CC; text-decoration: none;">Unsubscribe from these notifications</a>
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0;">GigitekAI • Service Status Updates</p>
              <p style="margin: 4px 0 0;">support@gigitekai.com • +1 727 382 6909</p>
            </div>
          </div>
        `;

        await sendEmail({
          to: subscriber.email,
          subject: emailSubject,
          html: htmlContent,
        });
      } catch (error) {
        console.error(`[Health Alert] Failed to send email to ${subscriber.email}:`, error);
      }
    }

    console.log(`[Health Alert] Sent notifications to ${subscribers.length} subscribers for ${service}`);
  } catch (error) {
    console.error(`[Health Alert] Failed to send subscriber emails:`, error);
  }
}

async function runHealthCheckCycle() {
  console.log(`[Health Check] Starting cycle at ${new Date().toISOString()}`);

  try {
    const [emailHealth, helpdeskHealth, m365Health] = await Promise.all([
      checkEmailApiHealth(),
      checkHelpdeskHealth(),
      checkM365Health(),
    ]);

    // Log health checks
    logHealthCheck({
      timestamp: new Date(),
      service: emailHealth.service,
      status: emailHealth.status,
      message: emailHealth.message,
      responseTime: emailHealth.responseTime,
    });

    logHealthCheck({
      timestamp: new Date(),
      service: helpdeskHealth.service,
      status: helpdeskHealth.status,
      message: helpdeskHealth.message,
      responseTime: helpdeskHealth.responseTime,
    });

    logHealthCheck({
      timestamp: new Date(),
      service: m365Health.service,
      status: m365Health.status,
      message: m365Health.message,
      responseTime: m365Health.responseTime,
    });

    // Store health check results in database
    try {
      await Promise.all([
        storeHealthCheck(
          emailHealth.service,
          emailHealth.status as any,
          emailHealth.responseTime,
          emailHealth.message,
          emailHealth.metrics
        ),
        storeHealthCheck(
          helpdeskHealth.service,
          helpdeskHealth.status as any,
          helpdeskHealth.responseTime,
          helpdeskHealth.message,
          helpdeskHealth.metrics
        ),
        storeHealthCheck(
          m365Health.service,
          m365Health.status as any,
          m365Health.responseTime,
          m365Health.message,
          m365Health.metrics
        ),
      ]);

      // Update uptime statistics every 6 hours
      const now = new Date();
      if (now.getHours() % 6 === 0 && now.getMinutes() < 5) {
        await Promise.all([
          updateUptimeStatistics(emailHealth.service, "24h"),
          updateUptimeStatistics(emailHealth.service, "7d"),
          updateUptimeStatistics(helpdeskHealth.service, "24h"),
          updateUptimeStatistics(helpdeskHealth.service, "7d"),
          updateUptimeStatistics(m365Health.service, "24h"),
          updateUptimeStatistics(m365Health.service, "7d"),
        ]);
      }
    } catch (error) {
      console.error(`[Health Check] Error storing health check data:`, error);
    }

    // Send alerts if status changed
    await sendAlertIfStatusChanged(emailHealth.service, emailHealth.status, emailHealth.message);
    await sendAlertIfStatusChanged(helpdeskHealth.service, helpdeskHealth.status, helpdeskHealth.message);
    await sendAlertIfStatusChanged(m365Health.service, m365Health.status, m365Health.message);

    console.log(`[Health Check] Cycle completed`);
  } catch (error) {
    console.error(`[Health Check] Error:`, error);
  }
}

export function startHealthCheckScheduler(intervalMs = 5 * 60 * 1000) {
  console.log(`[Health Check] Starting scheduler (interval: ${intervalMs}ms)`);

  runHealthCheckCycle().catch((error) => {
    console.error(`[Health Check] Initial check failed:`, error);
  });

  const intervalId = setInterval(() => {
    runHealthCheckCycle().catch((error) => {
      console.error(`[Health Check] Scheduled check failed:`, error);
    });
  }, intervalMs);

  return intervalId;
}

export function getHealthCheckLogs(limit = 100): HealthCheckLog[] {
  return healthCheckLogs.slice(-limit);
}

export function getHealthCheckStats() {
  const stats = {
    totalChecks: healthCheckLogs.length,
    byService: {} as Record<string, Record<ServiceHealthStatus, number>>,
    byStatus: {} as Record<ServiceHealthStatus, number>,
    lastCheck: healthCheckLogs[healthCheckLogs.length - 1]?.timestamp,
  };

  healthCheckLogs.forEach((log) => {
    if (!stats.byService[log.service]) {
      stats.byService[log.service] = {
        [ServiceHealthStatus.HEALTHY]: 0,
        [ServiceHealthStatus.DEGRADED]: 0,
        [ServiceHealthStatus.CRITICAL]: 0,
        [ServiceHealthStatus.OFFLINE]: 0,
      };
    }
    stats.byService[log.service][log.status]++;
    stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
  });

  return stats;
}

export function stopHealthCheckScheduler(intervalId: NodeJS.Timeout) {
  console.log(`[Health Check] Stopping scheduler`);
  clearInterval(intervalId);
}
