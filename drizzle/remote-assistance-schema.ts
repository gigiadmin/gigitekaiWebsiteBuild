/**
 * Enterprise Remote Assistance System - Database Schema
 * Fortune 500-grade remote support with screen sharing, session management, and audit logging
 */

import {
  mysqlTable,
  varchar,
  int,
  text,
  timestamp,
  boolean,
  mysqlEnum,
  json,
  decimal,
  index,
  primaryKey,
} from 'drizzle-orm/mysql-core';

/**
 * Remote Assistance Sessions
 * Tracks all remote support sessions with full audit trail
 */
export const remoteAssistanceSessions = mysqlTable(
  'remote_assistance_sessions',
  {
    id: int().primaryKey().autoincrement(),
    sessionId: varchar('session_id', { length: 64 }).notNull().unique(),
    
    // Participants
    technicianId: int('technician_id').notNull(),
    clientUserId: int('client_user_id').notNull(),
    clientEmail: varchar('client_email', { length: 255 }).notNull(),
    
    // Session Details
    status: mysqlEnum('status', [
      'pending',
      'active',
      'paused',
      'completed',
      'cancelled',
      'failed',
    ]).notNull().default('pending'),
    
    sessionType: mysqlEnum('session_type', [
      'screen_share_only',
      'remote_control',
      'file_transfer',
      'collaborative',
    ]).notNull().default('screen_share_only'),
    
    // Permissions
    allowRemoteControl: boolean('allow_remote_control').notNull().default(false),
    allowFileTransfer: boolean('allow_file_transfer').notNull().default(false),
    allowRecording: boolean('allow_recording').notNull().default(false),
    
    // Ticket Association
    ticketId: int('ticket_id'),
    
    // Timing
    initiatedAt: timestamp('initiated_at').notNull().defaultNow(),
    startedAt: timestamp('started_at'),
    endedAt: timestamp('ended_at'),
    duration: int('duration'), // in seconds
    
    // Connection Details
    clientIpAddress: varchar('client_ip_address', { length: 45 }),
    technicianIpAddress: varchar('technician_ip_address', { length: 45 }),
    clientDeviceInfo: json('client_device_info'),
    
    // Quality Metrics
    averageLatency: int('average_latency'), // in ms
    packetLoss: decimal('packet_loss', { precision: 5, scale: 2 }), // percentage
    bandwidth: int('bandwidth'), // in kbps
    
    // Recording & Playback
    recordingUrl: varchar('recording_url', { length: 512 }),
    recordingDuration: int('recording_duration'), // in seconds
    recordingSize: int('recording_size'), // in MB
    
    // Metadata
    issueCategory: varchar('issue_category', { length: 100 }),
    issueDescription: text('issue_description'),
    resolutionNotes: text('resolution_notes'),
    
    // Audit Trail
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    sessionIdIdx: index('session_id_idx').on(table.sessionId),
    technicianIdIdx: index('technician_id_idx').on(table.technicianId),
    clientUserIdIdx: index('client_user_id_idx').on(table.clientUserId),
    ticketIdIdx: index('ticket_id_idx').on(table.ticketId),
    statusIdx: index('status_idx').on(table.status),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
  })
);

/**
 * Session Participants
 * Track all participants in a session (can have multiple viewers)
 */
export const sessionParticipants = mysqlTable(
  'session_participants',
  {
    id: int().primaryKey().autoincrement(),
    sessionId: int('session_id').notNull(),
    userId: int('user_id').notNull(),
    
    role: mysqlEnum('role', [
      'technician',
      'client',
      'observer',
      'supervisor',
    ]).notNull(),
    
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
    leftAt: timestamp('left_at'),
    
    // Permissions for this participant
    canControl: boolean('can_control').notNull().default(false),
    canTransferFiles: boolean('can_transfer_files').notNull().default(false),
    canChat: boolean('can_chat').notNull().default(true),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('session_id_idx').on(table.sessionId),
    userIdIdx: index('user_id_idx').on(table.userId),
  })
);

/**
 * Session Chat Messages
 * In-session communication log
 */
export const sessionChatMessages = mysqlTable(
  'session_chat_messages',
  {
    id: int().primaryKey().autoincrement(),
    sessionId: int('session_id').notNull(),
    senderId: int('sender_id').notNull(),
    
    message: text('message').notNull(),
    messageType: mysqlEnum('message_type', [
      'text',
      'system',
      'file_transfer',
      'annotation',
    ]).notNull().default('text'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('session_id_idx').on(table.sessionId),
    senderIdIdx: index('sender_id_idx').on(table.senderId),
  })
);

/**
 * File Transfers
 * Track files transferred during sessions
 */
export const fileTransfers = mysqlTable(
  'file_transfers',
  {
    id: int().primaryKey().autoincrement(),
    sessionId: int('session_id').notNull(),
    
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: int('file_size').notNull(), // in bytes
    mimeType: varchar('mime_type', { length: 100 }),
    
    senderId: int('sender_id').notNull(),
    recipientId: int('recipient_id').notNull(),
    
    status: mysqlEnum('status', [
      'pending',
      'in_progress',
      'completed',
      'failed',
      'cancelled',
    ]).notNull().default('pending'),
    
    fileUrl: varchar('file_url', { length: 512 }),
    
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('session_id_idx').on(table.sessionId),
    senderIdIdx: index('sender_id_idx').on(table.senderId),
  })
);

/**
 * Session Recordings
 * Metadata for recorded sessions with encryption details
 */
export const sessionRecordings = mysqlTable(
  'session_recordings',
  {
    id: int().primaryKey().autoincrement(),
    sessionId: int('session_id').notNull().unique(),
    
    recordingUrl: varchar('recording_url', { length: 512 }).notNull(),
    duration: int('duration').notNull(), // in seconds
    fileSize: int('file_size').notNull(), // in MB
    
    // Encryption
    encryptionAlgorithm: varchar('encryption_algorithm', { length: 50 }).notNull(),
    encryptionKeyId: varchar('encryption_key_id', { length: 255 }).notNull(),
    
    // Access Control
    accessLevel: mysqlEnum('access_level', [
      'private',
      'technician_only',
      'client_accessible',
      'admin_only',
    ]).notNull().default('private'),
    
    // Retention
    retentionDays: int('retention_days').notNull().default(90),
    expiresAt: timestamp('expires_at'),
    
    // Playback Tracking
    playbackCount: int('playback_count').notNull().default(0),
    lastPlayedAt: timestamp('last_played_at'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    sessionIdIdx: index('session_id_idx').on(table.sessionId),
    expiresAtIdx: index('expires_at_idx').on(table.expiresAt),
  })
);

/**
 * Audit Log
 * Comprehensive audit trail for compliance and security
 */
export const remoteAssistanceAuditLog = mysqlTable(
  'remote_assistance_audit_log',
  {
    id: int().primaryKey().autoincrement(),
    sessionId: int('session_id').notNull(),
    
    eventType: mysqlEnum('event_type', [
      'session_created',
      'session_started',
      'session_ended',
      'remote_control_granted',
      'remote_control_revoked',
      'file_transferred',
      'recording_started',
      'recording_stopped',
      'participant_joined',
      'participant_left',
      'permission_changed',
      'session_paused',
      'session_resumed',
      'unauthorized_access_attempt',
    ]).notNull(),
    
    userId: int('user_id').notNull(),
    
    details: json('details'),
    
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('session_id_idx').on(table.sessionId),
    userIdIdx: index('user_id_idx').on(table.userId),
    eventTypeIdx: index('event_type_idx').on(table.eventType),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
  })
);

/**
 * Session Analytics
 * Performance and usage metrics
 */
export const sessionAnalytics = mysqlTable(
  'session_analytics',
  {
    id: int().primaryKey().autoincrement(),
    sessionId: int('session_id').notNull().unique(),
    
    // Performance Metrics
    avgLatency: decimal('avg_latency', { precision: 8, scale: 2 }), // ms
    maxLatency: decimal('max_latency', { precision: 8, scale: 2 }), // ms
    minLatency: decimal('min_latency', { precision: 8, scale: 2 }), // ms
    
    packetLossPercentage: decimal('packet_loss_percentage', { precision: 5, scale: 2 }),
    
    avgBandwidth: int('avg_bandwidth'), // kbps
    peakBandwidth: int('peak_bandwidth'), // kbps
    
    // Screen Sharing Metrics
    framesPerSecond: int('frames_per_second'),
    screenResolution: varchar('screen_resolution', { length: 50 }),
    
    // Engagement Metrics
    remoteControlDuration: int('remote_control_duration'), // seconds
    fileTransferCount: int('file_transfer_count'),
    totalFileSize: int('total_file_size'), // MB
    
    // Issue Resolution
    issueResolved: boolean('issue_resolved').notNull().default(false),
    resolutionTime: int('resolution_time'), // seconds
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('session_id_idx').on(table.sessionId),
  })
);

/**
 * Technician Availability
 * Track technician status for routing
 */
export const technicianAvailability = mysqlTable(
  'technician_availability',
  {
    id: int().primaryKey().autoincrement(),
    technicianId: int('technician_id').notNull(),
    
    status: mysqlEnum('status', [
      'available',
      'busy',
      'away',
      'offline',
      'on_break',
    ]).notNull().default('offline'),
    
    currentSessionCount: int('current_session_count').notNull().default(0),
    maxConcurrentSessions: int('max_concurrent_sessions').notNull().default(3),
    
    lastStatusChange: timestamp('last_status_change').notNull().defaultNow(),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    technicianIdIdx: index('technician_id_idx').on(table.technicianId),
    statusIdx: index('status_idx').on(table.status),
  })
);

/**
 * Session Templates
 * Pre-configured session settings for common scenarios
 */
export const sessionTemplates = mysqlTable(
  'session_templates',
  {
    id: int().primaryKey().autoincrement(),
    
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    
    sessionType: mysqlEnum('session_type', [
      'screen_share_only',
      'remote_control',
      'file_transfer',
      'collaborative',
    ]).notNull(),
    
    defaultPermissions: json('default_permissions').notNull(),
    
    allowRecording: boolean('allow_recording').notNull().default(true),
    recordingRetentionDays: int('recording_retention_days').notNull().default(90),
    
    maxDuration: int('max_duration'), // in minutes, null = unlimited
    
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    createdByIdx: index('created_by_idx').on(table.createdBy),
  })
);

/**
 * Session Policies
 * Organization-wide policies for remote assistance
 */
export const sessionPolicies = mysqlTable(
  'session_policies',
  {
    id: int().primaryKey().autoincrement(),
    
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: text('description'),
    
    // Security Policies
    requireMfa: boolean('require_mfa').notNull().default(true),
    requireEncryption: boolean('require_encryption').notNull().default(true),
    encryptionAlgorithm: varchar('encryption_algorithm', { length: 50 }).notNull().default('AES-256-GCM'),
    
    // Session Policies
    maxSessionDuration: int('max_session_duration').notNull().default(480), // minutes
    maxConcurrentSessions: int('max_concurrent_sessions').notNull().default(5),
    
    // Recording Policies
    requireRecordingConsent: boolean('require_recording_consent').notNull().default(true),
    autoRecordSessions: boolean('auto_record_sessions').notNull().default(true),
    recordingRetentionDays: int('recording_retention_days').notNull().default(90),
    
    // Audit Policies
    auditAllSessions: boolean('audit_all_sessions').notNull().default(true),
    logAllEvents: boolean('log_all_events').notNull().default(true),
    
    // IP Restrictions
    allowedIpRanges: json('allowed_ip_ranges'),
    blockedIpRanges: json('blocked_ip_ranges'),
    
    // Geographic Restrictions
    allowedCountries: json('allowed_countries'),
    blockedCountries: json('blocked_countries'),
    
    isActive: boolean('is_active').notNull().default(true),
    
    createdBy: int('created_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    createdByIdx: index('created_by_idx').on(table.createdBy),
    isActiveIdx: index('is_active_idx').on(table.isActive),
  })
);

export type RemoteAssistanceSession = typeof remoteAssistanceSessions.$inferSelect;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type SessionChatMessage = typeof sessionChatMessages.$inferSelect;
export type FileTransfer = typeof fileTransfers.$inferSelect;
export type SessionRecording = typeof sessionRecordings.$inferSelect;
export type AuditLogEntry = typeof remoteAssistanceAuditLog.$inferSelect;
export type SessionAnalytic = typeof sessionAnalytics.$inferSelect;
export type TechnicianAvailability = typeof technicianAvailability.$inferSelect;
export type SessionTemplate = typeof sessionTemplates.$inferSelect;
export type SessionPolicy = typeof sessionPolicies.$inferSelect;
