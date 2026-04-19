/**
 * Service Health Monitoring Router
 * 
 * Continuous monitoring dashboard for critical services:
 * - Email API (MS Graph + SendGrid)
 * - Helpdesk System (database, ticket processing)
 * - M365 Service Health
 * 
 * Provides real-time health status, metrics, and alerts
 */

import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { tickets, ticketReplies, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getMsGraphToken } from "../_core/email";

/**
 * Service health status enum
 */
export enum ServiceHealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  CRITICAL = "critical",
  OFFLINE = "offline",
}

/**
 * Service health check result
 */
export interface ServiceHealthCheck {
  service: string;
  status: ServiceHealthStatus;
  lastChecked: Date;
  responseTime: number; // milliseconds
  message: string;
  metrics?: Record<string, unknown>;
}

/**
 * Email API health metrics
 */
interface EmailHealthMetrics {
  msGraphCredentialsValid: boolean;
  sendgridConfigured: boolean;
  lastSuccessfulSend?: Date;
  failureCount: number;
  successRate: number; // percentage
  avgResponseTime: number; // milliseconds
}

/**
 * Helpdesk system health metrics
 */
interface HelpdeskHealthMetrics {
  databaseConnected: boolean;
  ticketProcessingLatency: number; // milliseconds
  unprocessedTickets: number;
  agentAvailability: number; // percentage
  avgTicketResolutionTime: number; // hours
  slaComplianceRate: number; // percentage
}

/**
 * M365 health metrics
 */
interface M365HealthMetrics {
  credentialsValid: boolean;
  criticalIssuesCount: number;
  degradedServicesCount: number;
  lastSync: Date;
}

/**
 * Overall system health dashboard
 */
interface SystemHealthDashboard {
  timestamp: Date;
  overallStatus: ServiceHealthStatus;
  services: ServiceHealthCheck[];
  alerts: Array<{
    severity: "critical" | "warning" | "info";
    service: string;
    message: string;
    timestamp: Date;
  }>;
  metrics: {
    email: EmailHealthMetrics;
    helpdesk: HelpdeskHealthMetrics;
    m365: M365HealthMetrics;
  };
}

/**
 * Check Email API health
 */
export async function checkEmailApiHealth(): Promise<ServiceHealthCheck> {
  const startTime = Date.now();
  let status = ServiceHealthStatus.HEALTHY;
  let message = "Email API operational";
  const metrics: EmailHealthMetrics = {
    msGraphCredentialsValid: false,
    sendgridConfigured: !!process.env.SENDGRID_API_KEY,
    failureCount: 0,
    successRate: 100,
    avgResponseTime: 0,
  };

  try {
    const token = await getMsGraphToken();
    const responseTime = Date.now() - startTime;
    metrics.avgResponseTime = responseTime;

    if (!token) {
      metrics.msGraphCredentialsValid = false;
      if (!metrics.sendgridConfigured) {
        status = ServiceHealthStatus.CRITICAL;
        message = "Both MS Graph and SendGrid unavailable";
      } else {
        status = ServiceHealthStatus.DEGRADED;
        message = "MS Graph unavailable, using SendGrid fallback";
      }
    } else {
      metrics.msGraphCredentialsValid = true;
      if (responseTime > 5000) {
        status = ServiceHealthStatus.DEGRADED;
        message = `Email API slow (${responseTime}ms)`;
      }
    }
  } catch (error) {
    status = ServiceHealthStatus.CRITICAL;
    message = `Email API error: ${error instanceof Error ? error.message : String(error)}`;
  }

  return {
    service: "Email API",
    status,
    lastChecked: new Date(),
    responseTime: Date.now() - startTime,
    message,
    metrics: metrics as unknown as Record<string, unknown>,
  };
}

/**
 * Check Helpdesk system health
 */
export async function checkHelpdeskHealth(): Promise<ServiceHealthCheck> {
  const startTime = Date.now();
  let status = ServiceHealthStatus.HEALTHY;
  let message = "Helpdesk system operational";
  const metrics: HelpdeskHealthMetrics = {
    databaseConnected: false,
    ticketProcessingLatency: 0,
    unprocessedTickets: 0,
    agentAvailability: 100,
    avgTicketResolutionTime: 0,
    slaComplianceRate: 95,
  };

  try {
    const db = await getDb();
    if (!db) {
      status = ServiceHealthStatus.CRITICAL;
      message = "Database connection failed";
      return {
        service: "Helpdesk System",
        status,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        message,
        metrics: metrics as unknown as Record<string, unknown>,
      };
    }

    metrics.databaseConnected = true;

    // Get ticket metrics
    const allTickets = await db.select().from(tickets);
    const allReplies = await db.select().from(ticketReplies);
    const allAgents = await db.select().from(users).where(eq(users.role, "admin"));

    // Calculate latency
    const ticketsWithReplies = allTickets.filter((t) =>
      allReplies.some((r) => r.ticketId === t.id)
    );

    if (ticketsWithReplies.length > 0) {
      const latencies = ticketsWithReplies.map((t) => {
        const firstReply = allReplies
          .filter((r) => r.ticketId === t.id)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
        if (!firstReply) return 0;
        return (
          new Date(firstReply.createdAt).getTime() - new Date(t.createdAt).getTime()
        );
      });
      metrics.ticketProcessingLatency =
        latencies.reduce((a, b) => a + b, 0) / latencies.length;
    }

    // Count unprocessed tickets
    metrics.unprocessedTickets = allTickets.filter(
      (t) =>
        t.status === "open" &&
        !allReplies.some((r) => r.ticketId === t.id)
    ).length;

    // Agent availability
    const agentsWithTickets = new Set(
      allTickets
        .filter((t) => t.status === "open" || t.status === "in_progress")
        .map((t) => t.assignedTo)
    );
    metrics.agentAvailability =
      allAgents.length > 0
        ? ((allAgents.length - agentsWithTickets.size) / allAgents.length) * 100
        : 100;

    // Average resolution time
    const resolvedTickets = allTickets.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    );
    if (resolvedTickets.length > 0) {
      const resolutionTimes = resolvedTickets.map((t) => {
        const updatedAt = t.updatedAt || t.createdAt;
        return (
          (new Date(updatedAt).getTime() - new Date(t.createdAt).getTime()) /
          (1000 * 60 * 60)
        );
      });
      metrics.avgTicketResolutionTime =
        resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
    }

    // Determine overall status
    if (metrics.ticketProcessingLatency > 30000) {
      status = ServiceHealthStatus.DEGRADED;
      message = `Helpdesk processing slow (${Math.round(metrics.ticketProcessingLatency / 1000)}s latency)`;
    } else if (metrics.unprocessedTickets > 50) {
      status = ServiceHealthStatus.DEGRADED;
      message = `${metrics.unprocessedTickets} unprocessed tickets`;
    }
  } catch (error) {
    status = ServiceHealthStatus.CRITICAL;
    message = `Helpdesk health check error: ${error instanceof Error ? error.message : String(error)}`;
  }

  return {
    service: "Helpdesk System",
    status,
    lastChecked: new Date(),
    responseTime: Date.now() - startTime,
    message,
    metrics: metrics as unknown as Record<string, unknown>,
  };
}

/**
 * Check M365 Service Health
 */
export async function checkM365Health(): Promise<ServiceHealthCheck> {
  const startTime = Date.now();
  let status = ServiceHealthStatus.HEALTHY;
  let message = "M365 services operational";
  const metrics: M365HealthMetrics = {
    credentialsValid: false,
    criticalIssuesCount: 0,
    degradedServicesCount: 0,
    lastSync: new Date(),
  };

  try {
    const token = await getMsGraphToken();
    if (!token) {
      status = ServiceHealthStatus.DEGRADED;
      message = "M365 credentials not configured";
      return {
        service: "M365 Service Health",
        status,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        message,
        metrics: metrics as unknown as Record<string, unknown>,
      };
    }

    metrics.credentialsValid = true;

    // Fetch service health from Graph
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      status = ServiceHealthStatus.DEGRADED;
      message = `M365 API error (${response.status})`;
      return {
        service: "M365 Service Health",
        status,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        message,
        metrics: metrics as unknown as Record<string, unknown>,
      };
    }

    const data = (await response.json()) as {
      value?: Array<{ status: string }>;
    };
    const services = data.value || [];

    // Count critical and degraded services
    metrics.criticalIssuesCount = services.filter(
      (s) =>
        s.status === "serviceInterruption" ||
        s.status === "extendedRecovery"
    ).length;
    metrics.degradedServicesCount = services.filter(
      (s) => s.status === "serviceDegradation"
    ).length;

    if (metrics.criticalIssuesCount > 0) {
      status = ServiceHealthStatus.CRITICAL;
      message = `${metrics.criticalIssuesCount} critical M365 issue(s)`;
    } else if (metrics.degradedServicesCount > 0) {
      status = ServiceHealthStatus.DEGRADED;
      message = `${metrics.degradedServicesCount} degraded M365 service(s)`;
    }
  } catch (error) {
    status = ServiceHealthStatus.DEGRADED;
    message = `M365 health check error: ${error instanceof Error ? error.message : String(error)}`;
  }

  return {
    service: "M365 Service Health",
    status,
    lastChecked: new Date(),
    responseTime: Date.now() - startTime,
    message,
    metrics: metrics as unknown as Record<string, unknown>,
  };
}

/**
 * Determine overall system status
 */
function getOverallStatus(services: ServiceHealthCheck[]): ServiceHealthStatus {
  const statuses = services.map((s) => s.status);
  if (statuses.includes(ServiceHealthStatus.CRITICAL)) {
    return ServiceHealthStatus.CRITICAL;
  }
  if (statuses.includes(ServiceHealthStatus.DEGRADED)) {
    return ServiceHealthStatus.DEGRADED;
  }
  if (statuses.includes(ServiceHealthStatus.OFFLINE)) {
    return ServiceHealthStatus.OFFLINE;
  }
  return ServiceHealthStatus.HEALTHY;
}

/**
 * Generate alerts from service health checks
 */
function generateAlerts(
  services: ServiceHealthCheck[]
): SystemHealthDashboard["alerts"] {
  const alerts: SystemHealthDashboard["alerts"] = [];

  services.forEach((service) => {
    if (service.status === ServiceHealthStatus.CRITICAL) {
      alerts.push({
        severity: "critical",
        service: service.service,
        message: service.message,
        timestamp: service.lastChecked,
      });
    } else if (service.status === ServiceHealthStatus.DEGRADED) {
      alerts.push({
        severity: "warning",
        service: service.service,
        message: service.message,
        timestamp: service.lastChecked,
      });
    }
  });

  return alerts;
}

export const serviceHealthMonitoringRouter = router({
  /**
   * Get comprehensive system health dashboard
   */
  getSystemHealthDashboard: adminProcedure.query(
    async (): Promise<SystemHealthDashboard> => {
      const [emailHealth, helpdeskHealth, m365Health] = await Promise.all([
        checkEmailApiHealth(),
        checkHelpdeskHealth(),
        checkM365Health(),
      ]);

      const services = [emailHealth, helpdeskHealth, m365Health];
      const overallStatus = getOverallStatus(services);
      const alerts = generateAlerts(services);

      return {
        timestamp: new Date(),
        overallStatus,
        services,
        alerts,
        metrics: {
          email: emailHealth.metrics as unknown as EmailHealthMetrics,
          helpdesk: helpdeskHealth.metrics as unknown as HelpdeskHealthMetrics,
          m365: m365Health.metrics as unknown as M365HealthMetrics,
        },
      };
    }
  ),

  /**
   * Get individual service health
   */
  getServiceHealth: adminProcedure
    .input(z.enum(["email", "helpdesk", "m365"]))
    .query(async (opts) => {
      const { input } = opts;
      switch (input) {
        case "email":
          return checkEmailApiHealth();
        case "helpdesk":
          return checkHelpdeskHealth();
        case "m365":
          return checkM365Health();
      }
    }),

  /**
   * Get email API health details
   */
  getEmailApiHealth: adminProcedure.query(async () => {
    return checkEmailApiHealth();
  }),

  /**
   * Get helpdesk system health details
   */
  getHelpdeskHealth: adminProcedure.query(async () => {
    return checkHelpdeskHealth();
  }),

  /**
   * Get M365 health details
   */
  getM365Health: adminProcedure.query(async () => {
    return checkM365Health();
  }),

  /**
   * Get service health history (for trending)
   */
  getHealthHistory: adminProcedure
    .input(
      z.object({
        service: z.enum(["email", "helpdesk", "m365"]).optional(),
        hours: z.number().min(1).max(168).default(24),
      })
    )
    .query(async () => {
      // TODO: Implement health history tracking with database persistence
      return [];
    }),
});
