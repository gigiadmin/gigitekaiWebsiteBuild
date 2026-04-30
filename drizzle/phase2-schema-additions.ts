/**
 * Phase 2 Schema Additions
 * Dynamics 365 Contact Center Integration
 * 
 * New tables for:
 * - Call recording metadata
 * - Call transcripts
 * - Agent queues
 * - Call routing rules
 * - Call analytics
 */

import { mysqlTable, varchar, int, text, timestamp, decimal, boolean, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ============================================================================
// CALL RECORDING METADATA
// ============================================================================

export const callRecordings = mysqlTable("call_recordings", {
  id: int("id").primaryKey().autoincrement(),
  callId: varchar("call_id", { length: 255 }).notNull().unique(),
  customerId: int("customer_id"),
  agentId: int("agent_id"),
  recordingUrl: text("recording_url").notNull(), // Azure Blob Storage URL
  recordingKey: varchar("recording_key", { length: 255 }).notNull(), // S3/Azure key
  duration: int("duration"), // seconds
  fileSize: int("file_size"), // bytes
  mimeType: varchar("mime_type", { length: 100 }).default("audio/wav"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  retentionDays: int("retention_days").default(90),
  expiresAt: timestamp("expires_at"),
  isTranscribed: boolean("is_transcribed").default(false),
  consentGiven: boolean("consent_given").default(true),
  complianceNotes: text("compliance_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const callRecordingsRelations = relations(callRecordings, ({ one, many }) => ({
  customer: one(customers, {
    fields: [callRecordings.customerId],
    references: [customers.id],
  }),
  agent: one(agents, {
    fields: [callRecordings.agentId],
    references: [agents.id],
  }),
  transcripts: many(callTranscripts),
  routing: one(callRouting, {
    fields: [callRecordings.callId],
    references: [callRouting.callId],
  }),
}));

// ============================================================================
// CALL TRANSCRIPTS
// ============================================================================

export const callTranscripts = mysqlTable("call_transcripts", {
  id: int("id").primaryKey().autoincrement(),
  recordingId: int("recording_id").notNull(),
  callId: varchar("call_id", { length: 255 }).notNull(),
  fullTranscript: text("full_transcript").notNull(),
  segments: json("segments"), // Array of {timestamp, speaker, text, confidence}
  language: varchar("language", { length: 10 }).default("en-US"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  keywords: json("keywords"), // Array of extracted keywords
  entities: json("entities"), // Array of extracted entities (names, emails, etc.)
  summary: text("summary"), // AI-generated summary
  actionItems: json("action_items"), // Array of action items
  searchable: boolean("searchable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const callTranscriptsRelations = relations(callTranscripts, ({ one }) => ({
  recording: one(callRecordings, {
    fields: [callTranscripts.recordingId],
    references: [callRecordings.id],
  }),
}));

// ============================================================================
// AGENT QUEUES
// ============================================================================

export const agentQueues = mysqlTable("agent_queues", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  type: mysqlEnum("type", ["general", "senior", "specialist", "vip"]).default("general"),
  priority: int("priority").default(0), // Higher = higher priority
  maxConcurrentCalls: int("max_concurrent_calls").default(5),
  averageWaitTime: int("average_wait_time"), // seconds
  callsWaiting: int("calls_waiting").default(0),
  agentCount: int("agent_count").default(0),
  skillRequirements: json("skill_requirements"), // Array of required skills
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const agentQueuesRelations = relations(agentQueues, ({ many }) => ({
  agents: many(agentQueueAssignments),
  routing: many(callRouting),
}));

// ============================================================================
// AGENT QUEUE ASSIGNMENTS
// ============================================================================

export const agentQueueAssignments = mysqlTable("agent_queue_assignments", {
  id: int("id").primaryKey().autoincrement(),
  agentId: int("agent_id").notNull(),
  queueId: int("queue_id").notNull(),
  isActive: boolean("is_active").default(true),
  currentCallCount: int("current_call_count").default(0),
  maxConcurrentCalls: int("max_concurrent_calls").default(5),
  skillLevel: mysqlEnum("skill_level", ["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  removedAt: timestamp("removed_at"),
});

export const agentQueueAssignmentsRelations = relations(agentQueueAssignments, ({ one }) => ({
  agent: one(agents, {
    fields: [agentQueueAssignments.agentId],
    references: [agents.id],
  }),
  queue: one(agentQueues, {
    fields: [agentQueueAssignments.queueId],
    references: [agentQueues.id],
  }),
}));

// ============================================================================
// CALL ROUTING RULES
// ============================================================================

export const callRouting = mysqlTable("call_routing", {
  id: int("id").primaryKey().autoincrement(),
  callId: varchar("call_id", { length: 255 }).notNull().unique(),
  recordingId: int("recording_id"),
  customerId: int("customer_id"),
  agentId: int("agent_id"),
  queueId: int("queue_id"),
  routingReason: mysqlEnum("routing_reason", [
    "sentiment_negative",
    "sentiment_positive",
    "complexity_high",
    "complexity_low",
    "skill_match",
    "availability",
    "escalation",
    "manual",
  ]).notNull(),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }), // -1.00 to 1.00
  complexityScore: decimal("complexity_score", { precision: 3, scale: 2 }), // 0.00 to 1.00
  routingDecision: mysqlEnum("routing_decision", [
    "ai_resolved",
    "escalated_to_agent",
    "transferred",
    "voicemail",
    "callback",
  ]).notNull(),
  routingTime: int("routing_time"), // milliseconds
  routingConfidence: decimal("routing_confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  attemptCount: int("attempt_count").default(1),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const callRoutingRelations = relations(callRouting, ({ one }) => ({
  recording: one(callRecordings, {
    fields: [callRouting.callId],
    references: [callRecordings.callId],
  }),
  customer: one(customers, {
    fields: [callRouting.customerId],
    references: [customers.id],
  }),
  agent: one(agents, {
    fields: [callRouting.agentId],
    references: [agents.id],
  }),
  queue: one(agentQueues, {
    fields: [callRouting.queueId],
    references: [agentQueues.id],
  }),
}));

// ============================================================================
// CALL ANALYTICS
// ============================================================================

export const callAnalytics = mysqlTable("call_analytics", {
  id: int("id").primaryKey().autoincrement(),
  callId: varchar("call_id", { length: 255 }).notNull().unique(),
  recordingId: int("recording_id"),
  customerId: int("customer_id"),
  agentId: int("agent_id"),
  
  // Call metrics
  duration: int("duration"), // seconds
  holdTime: int("hold_time"), // seconds
  talkTime: int("talk_time"), // seconds
  silenceTime: int("silence_time"), // seconds
  transferCount: int("transfer_count").default(0),
  
  // Sentiment metrics
  initialSentiment: decimal("initial_sentiment", { precision: 3, scale: 2 }), // -1.00 to 1.00
  finalSentiment: decimal("final_sentiment", { precision: 3, scale: 2 }), // -1.00 to 1.00
  sentimentTrend: mysqlEnum("sentiment_trend", ["improving", "stable", "declining"]),
  
  // Satisfaction metrics
  customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }), // 0.00 to 5.00
  npsScore: int("nps_score"), // -100 to 100
  effortScore: int("effort_score"), // 1-5
  
  // Resolution metrics
  isResolved: boolean("is_resolved").default(false),
  resolutionTime: int("resolution_time"), // minutes
  requiresFollowUp: boolean("requires_follow_up").default(false),
  
  // AI metrics
  aiHandledPercentage: decimal("ai_handled_percentage", { precision: 3, scale: 2 }), // 0.00 to 1.00
  aiAccuracy: decimal("ai_accuracy", { precision: 3, scale: 2 }), // 0.00 to 1.00
  kbArticlesUsed: int("kb_articles_used").default(0),
  
  // Cost metrics
  estimatedCost: decimal("estimated_cost", { precision: 8, scale: 2 }),
  costPerMinute: decimal("cost_per_minute", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const callAnalyticsRelations = relations(callAnalytics, ({ one }) => ({
  recording: one(callRecordings, {
    fields: [callAnalytics.recordingId],
    references: [callRecordings.id],
  }),
  customer: one(customers, {
    fields: [callAnalytics.customerId],
    references: [customers.id],
  }),
  agent: one(agents, {
    fields: [callAnalytics.agentId],
    references: [agents.id],
  }),
}));

// ============================================================================
// REAL-TIME AGENT DASHBOARD DATA
// ============================================================================

export const agentDashboardSessions = mysqlTable("agent_dashboard_sessions", {
  id: int("id").primaryKey().autoincrement(),
  agentId: int("agent_id").notNull(),
  callId: varchar("call_id", { length: 255 }).notNull(),
  
  // Live data
  liveTranscript: text("live_transcript"),
  lastTranscriptUpdate: timestamp("last_transcript_update"),
  
  // KB suggestions
  suggestedKbArticles: json("suggested_kb_articles"), // Array of {id, title, relevance}
  lastKbUpdate: timestamp("last_kb_update"),
  
  // Sentiment gauge
  currentSentiment: decimal("current_sentiment", { precision: 3, scale: 2 }), // -1.00 to 1.00
  sentimentColor: varchar("sentiment_color", { length: 20 }), // red, yellow, green
  lastSentimentUpdate: timestamp("last_sentiment_update"),
  
  // Suggested responses
  suggestedResponses: json("suggested_responses"), // Array of {text, confidence}
  lastResponseUpdate: timestamp("last_response_update"),
  
  // Session metadata
  sessionStarted: timestamp("session_started").defaultNow(),
  sessionEnded: timestamp("session_ended"),
  isActive: boolean("is_active").default(true),
});

export const agentDashboardSessionsRelations = relations(agentDashboardSessions, ({ one }) => ({
  agent: one(agents, {
    fields: [agentDashboardSessions.agentId],
    references: [agents.id],
  }),
}));

// ============================================================================
// SENTIMENT ROUTING RULES
// ============================================================================

export const sentimentRoutingRules = mysqlTable("sentiment_routing_rules", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Sentiment thresholds
  sentimentMin: decimal("sentiment_min", { precision: 3, scale: 2 }), // -1.00 to 1.00
  sentimentMax: decimal("sentiment_max", { precision: 3, scale: 2 }), // -1.00 to 1.00
  
  // Routing target
  targetQueueId: int("target_queue_id"),
  targetAgentId: int("target_agent_id"),
  escalateToSenior: boolean("escalate_to_senior").default(false),
  
  // Priority
  priority: int("priority").default(0),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const sentimentRoutingRulesRelations = relations(sentimentRoutingRules, ({ one }) => ({
  targetQueue: one(agentQueues, {
    fields: [sentimentRoutingRules.targetQueueId],
    references: [agentQueues.id],
  }),
  targetAgent: one(agents, {
    fields: [sentimentRoutingRules.targetAgentId],
    references: [agents.id],
  }),
}));

// ============================================================================
// PLACEHOLDER REFERENCES (These tables should exist in Phase 1)
// ============================================================================

// These are referenced but should be defined in your existing schema
export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  // ... existing fields
});

export const agents = mysqlTable("agents", {
  id: int("id").primaryKey().autoincrement(),
  // ... existing fields
});

export const customersRelations = relations(customers, ({ many }) => ({
  callRecordings: many(callRecordings),
  callRouting: many(callRouting),
  callAnalytics: many(callAnalytics),
}));

export const agentsRelations = relations(agents, ({ many }) => ({
  callRecordings: many(callRecordings),
  queueAssignments: many(agentQueueAssignments),
  callRouting: many(callRouting),
  callAnalytics: many(callAnalytics),
  dashboardSessions: many(agentDashboardSessions),
}));
