import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
// Email sending handled via notifyOwner API

/**
 * Contact Center Alert Escalation System
 * Monitors service health and sends Teams/email notifications on degradation
 */

interface ServiceAlert {
  service: string;
  status: "healthy" | "degraded" | "error";
  previousStatus?: "healthy" | "degraded" | "error";
  message: string;
  timestamp: Date;
  escalated: boolean;
}

// Track service status to detect transitions
const serviceStatusCache: Record<string, { status: string; lastChecked: Date }> = {
  d365: { status: 'unknown', lastChecked: new Date() },
  teams: { status: 'unknown', lastChecked: new Date() },
  acs: { status: 'unknown', lastChecked: new Date() },
  copilot: { status: 'unknown', lastChecked: new Date() },
};

export const contactCenterAlertsRouter = router({
  /**
   * Check service health and escalate if degraded
   */
  checkAndEscalate: protectedProcedure
    .input(z.object({
      service: z.enum(['d365', 'teams', 'acs', 'copilot']),
      currentStatus: z.enum(['healthy', 'degraded', 'error']),
      message: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { service, currentStatus, message } = input;
      const previousStatus = serviceStatusCache[service]?.status || 'unknown';

      // Update cache
      serviceStatusCache[service] = {
        status: currentStatus,
        lastChecked: new Date(),
      };

      // Detect status transition (healthy → degraded/error)
      const isTransition = previousStatus === 'healthy' && (currentStatus === 'degraded' || currentStatus === 'error');

      if (!isTransition) {
        return { escalated: false, reason: 'No status transition detected' };
      }

      // Escalate to admin
      const escalationTitle = `⚠️ Contact Center Alert: ${service.toUpperCase()} Service ${currentStatus === 'error' ? 'DOWN' : 'DEGRADED'}`;
      const escalationMessage = `
**Service:** ${service.toUpperCase()}
**Status:** ${currentStatus.toUpperCase()}
**Previous Status:** ${previousStatus}
**Message:** ${message}
**Timestamp:** ${new Date().toISOString()}

**Action Required:**
1. Check ${service} service status dashboard
2. Verify integration credentials and connectivity
3. If issue persists, contact ${service} support

**Contact Center Impact:**
- Tickets may not route correctly
- Agent status updates may be delayed
- Customer communications may be affected
      `.trim();

      try {
        // Send to admin via Manus notification API
        await notifyOwner({
          title: escalationTitle,
          content: escalationMessage,
        });

        // Email notification sent via notifyOwner API above

        return {
          escalated: true,
          reason: `Service transitioned from ${previousStatus} to ${currentStatus}`,
          alert: {
            service,
            currentStatus,
            previousStatus,
            message,
            timestamp: new Date(),
          },
        };
      } catch (error) {
        // Escalation failed but log it
        return {
          escalated: false,
          reason: `Failed to escalate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }),

  /**
   * Get current service status and alert history
   */
  getServiceStatus: publicProcedure
    .query(() => {
      return {
        services: Object.entries(serviceStatusCache).map(([service, data]) => ({
          service,
          status: data.status,
          lastChecked: data.lastChecked,
        })),
        lastUpdated: new Date(),
      };
    }),

  /**
   * Reset service status cache (for testing)
   */
  resetStatusCache: protectedProcedure
    .mutation(() => {
      Object.keys(serviceStatusCache).forEach(service => {
        serviceStatusCache[service] = { status: 'unknown', lastChecked: new Date() };
      });
      return { reset: true, timestamp: new Date() };
    }),

  /**
   * Batch check all services and escalate if needed
   */
  batchCheckServices: protectedProcedure
    .input(z.object({
      services: z.array(z.object({
        name: z.enum(['d365', 'teams', 'acs', 'copilot']),
        status: z.enum(['healthy', 'degraded', 'error']),
        message: z.string(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const results = [];

      for (const service of input.services) {
        const previousStatus = serviceStatusCache[service.name]?.status || 'unknown';
        const isTransition = previousStatus === 'healthy' && (service.status === 'degraded' || service.status === 'error');

        // Update cache
        serviceStatusCache[service.name] = {
          status: service.status,
          lastChecked: new Date(),
        };

        if (isTransition) {
          try {
            const title = `⚠️ Contact Center: ${service.name.toUpperCase()} ${service.status === 'error' ? 'DOWN' : 'DEGRADED'}`;
            await notifyOwner({
              title,
              content: `${service.name.toUpperCase()}: ${service.message}`,
            });
            results.push({ service: service.name, escalated: true });
          } catch (error) {
            results.push({ service: service.name, escalated: false, error: String(error) });
          }
        } else {
          results.push({ service: service.name, escalated: false, reason: 'No transition' });
        }
      }

      return {
        timestamp: new Date(),
        escalations: results,
        totalEscalated: results.filter(r => r.escalated).length,
      };
    }),
});
