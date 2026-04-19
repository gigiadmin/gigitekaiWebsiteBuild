/**
 * Health Check Scheduler
 * Runs periodic health checks for critical services
 */

import { checkEmailApiHealth, checkHelpdeskHealth, checkM365Health, ServiceHealthStatus } from "../routers/service-health-monitoring";
import { notifyOwner } from "../_core/notification";

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

  if (
    (previousSt === ServiceHealthStatus.HEALTHY || previousSt === ServiceHealthStatus.DEGRADED) &&
    (newStatus === ServiceHealthStatus.CRITICAL || newStatus === ServiceHealthStatus.OFFLINE)
  ) {
    console.error(`[Health Alert] CRITICAL: ${service} is ${newStatus}`);

    try {
      await notifyOwner({
        title: `🚨 CRITICAL: ${service} Status Alert`,
        content: `Service: ${service}\nStatus: ${newStatus}\nMessage: ${message}\n\nTime: ${new Date().toISOString()}`,
      });
    } catch (error) {
      console.error(`[Health Alert] Failed to send notification:`, error);
    }
  }

  if (
    (previousSt === ServiceHealthStatus.CRITICAL || previousSt === ServiceHealthStatus.OFFLINE) &&
    newStatus === ServiceHealthStatus.HEALTHY
  ) {
    console.log(`[Health Alert] ✅ RECOVERED: ${service}`);

    try {
      await notifyOwner({
        title: `✅ RECOVERED: ${service} Status`,
        content: `Service: ${service}\nStatus: ${newStatus}\nMessage: ${message}\n\nTime: ${new Date().toISOString()}`,
      });
    } catch (error) {
      console.error(`[Health Alert] Failed to send recovery notification:`, error);
    }
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
