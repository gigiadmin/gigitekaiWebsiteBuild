import { mysqlTable, varchar, timestamp, int, text, boolean, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

/**
 * Webhook Monitoring Schema
 * 
 * Tracks webhook health, failures, and alert history
 * Enables intelligent alerting without email spam
 */

// Track each webhook endpoint
export const webhookEndpoints = mysqlTable('webhook_endpoints', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Teams Help Desk"
  url: text('url').notNull(), // Full webhook URL
  type: varchar('type', { length: 50 }).notNull(), // 'teams', 'slack', 'custom'
  isActive: int('is_active').default(1), // 1 = active, 0 = disabled
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Track each health check attempt
export const webhookHealthChecks = mysqlTable('webhook_health_checks', {
  id: int('id').primaryKey().autoincrement(),
  webhookId: int('webhook_id').notNull().references(() => webhookEndpoints.id),
  httpStatus: int('http_status'), // e.g., 200, 202, 400, 500
  responseTime: int('response_time'), // milliseconds
  isSuccess: int('is_success').notNull(), // 1 = success, 0 = failure
  errorMessage: text('error_message'), // Error details if failed
  checkTimestamp: timestamp('check_timestamp').defaultNow(),
});

// Track failure patterns and alert state
export const webhookAlertState = mysqlTable('webhook_alert_state', {
  id: int('id').primaryKey().autoincrement(),
  webhookId: int('webhook_id').notNull().references(() => webhookEndpoints.id),
  
  // Failure tracking
  consecutiveFailures: int('consecutive_failures').default(0),
  lastFailureTime: timestamp('last_failure_time'),
  lastSuccessTime: timestamp('last_success_time'),
  
  // Alert state
  alertStatus: varchar('alert_status', { length: 50 }).default('healthy'), // 'healthy', 'degraded', 'critical'
  lastAlertSentAt: timestamp('last_alert_sent_at'), // Prevent spam
  alertThreshold: int('alert_threshold').default(3), // Alert after N consecutive failures
  
  // Recovery tracking
  recoveryNotifiedAt: timestamp('recovery_notified_at'), // When we notified about recovery
  
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Track alert history
export const webhookAlerts = mysqlTable('webhook_alerts', {
  id: int('id').primaryKey().autoincrement(),
  webhookId: int('webhook_id').notNull().references(() => webhookEndpoints.id),
  
  alertType: varchar('alert_type', { length: 50 }).notNull(), // 'failure', 'recovery', 'degradation'
  severity: varchar('severity', { length: 50 }).notNull(), // 'warning', 'critical'
  
  message: text('message').notNull(),
  details: text('details'), // JSON with additional context
  
  notificationSent: int('notification_sent').default(0), // 1 = sent, 0 = pending
  notificationSentAt: timestamp('notification_sent_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Webhook statistics (aggregated)
export const webhookStats = mysqlTable('webhook_stats', {
  id: int('id').primaryKey().autoincrement(),
  webhookId: int('webhook_id').notNull().references(() => webhookEndpoints.id),
  
  // Daily stats
  statsDate: varchar('stats_date', { length: 10 }).notNull(), // YYYY-MM-DD
  
  totalChecks: int('total_checks').default(0),
  successCount: int('success_count').default(0),
  failureCount: int('failure_count').default(0),
  
  avgResponseTime: decimal('avg_response_time', { precision: 10, scale: 2 }), // milliseconds
  uptime: decimal('uptime', { precision: 5, scale: 2 }), // percentage
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const webhookEndpointsRelations = relations(webhookEndpoints, ({ many }) => ({
  healthChecks: many(webhookHealthChecks),
  alertState: many(webhookAlertState),
  alerts: many(webhookAlerts),
  stats: many(webhookStats),
}));

export const webhookHealthChecksRelations = relations(webhookHealthChecks, ({ one }) => ({
  endpoint: one(webhookEndpoints, {
    fields: [webhookHealthChecks.webhookId],
    references: [webhookEndpoints.id],
  }),
}));

export const webhookAlertStateRelations = relations(webhookAlertState, ({ one }) => ({
  endpoint: one(webhookEndpoints, {
    fields: [webhookAlertState.webhookId],
    references: [webhookEndpoints.id],
  }),
}));

export const webhookAlertsRelations = relations(webhookAlerts, ({ one }) => ({
  endpoint: one(webhookEndpoints, {
    fields: [webhookAlerts.webhookId],
    references: [webhookEndpoints.id],
  }),
}));

export const webhookStatsRelations = relations(webhookStats, ({ one }) => ({
  endpoint: one(webhookEndpoints, {
    fields: [webhookStats.webhookId],
    references: [webhookEndpoints.id],
  }),
}));

// Type exports
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type InsertWebhookEndpoint = typeof webhookEndpoints.$inferInsert;

export type WebhookHealthCheck = typeof webhookHealthChecks.$inferSelect;
export type InsertWebhookHealthCheck = typeof webhookHealthChecks.$inferInsert;

export type WebhookAlertState = typeof webhookAlertState.$inferSelect;
export type InsertWebhookAlertState = typeof webhookAlertState.$inferInsert;

export type WebhookAlert = typeof webhookAlerts.$inferSelect;
export type InsertWebhookAlert = typeof webhookAlerts.$inferInsert;

export type WebhookStats = typeof webhookStats.$inferSelect;
export type InsertWebhookStats = typeof webhookStats.$inferInsert;
