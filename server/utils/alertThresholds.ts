/**
 * Alert Thresholds Management
 * 
 * Manages configurable alert thresholds for each service
 */

import { getDb } from "../db";
import { alertThresholds } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface AlertThresholdConfig {
  service: string;
  responseTimeThreshold: number;
  errorRateThreshold: number;
  unprocessedTicketsThreshold?: number;
  agentAvailabilityThreshold?: number;
  slaComplianceThreshold?: number;
  enabled: boolean;
  notifyOnDegraded: boolean;
  notifyOnCritical: boolean;
  notifyOnRecovery: boolean;
}

/**
 * Get alert thresholds for a service
 */
export async function getAlertThreshold(
  service: string
): Promise<AlertThresholdConfig | null> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(alertThresholds)
    .where(eq(alertThresholds.service, service));

  if (result.length === 0) {
    return null;
  }

  const t = result[0];
  return {
    service: t.service,
    responseTimeThreshold: t.responseTimeThreshold,
    errorRateThreshold: t.errorRateThreshold,
    unprocessedTicketsThreshold: t.unprocessedTicketsThreshold || undefined,
    agentAvailabilityThreshold: t.agentAvailabilityThreshold || undefined,
    slaComplianceThreshold: t.slaComplianceThreshold || undefined,
    enabled: t.enabled,
    notifyOnDegraded: t.notifyOnDegraded,
    notifyOnCritical: t.notifyOnCritical,
    notifyOnRecovery: t.notifyOnRecovery,
  };
}

/**
 * Get all alert thresholds
 */
export async function getAllAlertThresholds(): Promise<AlertThresholdConfig[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const results = await db.select().from(alertThresholds);

  return results.map((t) => ({
    service: t.service,
    responseTimeThreshold: t.responseTimeThreshold,
    errorRateThreshold: t.errorRateThreshold,
    unprocessedTicketsThreshold: t.unprocessedTicketsThreshold || undefined,
    agentAvailabilityThreshold: t.agentAvailabilityThreshold || undefined,
    slaComplianceThreshold: t.slaComplianceThreshold || undefined,
    enabled: t.enabled,
    notifyOnDegraded: t.notifyOnDegraded,
    notifyOnCritical: t.notifyOnCritical,
    notifyOnRecovery: t.notifyOnRecovery,
  }));
}

/**
 * Update alert thresholds for a service
 */
export async function updateAlertThreshold(
  service: string,
  config: Partial<AlertThresholdConfig>,
  updatedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if threshold exists
  const existing = await db
    .select()
    .from(alertThresholds)
    .where(eq(alertThresholds.service, service));

  if (existing.length === 0) {
    // Create new threshold
    await db.insert(alertThresholds).values({
      service,
      responseTimeThreshold: config.responseTimeThreshold || 5000,
      errorRateThreshold: config.errorRateThreshold || 10,
      unprocessedTicketsThreshold:
        config.unprocessedTicketsThreshold || undefined,
      agentAvailabilityThreshold:
        config.agentAvailabilityThreshold || undefined,
      slaComplianceThreshold: config.slaComplianceThreshold || undefined,
      enabled: config.enabled !== false,
      notifyOnDegraded: config.notifyOnDegraded !== false,
      notifyOnCritical: config.notifyOnCritical !== false,
      notifyOnRecovery: config.notifyOnRecovery !== false,
      updatedBy,
      updatedAt: new Date(),
      createdAt: new Date(),
    });
  } else {
    // Update existing threshold
    await db
      .update(alertThresholds)
      .set({
        responseTimeThreshold:
          config.responseTimeThreshold ||
          existing[0].responseTimeThreshold,
        errorRateThreshold:
          config.errorRateThreshold || existing[0].errorRateThreshold,
        unprocessedTicketsThreshold:
          config.unprocessedTicketsThreshold !==
          undefined
            ? config.unprocessedTicketsThreshold
            : existing[0].unprocessedTicketsThreshold,
        agentAvailabilityThreshold:
          config.agentAvailabilityThreshold !== undefined
            ? config.agentAvailabilityThreshold
            : existing[0].agentAvailabilityThreshold,
        slaComplianceThreshold:
          config.slaComplianceThreshold !== undefined
            ? config.slaComplianceThreshold
            : existing[0].slaComplianceThreshold,
        enabled:
          config.enabled !== undefined ? config.enabled : existing[0].enabled,
        notifyOnDegraded:
          config.notifyOnDegraded !== undefined
            ? config.notifyOnDegraded
            : existing[0].notifyOnDegraded,
        notifyOnCritical: (
          config.notifyOnCritical !== undefined
            ? config.notifyOnCritical
            : existing[0].notifyOnCritical
        ) as any,
        notifyOnRecovery: (
          config.notifyOnRecovery !== undefined
            ? config.notifyOnRecovery
            : existing[0].notifyOnRecovery
        ) as any,
        updatedBy,
        updatedAt: new Date().toISOString() as any,
      })
      .where(eq(alertThresholds.service, service));
  }

  return getAlertThreshold(service);
}

/**
 * Check if a metric exceeds threshold
 */
export function shouldAlert(
  metric: number,
  threshold: number,
  isLowerBetter: boolean = false
): boolean {
  if (isLowerBetter) {
    return metric < threshold;
  }
  return metric > threshold;
}

/**
 * Initialize default thresholds for all services
 */
export async function initializeDefaultThresholds() {
  const services = [
    "Email API",
    "Helpdesk System",
    "M365 Service Health",
  ];

  for (const service of services) {
    const existing = await getAlertThreshold(service);
    if (!existing) {
      await updateAlertThreshold(
        service,
        {
          responseTimeThreshold: 5000,
          errorRateThreshold: 10,
          unprocessedTicketsThreshold: 50,
          agentAvailabilityThreshold: 50,
          slaComplianceThreshold: 90,
          enabled: true,
          notifyOnDegraded: true,
          notifyOnCritical: true,
          notifyOnRecovery: true,
        },
        0 // System initialization
      );
    }
  }
}
