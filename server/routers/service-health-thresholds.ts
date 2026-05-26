/**
 * Service Health Thresholds & Uptime Router
 * 
 * Manages alert thresholds and uptime statistics
 */

import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getAlertThreshold, getAllAlertThresholds, updateAlertThreshold, initializeDefaultThresholds } from "../utils/alertThresholds";
import { getUptimeStats, getUptimeTrendData, calculateUptimeStats } from "../utils/uptimeCalculator";

export const serviceHealthThresholdsRouter = router({
  /**
   * Get alert threshold for a service
   */
  getAlertThreshold: adminProcedure
    .input(z.string())
    .query(async (opts) => {
      const threshold = await getAlertThreshold(opts.input);
      return threshold || null;
    }),

  /**
   * Get all alert thresholds
   */
  getAllAlertThresholds: adminProcedure.query(async () => {
    return getAllAlertThresholds();
  }),

  /**
   * Update alert threshold for a service
   */
  updateAlertThreshold: adminProcedure
    .input(
      z.object({
        service: z.string(),
        responseTimeThreshold: z.number().min(100).max(60000).optional(),
        errorRateThreshold: z.number().min(0).max(100).optional(),
        unprocessedTicketsThreshold: z.number().min(0).optional(),
        agentAvailabilityThreshold: z.number().min(0).max(100).optional(),
        slaComplianceThreshold: z.number().min(0).max(100).optional(),
        enabled: z.boolean().optional(),
        notifyOnDegraded: z.boolean().optional(),
        notifyOnCritical: z.boolean().optional(),
        notifyOnRecovery: z.boolean().optional(),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      const userId = ctx.user?.id || 0;
      const mapped = {
        ...input,
        ...(input.enabled !== undefined && { enabled: input.enabled ? 1 : 0 }),
        ...(input.notifyOnDegraded !== undefined && { notifyOnDegraded: input.notifyOnDegraded ? 1 : 0 }),
        ...(input.notifyOnCritical !== undefined && { notifyOnCritical: input.notifyOnCritical ? 1 : 0 }),
        ...(input.notifyOnRecovery !== undefined && { notifyOnRecovery: input.notifyOnRecovery ? 1 : 0 }),
      };
      return updateAlertThreshold(input.service, mapped as any, userId);
    }),

  /**
   * Initialize default thresholds for all services
   */
  initializeDefaultThresholds: adminProcedure.mutation(async () => {
    await initializeDefaultThresholds();
    return getAllAlertThresholds();
  }),

  /**
   * Get uptime statistics for a service
   */
  getUptimeStats: adminProcedure
    .input(
      z.object({
        service: z.string(),
        period: z.enum(["1h", "24h", "7d", "30d"]),
      })
    )
    .query(async (opts) => {
      const { service, period } = opts.input;
      return getUptimeStats(service, period);
    }),

  /**
   * Get uptime trend data for charting (7 days)
   */
  getUptimeTrendData: adminProcedure
    .input(z.string())
    .query(async (opts) => {
      return getUptimeTrendData(opts.input);
    }),

  /**
   * Get uptime statistics for all services and periods
   */
  getAllUptimeStats: adminProcedure.query(async () => {
    const services = [
      "Email API",
      "Helpdesk System",
      "M365 Service Health",
    ];
    const periods: Array<"1h" | "24h" | "7d" | "30d"> = ["1h", "24h", "7d", "30d"];

    const stats: Record<string, Record<string, any>> = {};

    for (const service of services) {
      stats[service] = {};
      for (const period of periods) {
        try {
          stats[service][period] = await getUptimeStats(service, period);
        } catch (error) {
          console.error(`Error getting uptime stats for ${service} (${period}):`, error);
          stats[service][period] = null;
        }
      }
    }

    return stats;
  }),

  /**
   * Get all uptime trend data
   */
  getAllUptimeTrendData: adminProcedure.query(async () => {
    const services = [
      "Email API",
      "Helpdesk System",
      "M365 Service Health",
    ];

    const trends: Record<string, any> = {};

    for (const service of services) {
      try {
        trends[service] = await getUptimeTrendData(service);
      } catch (error) {
        console.error(`Error getting trend data for ${service}:`, error);
        trends[service] = [];
      }
    }

    return trends;
  }),
});
