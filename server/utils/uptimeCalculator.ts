/**
 * Uptime Calculation Utilities
 * 
 * Calculates uptime percentages and statistics from health check history
 */

import { getDb } from "../db";
import { healthCheckHistory, uptimeStatistics } from "../../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export type UptimePeriod = "1h" | "24h" | "7d" | "30d";

/**
 * Get time range for uptime period
 */
function getTimeRange(period: UptimePeriod): Date {
  const now = new Date();
  switch (period) {
    case "1h":
      return new Date(now.getTime() - 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Calculate uptime statistics for a service
 */
export async function calculateUptimeStats(
  service: string,
  period: UptimePeriod
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const startTime = getTimeRange(period);

  // Fetch all health checks in the period
  const checks = await db
    .select()
    .from(healthCheckHistory)
    .where(
      and(
        eq(healthCheckHistory.service, service),
        gte(healthCheckHistory.checkedAt, startTime)
      )
    );

  if (checks.length === 0) {
    return {
      uptimePercentage: 100,
      totalChecks: 0,
      healthyChecks: 0,
      degradedChecks: 0,
      criticalChecks: 0,
      offlineChecks: 0,
      avgResponseTime: 0,
    };
  }

  // Count statuses
  const healthyChecks = checks.filter((c) => c.status === "healthy").length;
  const degradedChecks = checks.filter((c) => c.status === "degraded").length;
  const criticalChecks = checks.filter((c) => c.status === "critical").length;
  const offlineChecks = checks.filter((c) => c.status === "offline").length;

  // Calculate uptime percentage (healthy + degraded / total)
  const uptimeChecks = healthyChecks + degradedChecks;
  const uptimePercentage = (uptimeChecks / checks.length) * 100;

  // Calculate average response time
  const avgResponseTime =
    checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length;

  return {
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    totalChecks: checks.length,
    healthyChecks,
    degradedChecks,
    criticalChecks,
    offlineChecks,
    avgResponseTime: Math.round(avgResponseTime),
  };
}

/**
 * Store health check result in history
 */
export async function storeHealthCheck(
  service: string,
  status: "healthy" | "degraded" | "critical" | "offline",
  responseTime: number,
  message?: string,
  metrics?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db.insert(healthCheckHistory).values({
    service,
    status,
    responseTime,
    message,
    metrics,
    checkedAt: new Date(),
    createdAt: new Date(),
  });
}

/**
 * Update uptime statistics for a service
 */
export async function updateUptimeStatistics(
  service: string,
  period: UptimePeriod
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const stats = await calculateUptimeStats(service, period);

  // Delete existing record for this service and period
  await db
    .delete(uptimeStatistics)
    .where(
      and(
        eq(uptimeStatistics.service, service),
        eq(uptimeStatistics.period, period)
      )
    );

  // Insert new record
  await db.insert(uptimeStatistics).values({
    service,
    period,
    uptimePercentage: stats.uptimePercentage.toString() as any,
    totalChecks: stats.totalChecks,
    healthyChecks: stats.healthyChecks,
    degradedChecks: stats.degradedChecks,
    criticalChecks: stats.criticalChecks,
    offlineChecks: stats.offlineChecks,
    avgResponseTime: stats.avgResponseTime,
    calculatedAt: new Date(),
  });

  return stats;
}

/**
 * Get uptime statistics for a service
 */
export async function getUptimeStats(
  service: string,
  period: UptimePeriod
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const record = await db
    .select()
    .from(uptimeStatistics)
    .where(
      and(
        eq(uptimeStatistics.service, service),
        eq(uptimeStatistics.period, period)
      )
    )
    .orderBy(sql`${uptimeStatistics.calculatedAt} DESC`)
    .limit(1);

  if (record.length === 0) {
    // Calculate on-the-fly if not cached
    return calculateUptimeStats(service, period);
  }

  return {
    uptimePercentage: parseFloat(record[0].uptimePercentage as any),
    totalChecks: record[0].totalChecks,
    healthyChecks: record[0].healthyChecks,
    degradedChecks: record[0].degradedChecks,
    criticalChecks: record[0].criticalChecks,
    offlineChecks: record[0].offlineChecks,
    avgResponseTime: record[0].avgResponseTime || 0,
  };
}

/**
 * Get uptime trend data for charting (7 days)
 */
export async function getUptimeTrendData(service: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get hourly uptime data for the last 7 days
  const checks = await db
    .select()
    .from(healthCheckHistory)
    .where(
      and(
        eq(healthCheckHistory.service, service),
        gte(healthCheckHistory.checkedAt, sevenDaysAgo)
      )
    )
    .orderBy(healthCheckHistory.checkedAt);

  // Group by hour and calculate uptime
  const hourlyData: Record<string, { healthy: number; total: number }> = {};

  checks.forEach((check) => {
    const hour = new Date(check.checkedAt);
    hour.setMinutes(0, 0, 0);
    const key = hour.toISOString();

    if (!hourlyData[key]) {
      hourlyData[key] = { healthy: 0, total: 0 };
    }

    hourlyData[key].total++;
    if (check.status === "healthy" || check.status === "degraded") {
      hourlyData[key].healthy++;
    }
  });

  // Convert to array format for charting
  const trendData = Object.entries(hourlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, data]) => ({
      timestamp,
      uptimePercentage: (data.healthy / data.total) * 100,
      checksCount: data.total,
    }));

  return trendData;
}

/**
 * Clean up old health check records (older than 90 days)
 */
export async function cleanupOldHealthChecks() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const result = await db
    .delete(healthCheckHistory)
    .where(gte(healthCheckHistory.createdAt, ninetyDaysAgo));

  return result;
}
