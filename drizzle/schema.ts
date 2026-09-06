import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, uniqueIndex, int, varchar, mysqlEnum, timestamp, foreignKey, json, text, date, decimal, datetime, float, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const adminCredentials = mysqlTable("adminCredentials", {
	id: int().autoincrement().primaryKey(),
	email: varchar({ length: 320 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	hashedPassword: varchar({ length: 255 }).notNull(),
	role: mysqlEnum(['admin','agent','viewer']).default('agent').notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastLoginAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("adminCredentials_email_unique").on(table.email),
]);

export const adminMenuCustomization = mysqlTable("adminMenuCustomization", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	menuOrder: json().notNull(),
	collapsedSections: json().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const adminNotifications = mysqlTable("adminNotifications", {
	id: int().autoincrement().primaryKey(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text(),
	href: varchar({ length: 500 }),
	priority: varchar({ length: 20 }).default('normal').notNull(),
	isRead: tinyint().default(0).notNull(),
	ticketId: int(),
	sessionId: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const agentAssignments = mysqlTable("agentAssignments", {
	id: int().autoincrement().primaryKey(),
	agentId: int().notNull(),
	ticketId: int(),
	chatSessionId: int(),
	assignedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp({ mode: 'string' }),
	status: mysqlEnum(['assigned','in-progress','completed','escalated']).default('assigned').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const agentMetrics = mysqlTable("agentMetrics", {
	id: int().autoincrement().primaryKey(),
	agentId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	ticketsHandled: int().default(0).notNull(),
	chatsHandled: int().default(0).notNull(),
	averageResolutionTime: int(),
	customerSatisfactionScore: varchar({ length: 10 }),
	firstContactResolution: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const agentSchedules = mysqlTable("agentSchedules", {
	id: int().autoincrement().primaryKey(),
	agentId: int().notNull(),
	dayOfWeek: int().notNull(),
	startTime: varchar({ length: 5 }).notNull(),
	endTime: varchar({ length: 5 }).notNull(),
	isWorkingDay: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const agentTakeoverRequests = mysqlTable("agentTakeoverRequests", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 100 }).notNull(),
	visitorName: varchar({ length: 255 }),
	visitorEmail: varchar({ length: 320 }),
	visitorPhone: varchar({ length: 50 }),
	reason: text(),
	status: mysqlEnum(['pending','accepted','declined','timeout']).default('pending').notNull(),
	assignedAdminId: int(),
	ticketId: int(),
	conversationContext: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	acceptedAt: timestamp({ mode: 'string' }),
	closedAt: timestamp({ mode: 'string' }),
});

export const agentWorkload = mysqlTable("agentWorkload", {
	id: int().autoincrement().primaryKey(),
	agentId: int().notNull(),
	date: varchar({ length: 10 }).notNull(),
	assignedTickets: int().default(0).notNull(),
	completedTickets: int().default(0).notNull(),
	avgResolutionTime: decimal({ precision: 8, scale: 2 }),
	slaBreaches: int().default(0).notNull(),
	customerSatisfaction: decimal({ precision: 3, scale: 2 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const agentDashboardSessions = mysqlTable("agent_dashboard_sessions", {
	id: int().autoincrement().primaryKey(),
	agentId: int("agent_id").notNull(),
	callId: varchar("call_id", { length: 255 }).notNull(),
	liveTranscript: text("live_transcript"),
	suggestedKbArticles: json("suggested_kb_articles"),
	currentSentiment: decimal("current_sentiment", { precision: 3, scale: 2 }),
	sentimentColor: varchar("sentiment_color", { length: 50 }),
	suggestedResponses: json("suggested_responses"),
	isActive: tinyint("is_active").default(1),
	sessionStarted: timestamp("session_started", { mode: 'string' }).defaultNow(),
	sessionEnded: timestamp("session_ended", { mode: 'string' }),
	lastTranscriptUpdate: timestamp("last_transcript_update", { mode: 'string' }),
	lastSentimentUpdate: timestamp("last_sentiment_update", { mode: 'string' }),
	lastKbUpdate: timestamp("last_kb_update", { mode: 'string' }),
	lastResponseUpdate: timestamp("last_response_update", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const agentQueueAssignments = mysqlTable("agent_queue_assignments", {
	id: int().autoincrement().primaryKey(),
	agentId: int("agent_id").notNull(),
	queueId: int("queue_id").notNull(),
	skillLevel: int("skill_level").default(1),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow(),
	removedAt: timestamp("removed_at", { mode: 'string' }),
});

export const agentQueues = mysqlTable("agent_queues", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	type: mysqlEnum(['general','senior','specialist','vip']).default('general'),
	priority: int().default(0),
	maxConcurrentCalls: int("max_concurrent_calls").default(5),
	averageWaitTime: int("average_wait_time"),
	callsWaiting: int("calls_waiting").default(0),
	agentCount: int("agent_count").default(0),
	skillRequirements: json("skill_requirements"),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("agent_queues_name_unique").on(table.name),
]);

export const agents = mysqlTable("agents", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull(),
	status: mysqlEnum(['available','busy','offline','on-break']).default('offline').notNull(),
	specialization: varchar({ length: 255 }),
	maxConcurrentTickets: int().default(5).notNull(),
	currentTicketCount: int().default(0).notNull(),
	averageResolutionTime: int(),
	customerSatisfactionScore: varchar({ length: 10 }),
	totalTicketsResolved: int().default(0).notNull(),
	totalChatsHandled: int().default(0).notNull(),
	lastStatusChange: timestamp({ mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("agents_userId_unique").on(table.userId),
]);

export const alertThresholds = mysqlTable("alertThresholds", {
	id: int().autoincrement().primaryKey(),
	service: varchar({ length: 100 }).notNull(),
	responseTimeThreshold: int().default(5000).notNull(),
	errorRateThreshold: int().default(10).notNull(),
	unprocessedTicketsThreshold: int().default(50),
	agentAvailabilityThreshold: int().default(50),
	slaComplianceThreshold: int().default(90),
	enabled: tinyint().default(1).notNull(),
	notifyOnDegraded: tinyint().default(1).notNull(),
	notifyOnCritical: tinyint().default(1).notNull(),
	notifyOnRecovery: tinyint().default(1).notNull(),
	updatedBy: int(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("alertThresholds_service_unique").on(table.service),
]);

export const blogPostTags = mysqlTable("blogPostTags", {
	id: int().autoincrement().primaryKey(),
	postId: int().notNull().references(() => blogPosts.id, { onDelete: "cascade" } ),
	tagId: int().notNull().references(() => blogTags.id, { onDelete: "cascade" } ),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const blogPosts = mysqlTable("blogPosts", {
	id: int().autoincrement().primaryKey(),
	slug: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	excerpt: text().notNull(),
	content: text().notNull(),
	category: varchar({ length: 100 }).notNull(),
	readTime: varchar({ length: 50 }).notNull(),
	published: tinyint().default(0).notNull(),
	authorName: varchar({ length: 255 }).default('GigitekAI Team').notNull(),
	featuredImage: varchar({ length: 1000 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	publishedAt: timestamp({ mode: 'string' }),
	authorTitle: varchar({ length: 255 }),
	authorBio: text(),
	authorAvatar: varchar({ length: 1000 }),
},
(table) => [
	index("blogPosts_slug_unique").on(table.slug),
]);

export const blogTags = mysqlTable("blogTags", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("blogTags_name_unique").on(table.name),
	index("blogTags_slug_unique").on(table.slug),
]);

export const bulkTicketActions = mysqlTable("bulkTicketActions", {
	id: int().autoincrement().primaryKey(),
	actionType: varchar({ length: 50 }).notNull(),
	ticketIds: text().notNull(),
	assignedTo: int(),
	newPriority: varchar({ length: 20 }),
	newStatus: varchar({ length: 20 }),
	performedBy: int().notNull(),
	affectedCount: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const voicemailDedup = mysqlTable("voicemailDedup", {
	id: int().autoincrement().primaryKey(),
	callerPhone: varchar({ length: 50 }).notNull(),
	transcriptHash: varchar({ length: 100 }).notNull(), // First 50 chars of transcript
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(), // 24 hours from creation
	source: mysqlEnum(['email','webhook','group']).default('email').notNull(),
	externalId: varchar({ length: 255 }), // messageId, callId, or threadId
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("voicemailDedup_phone_hash_unique").on(table.callerPhone, table.transcriptHash, table.source),
		index("voicemailDedup_externalId_unique").on(table.externalId),
		index("voicemailDedup_expiresAt").on(table.expiresAt),
	]);

export const callDraftTickets = mysqlTable("callDraftTickets", {
	id: int().autoincrement().primaryKey(),
	callLogId: int().notNull(),
	callerPhone: varchar({ length: 50 }),
	callerName: varchar({ length: 255 }),
	callerEmail: varchar({ length: 320 }),
	userId: int(),
	title: varchar({ length: 500 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }),
	priority: varchar({ length: 50 }),
	reviewStatus: mysqlEnum(['pending','approved','rejected','edited']).default('pending'),
	reviewedBy: int(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewNotes: text(),
	ticketId: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const callLogs = mysqlTable("callLogs", {
	id: int().autoincrement().primaryKey(),
	graphCallId: varchar({ length: 255 }).notNull(),
	callerNumber: varchar({ length: 50 }),
	calleeNumber: varchar({ length: 50 }),
	calleeDisplayName: varchar({ length: 255 }),
	calleeUpn: varchar({ length: 320 }),
	matchedUserId: int(),
	direction: mysqlEnum(['inbound','outbound']).default('inbound'),
	startedAt: timestamp({ mode: 'string' }),
	endedAt: timestamp({ mode: 'string' }),
	durationSeconds: int(),
	hasTranscript: tinyint().default(0),
	transcriptText: text(),
	aiSummary: text(),
	aiTitle: varchar({ length: 500 }),
	aiPriority: varchar({ length: 50 }),
	aiCategory: varchar({ length: 100 }),
	aiConfidence: varchar({ length: 10 }),
	status: mysqlEnum(['pending','analyzed','draft_created','ticket_created','dismissed']).default('pending'),
	draftTicketId: int(),
	ticketId: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
	transcriptionStatus: mysqlEnum(['pending','transcribing','done','failed','unavailable']).default('unavailable'),
	acsRecordingId: varchar({ length: 255 }),
	acsRecordingUrl: varchar({ length: 2048 }),
},
(table) => [
	index("callLogs_graphCallId_unique").on(table.graphCallId),
]);

export const callQualityScores = mysqlTable("callQualityScores", {
	id: int().autoincrement().primaryKey(),
	callLogId: int().notNull(),
	agentName: varchar({ length: 255 }),
	agentUpn: varchar({ length: 320 }),
	scoreGreeting: int(),
	scoreEmpathy: int(),
	scoreTechnical: int(),
	scoreResolution: int(),
	scoreCommunication: int(),
	scoreCompliance: int(),
	totalScore: int(),
	grade: varchar({ length: 2 }),
	aiSummary: text(),
	strengths: text(),
	improvements: text(),
	modelVersion: varchar({ length: 20 }).default('v1').notNull(),
	scoredBy: mysqlEnum(['auto','manual']).default('auto').notNull(),
	scoredAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("callQualityScores_callLogId_unique").on(table.callLogId),
]);

export const callAnalytics = mysqlTable("call_analytics", {
	id: int().autoincrement().primaryKey(),
	callId: varchar("call_id", { length: 255 }).notNull(),
	recordingId: int("recording_id"),
	customerId: int("customer_id"),
	agentId: int("agent_id"),
	duration: int(),
	holdTime: int("hold_time"),
	talkTime: int("talk_time"),
	silenceTime: int("silence_time"),
	transferCount: int("transfer_count").default(0),
	initialSentiment: decimal("initial_sentiment", { precision: 3, scale: 2 }),
	finalSentiment: decimal("final_sentiment", { precision: 3, scale: 2 }),
	sentimentTrend: varchar("sentiment_trend", { length: 50 }),
	customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }),
	npsScore: int("nps_score"),
	effortScore: int("effort_score"),
	isResolved: tinyint("is_resolved").default(0),
	resolutionTime: int("resolution_time"),
	requiresFollowUp: tinyint("requires_follow_up").default(0),
	aiHandledPercentage: decimal("ai_handled_percentage", { precision: 3, scale: 2 }),
	aiAccuracy: decimal("ai_accuracy", { precision: 3, scale: 2 }),
	kbArticlesUsed: int("kb_articles_used").default(0),
	estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const callRecordings = mysqlTable("call_recordings", {
	id: int().autoincrement().primaryKey(),
	callId: varchar("call_id", { length: 255 }).notNull(),
	customerId: int("customer_id"),
	agentId: int("agent_id"),
	recordingUrl: text("recording_url").notNull(),
	recordingKey: varchar("recording_key", { length: 255 }).notNull(),
	duration: int(),
	fileSize: int("file_size"),
	mimeType: varchar("mime_type", { length: 100 }).default('audio/wav'),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending'),
	retentionDays: int("retention_days").default(90),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	isTranscribed: tinyint("is_transcribed").default(0),
	consentGiven: tinyint("consent_given").default(1),
	complianceNotes: text("compliance_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("call_recordings_call_id_unique").on(table.callId),
]);

export const callRouting = mysqlTable("call_routing", {
	id: int().autoincrement().primaryKey(),
	callId: varchar("call_id", { length: 255 }).notNull(),
	customerId: int("customer_id"),
	queueId: int("queue_id"),
	agentId: int("agent_id"),
	routingReason: varchar("routing_reason", { length: 100 }),
	sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
	complexityScore: decimal("complexity_score", { precision: 3, scale: 2 }),
	routingDecision: varchar("routing_decision", { length: 100 }),
	routingTime: int("routing_time"),
	routingConfidence: decimal("routing_confidence", { precision: 3, scale: 2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const callTranscripts = mysqlTable("call_transcripts", {
	id: int().autoincrement().primaryKey(),
	recordingId: int("recording_id").notNull(),
	callId: varchar("call_id", { length: 255 }).notNull(),
	fullTranscript: text("full_transcript").notNull(),
	segments: json(),
	language: varchar({ length: 10 }).default('en-US'),
	confidence: decimal({ precision: 3, scale: 2 }),
	keywords: json(),
	entities: json(),
	summary: text(),
	actionItems: json("action_items"),
	searchable: tinyint().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const cannedResponses = mysqlTable("cannedResponses", {
	id: int().autoincrement().primaryKey(),
	title: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	category: varchar({ length: 100 }).default('general').notNull(),
	usageCount: int().default(0).notNull(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const chatAnalytics = mysqlTable("chatAnalytics", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 100 }).notNull(),
	messageId: int().notNull(),
	sentiment: mysqlEnum(['positive','neutral','negative','angry']).default('neutral').notNull(),
	sentimentScore: varchar({ length: 10 }),
	intent: mysqlEnum(['sales','support','billing','general','complaint']).default('general').notNull(),
	intentConfidence: varchar({ length: 10 }),
	routedTo: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const chatLeads = mysqlTable("chatLeads", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	company: varchar({ length: 255 }),
	interest: varchar({ length: 255 }),
	conversationSummary: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	phone: varchar({ length: 50 }),
	consentEmail: tinyint().default(0).notNull(),
	consentPhone: tinyint().default(0).notNull(),
	consentText: tinyint().default(0).notNull(),
});

export const chatMessages = mysqlTable("chatMessages", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 100 }).notNull(),
	role: mysqlEnum(['user','assistant']).notNull(),
	message: text().notNull(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const chatSessions = mysqlTable("chatSessions", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 100 }).notNull(),
	visitorName: varchar({ length: 255 }),
	visitorEmail: varchar({ length: 320 }),
	visitorCompany: varchar({ length: 255 }),
	visitorInterest: varchar({ length: 100 }),
	escalatedToTicketId: int(),
	status: mysqlEnum(['active','escalated','closed']).default('active').notNull(),
	messageCount: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	closedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("chatSessions_sessionId_unique").on(table.sessionId),
]);

export const chatSuggestions = mysqlTable("chatSuggestions", {
	id: int().autoincrement().primaryKey(),
	chatSessionId: int().notNull(),
	articleId: int().notNull(),
	suggestedBy: mysqlEnum(['ai','agent']).default('ai').notNull(),
	suggestedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	clickedAt: timestamp({ mode: 'string' }),
	helpful: tinyint(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const companies = mysqlTable("companies", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	domain: varchar({ length: 255 }),
	contactEmail: varchar({ length: 255 }),
	contactPhone: varchar({ length: 50 }),
	industry: varchar({ length: 100 }),
	tier: mysqlEnum(['starter','professional','enterprise']).default('starter'),
	teamsChannelId: varchar({ length: 255 }),
	teamsChannelName: varchar({ length: 255 }),
	teamsChannelWebhookUrl: varchar({ length: 1024 }),
	teamsChannelCreatedAt: timestamp({ mode: 'string' }),
	notes: text(),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const contactSubmissions = mysqlTable("contactSubmissions", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	company: varchar({ length: 255 }),
	message: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	hearAboutUs: varchar({ length: 100 }),
	phone: varchar({ length: 20 }),
	fileKey: varchar({ length: 255 }),
	fileName: varchar({ length: 255 }),
	fileSize: int(),
	fileMimeType: varchar({ length: 100 }),
	fileUrl: text(),
	pricingTier: varchar({ length: 50 }),
	companySize: varchar({ length: 50 }),
	subject: varchar({ length: 255 }),
});

export const conversationSummaries = mysqlTable("conversationSummaries", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 100 }).notNull(),
	summary: text().notNull(),
	keyPoints: text(),
	suggestedActions: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("conversationSummaries_sessionId_unique").on(table.sessionId),
]);

export const customRoles = mysqlTable("customRoles", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	permissions: json().notNull(),
	isSystem: tinyint().default(0).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("customRoles_name_unique").on(table.name),
]);

export const customerFeedback = mysqlTable("customerFeedback", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull().references(() => tickets.id, { onDelete: "cascade" } ),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	rating: int().notNull(),
	comment: text(),
	categories: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const customerInvites = mysqlTable("customerInvites", {
	id: int().autoincrement().primaryKey(),
	inviteToken: varchar({ length: 128 }).notNull(),
	invitedEmail: varchar({ length: 320 }).notNull(),
	invitedName: varchar({ length: 255 }),
	invitedCompany: varchar({ length: 255 }),
	invitedBy: int().notNull(),
	status: mysqlEnum(['pending','accepted','expired','revoked']).default('pending').notNull(),
	acceptedBy: int(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	acceptedAt: timestamp({ mode: 'string' }),
	reminderSent: tinyint().default(0).notNull(),
},
(table) => [
	index("customerInvites_inviteToken_unique").on(table.inviteToken),
]);

export const customerPortalActivity = mysqlTable("customerPortalActivity", {
	id: int().autoincrement().primaryKey(),
	customerId: int().notNull(),
	action: mysqlEnum(['view_ticket','view_kb','submit_survey','add_comment','login','logout']).notNull(),
	resourceType: varchar({ length: 50 }),
	resourceId: int(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const customerPortalSessions = mysqlTable("customerPortalSessions", {
	id: int().autoincrement().primaryKey(),
	customerId: int().notNull(),
	sessionToken: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	lastActivityAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar({ length: 45 }),
	userAgent: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("customerPortalSessions_sessionToken_unique").on(table.sessionToken),
]);

export const demoLeads = mysqlTable("demoLeads", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	company: varchar({ length: 255 }),
	scenario: varchar({ length: 100 }),
	message: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const emailDigestHistory = mysqlTable("emailDigestHistory", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull(),
	sentAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	leadsCount: int().default(0).notNull(),
	ticketsCount: int().default(0).notNull(),
	approvalsCount: int().default(0).notNull(),
	status: mysqlEnum(['sent','failed','pending']).default('pending').notNull(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const emailDigestPreferences = mysqlTable("emailDigestPreferences", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull(),
	enabled: tinyint().default(1).notNull(),
	frequency: mysqlEnum(['daily','weekly','bi-weekly','monthly']).default('daily').notNull(),
	sendTime: varchar({ length: 5 }).default('06:00').notNull(),
	includeLeads: tinyint().default(1).notNull(),
	includeTickets: tinyint().default(1).notNull(),
	includeApprovals: tinyint().default(1).notNull(),
	lastSentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("emailDigestPreferences_userId_unique").on(table.userId),
]);

export const emailGroupMembers = mysqlTable("emailGroupMembers", {
	id: int().autoincrement().primaryKey(),
	groupId: int().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const emailMessages = mysqlTable("emailMessages", {
	id: int().autoincrement().primaryKey(),
	direction: varchar({ length: 20 }).notNull(),
	from: varchar({ length: 255 }).notNull(),
	to: varchar({ length: 1000 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	templateId: int(),
	linkedTicketId: int(),
	linkedSessionId: int(),
	status: varchar({ length: 20 }).default('sent').notNull(),
	messageId: varchar({ length: 255 }),
	sentBy: int(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	uniqueIndex("emailMessages_messageId_unique").on(table.messageId),
]);

export const emailRecipientGroups = mysqlTable("emailRecipientGroups", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	type: varchar({ length: 50 }).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailTemplates = mysqlTable("emailTemplates", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	category: varchar({ length: 50 }).notNull(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const escalationPatterns = mysqlTable("escalationPatterns", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 255 }).notNull(),
	originalMessage: text().notNull(),
	detectedIntent: varchar({ length: 100 }).default('general'),
	intentConfidence: varchar({ length: 20 }).default('0.5'),
	sentiment: varchar({ length: 50 }).default('neutral'),
	sentimentScore: varchar({ length: 20 }).default('0.5'),
	escalationReason: varchar({ length: 255 }).default('user_requested'),
	kbArticleSuggested: tinyint().default(0),
	kbArticleId: int(),
	ticketId: int(),
	resolvedByAgent: tinyint().default(0),
	resolutionNotes: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	resolvedAt: timestamp({ mode: 'string' }),
});

export const exitIntentPopups = mysqlTable("exitIntentPopups", {
	id: int().autoincrement().primaryKey(),
	email: varchar({ length: 255 }).notNull(),
	firstName: varchar({ length: 100 }).notNull(),
	lastName: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }),
	companyName: varchar({ length: 255 }),
	leadMagnetDownloaded: varchar({ length: 255 }),
	downloadUrl: varchar({ length: 500 }),
	pageUrl: varchar({ length: 500 }).notNull(),
	emailSent: tinyint().default(0),
	leadCaptured: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const freeAuditSubmissions = mysqlTable("freeAuditSubmissions", {
	id: int().autoincrement().primaryKey(),
	companyName: varchar({ length: 255 }).notNull(),
	industry: varchar({ length: 100 }).notNull(),
	description: text(),
	contactName: varchar({ length: 255 }).notNull(),
	contactEmail: varchar({ length: 320 }).notNull(),
	contactPhone: varchar({ length: 20 }),
	auditType: varchar({ length: 100 }),
	currentChallenges: text(),
	goals: text(),
	status: mysqlEnum(['submitted','contacted','in_progress','completed','archived']).default('submitted').notNull(),
	notes: text(),
	assignedTo: int(),
	submittedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	contactedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const healthCheckHistory = mysqlTable("healthCheckHistory", {
	id: int().autoincrement().primaryKey(),
	service: varchar({ length: 100 }).notNull(),
	status: mysqlEnum(['healthy','degraded','critical','offline']).notNull(),
	responseTime: int().notNull(),
	message: text(),
	metrics: json(),
	checkedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const kbArticleAnalytics = mysqlTable("kbArticleAnalytics", {
	id: int().autoincrement().primaryKey(),
	articleId: int().notNull(),
	views: int().default(0).notNull(),
	shares: int().default(0).notNull(),
	ticketsResolved: int().default(0).notNull(),
	avgHelpfulnessRating: decimal({ precision: 3, scale: 2 }),
	lastViewedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kbArticleComments = mysqlTable("kbArticleComments", {
	id: int().autoincrement().primaryKey(),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	userId: int(),
	userName: varchar({ length: 255 }),
	userEmail: varchar({ length: 320 }),
	comment: text().notNull(),
	helpful: tinyint(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const kbArticleFeedback = mysqlTable("kbArticleFeedback", {
	id: int().autoincrement().primaryKey(),
	messageId: int().notNull(),
	articleId: int().notNull(),
	rating: mysqlEnum(['helpful','unhelpful']).notNull(),
	feedbackMessage: text(),
	sessionId: varchar({ length: 64 }),
	userId: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const kbArticleRatings = mysqlTable("kbArticleRatings", {
	id: int().autoincrement().primaryKey(),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	userId: int(),
	rating: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("unique_user_article").on(table.articleId, table.userId),
]);

export const kbArticleShares = mysqlTable("kbArticleShares", {
	id: int().autoincrement().primaryKey(),
	articleId: int().notNull(),
	sharedBy: int().notNull(),
	sharedWith: varchar({ length: 255 }),
	sharedVia: mysqlEnum(['email','link','ticket']).default('email').notNull(),
	ticketId: int(),
	message: text(),
	sharedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	viewedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const kbArticleTags = mysqlTable("kbArticleTags", {
	id: int().autoincrement().primaryKey(),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	tag: varchar({ length: 100 }).notNull(),
	source: varchar({ length: 50 }).default('manual').notNull(),
	confidence: decimal({ precision: 3, scale: 2 }).default('1.00'),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const kbArticleVersions = mysqlTable("kbArticleVersions", {
	id: int().autoincrement().primaryKey(),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	title: varchar({ length: 500 }).notNull(),
	content: text().notNull(),
	category: varchar({ length: 100 }).notNull(),
	tags: varchar({ length: 500 }),
	editedBy: int(),
	changeDescription: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const kbArticleViews = mysqlTable("kbArticleViews", {
	id: int().autoincrement().primaryKey(),
	articleId: int().notNull(),
	viewedBy: int(),
	viewedFrom: mysqlEnum(['kb_portal','ticket_detail','search_widget','share_link']).default('kb_portal').notNull(),
	ticketId: int(),
	viewedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	timeSpent: int(),
	helpful: tinyint(),
});

export const kbArticles = mysqlTable("kbArticles", {
	id: int().autoincrement().primaryKey(),
	title: varchar({ length: 500 }).notNull(),
	content: text().notNull(),
	category: varchar({ length: 100 }).default('general').notNull(),
	tags: varchar({ length: 500 }),
	isPublished: tinyint().default(0).notNull(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	viewCount: int().default(0),
	averageRating: decimal({ precision: 3, scale: 2 }),
	ratingCount: int().default(0),
	commentCount: int().default(0),
	sourceUrl: varchar({ length: 1000 }),
	externalUid: varchar({ length: 500 }),
	syncSource: varchar({ length: 100 }),
	lastSyncedAt: timestamp({ mode: 'string' }),
	subcategory: varchar({ length: 150 }),
	audience: mysqlEnum(['end-user','technician','admin']).default('technician'),
	difficulty: mysqlEnum(['beginner','intermediate','advanced']).default('intermediate'),
	estimatedResolutionTime: varchar({ length: 50 }),
	ariaEnabled: tinyint().default(1).notNull(),
	articleCode: varchar({ length: 20 }),
});

export const kbGenerationMetrics = mysqlTable("kbGenerationMetrics", {
	id: int().autoincrement().primaryKey(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	totalGenerated: int().default(0),
	totalApproved: int().default(0),
	totalPublished: int().default(0),
	totalRejected: int().default(0),
	avgConfidenceScore: int().default(0),
	avgApprovalTime: int().default(0),
	suggestionsShown: int().default(0),
	suggestionsUsed: int().default(0),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("kbGenerationMetrics_date_unique").on(table.date),
]);

export const kbGenerationQueue = mysqlTable("kbGenerationQueue", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull().references(() => tickets.id, { onDelete: "cascade" } ),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	priority: int().default(0),
	errorMessage: text(),
	attemptCount: int().default(0),
	maxAttempts: int().default(3),
	nextRetryAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kbGenerations = mysqlTable("kbGenerations", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull().references(() => tickets.id, { onDelete: "cascade" } ),
	sourceTicketTitle: varchar({ length: 500 }).notNull(),
	sourceTicketContent: text().notNull(),
	generatedTitle: varchar({ length: 500 }).notNull(),
	generatedContent: text().notNull(),
	suggestedCategory: varchar({ length: 100 }).default('general'),
	suggestedTags: varchar({ length: 500 }),
	status: mysqlEnum(['draft','pending_approval','approved','published','rejected']).default('draft').notNull(),
	confidence: int().default(0),
	generatedBy: varchar({ length: 50 }).default('copilot'),
	generatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	rejectionReason: text(),
	rejectedBy: int(),
	rejectedAt: timestamp({ mode: 'string' }),
	publishedArticleId: int(),
	publishedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kbSearchQueries = mysqlTable("kbSearchQueries", {
	id: int().autoincrement().primaryKey(),
	query: varchar({ length: 500 }).notNull(),
	resultsCount: int().default(0).notNull(),
	clickedArticleId: int(),
	source: varchar({ length: 50 }).default('kb_portal').notNull(),
	userId: int(),
	sessionId: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const knowledgeBase = mysqlTable("knowledgeBase", {
	id: int().autoincrement().primaryKey(),
	category: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	keywords: text().notNull(),
	priority: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const leadGenAnalytics = mysqlTable("leadGenAnalytics", {
	id: int().autoincrement().primaryKey(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	assessmentLeads: int().default(0),
	popupLeads: int().default(0),
	formLeads: int().default(0),
	totalLeads: int().default(0),
	assessmentConversions: int().default(0),
	popupConversions: int().default(0),
	formConversions: int().default(0),
	totalConversions: int().default(0),
	conversionRate: decimal({ precision: 5, scale: 2 }).default('0'),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const magicLinkTokens = mysqlTable("magicLinkTokens", {
	id: int().autoincrement().primaryKey(),
	email: varchar({ length: 320 }).notNull(),
	token: varchar({ length: 128 }).notNull(),
	expiresAt: datetime({ mode: 'string'}).notNull(),
	used: tinyint().default(0).notNull(),
	createdAt: datetime({ mode: 'string'}).default(sql`(now())`).notNull(),
},
(table) => [
	index("token").on(table.token),
]);

export const meetingBookings = mysqlTable("meetingBookings", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	phone: varchar({ length: 50 }),
	company: varchar({ length: 255 }),
	meetingDate: varchar({ length: 10 }).notNull(),
	meetingTime: varchar({ length: 5 }).notNull(),
	notes: text(),
	status: mysqlEnum(['confirmed','cancelled','rescheduled']).default('confirmed').notNull(),
	cancelToken: varchar({ length: 64 }),
	m365EventId: varchar({ length: 500 }),
	cancelledAt: timestamp({ mode: 'string' }),
	rescheduledTo: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("meetingBookings_cancelToken_unique").on(table.cancelToken),
]);

export const multiStepFormSubmissions = mysqlTable("multiStepFormSubmissions", {
	id: int().autoincrement().primaryKey(),
	email: varchar({ length: 255 }).notNull(),
	firstName: varchar({ length: 100 }).notNull(),
	lastName: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	employeeCount: varchar({ length: 50 }),
	currentITSetup: varchar({ length: 500 }),
	needsCybersecurity: tinyint().default(0),
	needsCloud: tinyint().default(0),
	needsHelpdesk: tinyint().default(0),
	needsAi: tinyint().default(0),
	otherNeeds: varchar({ length: 500 }),
	formCompletedAt: timestamp({ mode: 'string' }),
	leadQuality: varchar({ length: 20 }),
	assignedTo: int(),
	status: varchar({ length: 20 }).default('new'),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).onUpdateNow().notNull(),
	fileKey: varchar({ length: 255 }),
	fileName: varchar({ length: 255 }),
	fileSize: int(),
	fileMimeType: varchar({ length: 100 }),
	fileUrl: text(),
});

export const newsletterCampaigns = mysqlTable("newsletterCampaigns", {
	id: int().autoincrement().primaryKey(),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	recipientCount: int().default(0).notNull(),
	sentCount: int().default(0).notNull(),
	failedCount: int().default(0).notNull(),
	status: varchar({ length: 50 }).default('completed').notNull(),
	sentBy: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
	id: int().autoincrement().primaryKey(),
	email: varchar({ length: 320 }).notNull(),
	unsubscribeToken: varchar({ length: 64 }).notNull(),
	source: varchar({ length: 500 }),
	active: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("newsletterSubscribers_email_unique").on(table.email),
	index("newsletterSubscribers_unsubscribeToken_unique").on(table.unsubscribeToken),
]);

export const notificationPreferences = mysqlTable("notificationPreferences", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull(),
	emailNotifications: tinyint().default(1).notNull(),
	smsNotifications: tinyint().default(0).notNull(),
	inAppNotifications: tinyint().default(1).notNull(),
	emailFrequency: mysqlEnum(['immediate','daily','weekly']).default('immediate').notNull(),
	smsPhoneNumber: varchar({ length: 20 }),
	notifyOnTicketCreated: tinyint().default(1).notNull(),
	notifyOnTicketUpdated: tinyint().default(1).notNull(),
	notifyOnTicketResolved: tinyint().default(1).notNull(),
	notifyOnSurveyRequest: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("notificationPreferences_userId_unique").on(table.userId),
]);

export const notificationQueue = mysqlTable("notificationQueue", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull(),
	type: mysqlEnum(['email','sms','in_app']).notNull(),
	subject: varchar({ length: 255 }),
	content: text().notNull(),
	relatedTicketId: int(),
	relatedEntityType: varchar({ length: 50 }),
	relatedEntityId: int(),
	status: mysqlEnum(['pending','sent','failed','bounced']).default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	failureReason: text(),
	retryCount: int().default(0).notNull(),
	maxRetries: int().default(3).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const pricingAnalytics = mysqlTable("pricingAnalytics", {
	id: int().autoincrement().primaryKey(),
	date: varchar({ length: 10 }).notNull(),
	pageViews: int().default(0).notNull(),
	tierViews: text(),
	calculatorUsed: int().default(0).notNull(),
	contactFormSubmitted: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("pricingAnalytics_date_unique").on(table.date),
]);

export const pricingTiers = mysqlTable("pricingTiers", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	monthlyPrice: decimal({ precision: 10, scale: 2 }).notNull(),
	annualPrice: decimal({ precision: 10, scale: 2 }).notNull(),
	isPopular: tinyint().default(0).notNull(),
	features: text().notNull(),
	maxUsers: int(),
	maxTickets: int(),
	maxStorage: int(),
	supportLevel: varchar({ length: 50 }),
	slaResponse: varchar({ length: 50 }),
	slaResolution: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("pricingTiers_name_unique").on(table.name),
]);

export const pushNotifications = mysqlTable("pushNotifications", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull(),
	endpoint: text().notNull(),
	auth: varchar({ length: 255 }).notNull(),
	p256Dh: varchar({ length: 255 }).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const pushSubscriptions = mysqlTable("pushSubscriptions", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 64 }).notNull(),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const quickAssistSessions = mysqlTable("quickAssistSessions", {
	id: int().autoincrement().primaryKey(),
	sessionCode: varchar({ length: 10 }).notNull(),
	ticketId: int(),
	customerId: int(),
	initiatedBy: int().notNull(),
	description: text(),
	status: mysqlEnum(['active','ended','expired']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	endedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("quickAssistSessions_sessionCode_unique").on(table.sessionCode),
]);

export const realtimeChatMessages = mysqlTable("realtimeChatMessages", {
	id: int().autoincrement().primaryKey(),
	sessionId: int().notNull(),
	senderId: int().notNull(),
	senderRole: mysqlEnum(['user','admin']).notNull(),
	message: text().notNull(),
	isRead: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const realtimeChatSessions = mysqlTable("realtimeChatSessions", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull(),
	adminId: int(),
	status: mysqlEnum(['active','closed','archived']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	closedAt: timestamp({ mode: 'string' }),
	ticketId: int(),
});

export const responseRatings = mysqlTable("responseRatings", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 100 }).notNull(),
	messageId: int().notNull(),
	rating: mysqlEnum(['helpful','neutral','unhelpful']).notNull(),
	feedback: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const roiCalculations = mysqlTable("roiCalculations", {
	id: int().autoincrement().primaryKey(),
	userId: int(),
	tierName: varchar({ length: 255 }),
	currentEmployees: int().notNull(),
	ticketsPerMonth: int().notNull(),
	avgResolutionTime: decimal({ precision: 5, scale: 2 }).notNull(),
	costPerHour: decimal({ precision: 10, scale: 2 }).notNull(),
	estimatedSavings: decimal({ precision: 12, scale: 2 }).notNull(),
	paybackPeriod: decimal({ precision: 5, scale: 2 }),
	roiPercentage: decimal({ precision: 10, scale: 2 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const roiReports = mysqlTable("roiReports", {
	id: int().autoincrement().primaryKey(),
	clientId: varchar({ length: 255 }),
	clientName: varchar({ length: 255 }),
	periodStart: datetime({ mode: 'string'}).notNull(),
	periodEnd: datetime({ mode: 'string'}).notNull(),
	ticketCount: int().default(0).notNull(),
	resolvedCount: int().default(0).notNull(),
	avgHandleTimeMinutes: float().notNull(),
	aiDeflectionCount: int().default(0).notNull(),
	aiDeflectionRate: float().notNull(),
	uptimePct: float().default(99.9).notNull(),
	hoursFreed: float().notNull(),
	estimatedCostSavings: float().notNull(),
	avgCallQualityScore: float(),
	totalCalls: int().default(0).notNull(),
	voicemailCount: int().default(0).notNull(),
	kbArticlesCreated: int().default(0).notNull(),
	kbSearches: int().default(0).notNull(),
	snapshotAt: datetime({ mode: 'string'}).default(sql`(now())`).notNull(),
	createdAt: datetime({ mode: 'string'}).default(sql`(now())`).notNull(),
},
(table) => [
	index("idx_roi_period").on(table.periodStart, table.periodEnd),
	index("idx_roi_client").on(table.clientId),
]);

export const securityAssessments = mysqlTable("securityAssessments", {
	id: int().autoincrement().primaryKey(),
	email: varchar({ length: 255 }).notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	firstName: varchar({ length: 100 }).notNull(),
	lastName: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }),
	emailSecurityScore: int().notNull(),
	endpointProtectionScore: int().notNull(),
	backupRecoveryScore: int().notNull(),
	identityManagementScore: int().notNull(),
	complianceScore: int().notNull(),
	overallScore: int().notNull(),
	riskLevel: varchar({ length: 20 }).notNull(),
	// Compliance framework coverage percentages
	nistCoverage: int().default(0),
	isoCoverage: int().default(0),
	soc2Coverage: int().default(0),
	hipaaCoverage: int().default(0),
	pciDssCoverage: int().default(0),
	cmmcCoverage: int().default(0),
	// Detailed findings (JSON array of findings with control, status, remediation)
	findings: json(),
	// Executive summary
	executiveSummary: text(),
	// Report generation
	pdfGenerated: tinyint().default(0),
	pdfUrl: varchar({ length: 500 }),
	htmlReportUrl: varchar({ length: 500 }),
	leadCaptured: tinyint().default(1),
	emailSent: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).onUpdateNow().notNull(),
});

export const sentimentRoutingRules = mysqlTable("sentiment_routing_rules", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	sentimentMin: decimal("sentiment_min", { precision: 3, scale: 2 }),
	sentimentMax: decimal("sentiment_max", { precision: 3, scale: 2 }),
	targetQueueId: int("target_queue_id"),
	targetAgentId: int("target_agent_id"),
	escalateToSenior: tinyint("escalate_to_senior").default(0),
	priority: int().default(0),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const serviceStatusChanges = mysqlTable("serviceStatusChanges", {
	id: int().autoincrement().primaryKey(),
	service: varchar({ length: 100 }).notNull(),
	previousStatus: mysqlEnum(['healthy','degraded','critical','offline']).notNull(),
	newStatus: mysqlEnum(['healthy','degraded','critical','offline']).notNull(),
	message: text(),
	notificationsSent: int().default(0).notNull(),
	changedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const serviceStatusSubscriptions = mysqlTable("serviceStatusSubscriptions", {
	id: int().autoincrement().primaryKey(),
	email: varchar({ length: 320 }).notNull(),
	service: varchar({ length: 100 }).notNull(),
	notifyOnHealthy: tinyint().default(0).notNull(),
	notifyOnDegraded: tinyint().default(1).notNull(),
	notifyOnCritical: tinyint().default(1).notNull(),
	notifyOnOffline: tinyint().default(1).notNull(),
	isActive: tinyint().default(1).notNull(),
	unsubscribeToken: varchar({ length: 64 }),
	subscribedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastNotificationSentAt: timestamp({ mode: 'string' }),
	unsubscribedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("serviceStatusSubscriptions_unsubscribeToken_unique").on(table.unsubscribeToken),
]);

export const settings = mysqlTable("settings", {
	id: int().autoincrement().primaryKey(),
	key: varchar({ length: 255 }).notNull(),
	value: text().notNull(),
	description: text(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("settings_key_unique").on(table.key),
]);

export const slaConfigurations = mysqlTable("slaConfigurations", {
	id: int().autoincrement().primaryKey(),
	category: varchar({ length: 100 }).notNull(),
	priority: varchar({ length: 20 }).notNull(),
	responseTimeMinutes: int().notNull(),
	resolutionTimeMinutes: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const slaSnoozes = mysqlTable("slaSnoozes", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull(),
	snoozedUntil: timestamp({ mode: 'string' }).notNull(),
	snoozedBy: int().notNull(),
	reason: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const slaTracking = mysqlTable("slaTracking", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull(),
	responseDeadline: timestamp({ mode: 'string' }).notNull(),
	resolutionDeadline: timestamp({ mode: 'string' }).notNull(),
	responseBreached: tinyint().default(0).notNull(),
	resolutionBreached: tinyint().default(0).notNull(),
	firstResponseAt: timestamp({ mode: 'string' }),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("slaTracking_ticketId_unique").on(table.ticketId),
]);

export const smsCampaigns = mysqlTable("smsCampaigns", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	message: text().notNull(),
	status: mysqlEnum(['draft','scheduled','sending','sent','paused','cancelled']).default('draft').notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	sentAt: timestamp({ mode: 'string' }),
	createdBy: int(),
	totalRecipients: int().default(0).notNull(),
	totalSent: int().default(0).notNull(),
	totalDelivered: int().default(0).notNull(),
	totalFailed: int().default(0).notNull(),
	totalOptedOut: int().default(0).notNull(),
	fromNumber: varchar({ length: 20 }),
	tags: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const smsContacts = mysqlTable("smsContacts", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	email: varchar({ length: 320 }),
	company: varchar({ length: 255 }),
	source: varchar({ length: 50 }).default('manual').notNull(),
	optedIn: tinyint().default(1).notNull(),
	optedInAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	optedOutAt: timestamp({ mode: 'string' }),
	optOutReason: varchar({ length: 100 }),
	tags: json(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const smsMessages = mysqlTable("smsMessages", {
	id: int().autoincrement().primaryKey(),
	campaignId: int(),
	contactId: int().notNull(),
	toPhone: varchar({ length: 20 }).notNull(),
	fromPhone: varchar({ length: 20 }).notNull(),
	body: text().notNull(),
	status: mysqlEnum(['queued','sent','delivered','failed','undelivered']).default('queued').notNull(),
	provider: mysqlEnum(['twilio','acs']).default('twilio').notNull(),
	providerMessageId: varchar({ length: 100 }),
	errorCode: varchar({ length: 50 }),
	errorMessage: text(),
	sentAt: timestamp({ mode: 'string' }),
	deliveredAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const smsOptOuts = mysqlTable("smsOptOuts", {
	id: int().autoincrement().primaryKey(),
	phone: varchar({ length: 20 }).notNull(),
	contactId: int(),
	reason: varchar({ length: 100 }).default('STOP').notNull(),
	source: varchar({ length: 50 }).default('inbound').notNull(),
	processedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const socialConnections = mysqlTable("socialConnections", {
	id: int().autoincrement().primaryKey(),
	platform: mysqlEnum(['linkedin','twitter','facebook']).notNull(),
	accessToken: text().notNull(),
	accessTokenSecret: text(),
	refreshToken: text(),
	expiresAt: timestamp({ mode: 'string' }),
	pageId: varchar({ length: 255 }),
	personUrn: varchar({ length: 255 }),
	screenName: varchar({ length: 255 }),
	connectedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("socialConnections_platform_unique").on(table.platform),
]);

export const socialPosts = mysqlTable("socialPosts", {
	id: int().autoincrement().primaryKey(),
	title: varchar({ length: 500 }).notNull(),
	platform: mysqlEnum(['linkedin','twitter','facebook']).notNull(),
	postId: varchar({ length: 500 }),
	content: text().notNull(),
	url: varchar({ length: 1000 }),
	status: mysqlEnum(['published','failed','pending','scheduled','draft']).default('pending').notNull(),
	errorMessage: text(),
	publishedAt: timestamp({ mode: 'string' }),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	platforms: text(),
	link: varchar({ length: 1000 }),
	engagementLikes: int().default(0),
	engagementComments: int().default(0),
	engagementShares: int().default(0),
	engagementLastFetched: timestamp({ mode: 'string' }),
});

export const stripeCustomers = mysqlTable("stripeCustomers", {
	id: int().autoincrement().primaryKey(),
	userId: varchar({ length: 255 }).notNull(),
	stripeCustomerId: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("stripeCustomers_userId_unique").on(table.userId),
	index("stripeCustomers_stripeCustomerId_unique").on(table.stripeCustomerId),
]);

export const stripeSubscriptions = mysqlTable("stripeSubscriptions", {
	id: int().autoincrement().primaryKey(),
	userId: varchar({ length: 255 }).notNull(),
	stripeSubscriptionId: varchar({ length: 255 }).notNull(),
	stripeCustomerId: varchar({ length: 255 }).notNull(),
	planName: varchar({ length: 50 }).notNull(),
	userCount: int().notNull(),
	isAnnual: tinyint().default(0).notNull(),
	status: varchar({ length: 50 }).notNull(),
	currentPeriodStart: timestamp({ mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp({ mode: 'string' }).notNull(),
	canceledAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("stripeSubscriptions_stripeSubscriptionId_unique").on(table.stripeSubscriptionId),
]);

export const stripeInvoices = mysqlTable("stripe_invoices", {
	id: varchar({ length: 255 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }).notNull(),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull(),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
	amountCents: int("amount_cents").notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	status: mysqlEnum(['draft','open','paid','void','uncollectible']).notNull(),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	dueDate: timestamp("due_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("stripe_invoices_stripe_invoice_id_unique").on(table.stripeInvoiceId),
	index("stripe_invoices_user_id_idx").on(table.userId),
	index("stripe_invoices_stripe_invoice_id_idx").on(table.stripeInvoiceId),
	index("stripe_invoices_stripe_subscription_id_idx").on(table.stripeSubscriptionId),
	index("stripe_invoices_status_idx").on(table.status),
]);

export const stripePaymentIntents = mysqlTable("stripe_payment_intents", {
	id: varchar({ length: 255 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).notNull(),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
	amountCents: int("amount_cents").notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	description: text(),
	status: mysqlEnum(['succeeded','processing','requires_payment_method','requires_confirmation','canceled']).notNull(),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("stripe_payment_intents_stripe_payment_intent_id_unique").on(table.stripePaymentIntentId),
	index("stripe_payment_intents_user_id_idx").on(table.userId),
	index("stripe_payment_intents_stripe_payment_intent_id_idx").on(table.stripePaymentIntentId),
	index("stripe_payment_intents_status_idx").on(table.status),
]);

export const stripeWebhookEvents = mysqlTable("stripe_webhook_events", {
	id: varchar({ length: 255 }).notNull(),
	stripeEventId: varchar("stripe_event_id", { length: 255 }).notNull(),
	eventType: varchar("event_type", { length: 255 }).notNull(),
	userId: varchar("user_id", { length: 255 }),
	payload: text().notNull(),
	processed: tinyint().default(0).notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	error: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("stripe_webhook_events_stripe_event_id_unique").on(table.stripeEventId),
	index("stripe_webhook_events_stripe_event_id_idx").on(table.stripeEventId),
	index("stripe_webhook_events_event_type_idx").on(table.eventType),
	index("stripe_webhook_events_user_id_idx").on(table.userId),
	index("stripe_webhook_events_processed_idx").on(table.processed),
]);

export const teamsClientChannels = mysqlTable("teamsClientChannels", {
	id: int().autoincrement().primaryKey(),
	companyId: int().notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	teamsTeamId: varchar({ length: 255 }).notNull(),
	teamsChannelId: varchar({ length: 255 }).notNull(),
	teamsChannelName: varchar({ length: 255 }).notNull(),
	webhookUrl: varchar({ length: 1024 }),
	provisionedBy: int(),
	provisionedAt: timestamp({ mode: 'string' }).defaultNow(),
	isActive: tinyint().default(1),
	lastNotificationAt: timestamp({ mode: 'string' }),
	notificationCount: int().default(0),
});

export const teamsIntegration = mysqlTable("teamsIntegration", {
	id: int().autoincrement().primaryKey(),
	sessionId: varchar({ length: 100 }).notNull(),
	teamsConversationId: varchar({ length: 255 }).notNull(),
	teamsUserId: varchar({ length: 255 }).notNull(),
	status: mysqlEnum(['active','archived','synced']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const ticketActivity = mysqlTable("ticketActivity", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull(),
	actorId: int().notNull(),
	actorName: varchar({ length: 255 }).notNull(),
	action: varchar({ length: 100 }).notNull(),
	fromValue: varchar({ length: 255 }),
	toValue: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const ticketFeedback = mysqlTable("ticketFeedback", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull(),
	userId: int().notNull(),
	rating: mysqlEnum(['1','2','3','4','5']).notNull(),
	comment: text(),
	wouldRecommend: tinyint(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const ticketKbSuggestions = mysqlTable("ticketKbSuggestions", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull().references(() => tickets.id, { onDelete: "cascade" } ),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	relevanceScore: int().default(0),
	suggestedBy: mysqlEnum(['ai','agent']).default('ai').notNull(),
	suggestedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	viewedAt: timestamp({ mode: 'string' }),
	usedAt: timestamp({ mode: 'string' }),
	helpful: tinyint(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const ticketMerges = mysqlTable("ticketMerges", {
	id: int().autoincrement().primaryKey(),
	primaryTicketId: int().notNull(),
	mergedTicketId: int().notNull(),
	mergedBy: int().notNull(),
	reason: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const ticketNotes = mysqlTable("ticketNotes", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull(),
	authorId: int().notNull(),
	authorName: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const ticketReplies = mysqlTable("ticketReplies", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull(),
	userId: int().notNull(),
	message: text().notNull(),
	isStaffReply: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const ticketSurveys = mysqlTable("ticketSurveys", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull(),
	rating: int().notNull(),
	comment: text(),
	submittedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	submittedBy: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("ticketSurveys_ticketId_unique").on(table.ticketId),
]);

export const ticketTemplates = mysqlTable("ticketTemplates", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	category: varchar({ length: 100 }).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const tickets = mysqlTable("tickets", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	stepsAttempted: text(),
	priority: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	category: mysqlEnum(['bug_report','feature_request','general_support','billing','email','printer','internet','network','other']).default('general_support').notNull(),
	status: mysqlEnum(['open','in_progress','on_hold','resolved','closed']).default('open').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	assignedTo: int(),
	aiCategory: varchar({ length: 100 }),
	aiPriority: varchar({ length: 20 }),
	aiConfidence: decimal({ precision: 4, scale: 2 }),
	aiReasoning: text(),
	source: varchar({ length: 50 }).default('web').notNull(),
	closingNotes: text(),
	closedAt: timestamp({ mode: 'string' }),
	mergedInto: int(),
	// New fields for ticket form
	requesterName: varchar({ length: 255 }),
	requesterEmail: varchar({ length: 320 }),
	tags: varchar({ length: 255 }), // comma-separated tags
	includeChatTranscript: tinyint().default(1).notNull(),
	chatSessionId: varchar({ length: 100 }), // link to chat session
	chatTranscript: text(), // full chat history if included
});

export const uptimeStatistics = mysqlTable("uptimeStatistics", {
	id: int().autoincrement().primaryKey(),
	service: varchar({ length: 100 }).notNull(),
	period: mysqlEnum(['1h','24h','7d','30d']).notNull(),
	uptimePercentage: decimal({ precision: 5, scale: 2 }).notNull(),
	totalChecks: int().notNull(),
	healthyChecks: int().notNull(),
	degradedChecks: int().notNull(),
	criticalChecks: int().notNull(),
	offlineChecks: int().notNull(),
	avgResponseTime: int(),
	calculatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const userActivity = mysqlTable("userActivity", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	activityType: varchar({ length: 50 }).notNull(),
	description: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const userRoleAssignments = mysqlTable("userRoleAssignments", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	roleId: int().notNull().references(() => customRoles.id, { onDelete: "cascade" } ),
	assignedBy: int().notNull(),
	assignedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const userSessions = mysqlTable("userSessions", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull(),
	isOnline: tinyint().default(0).notNull(),
	lastActivityAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("userSessions_userId_unique").on(table.userId),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().primaryKey(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','technician']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).defaultNow().notNull(),
	approved: tinyint().default(0).notNull(),
	deletedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const websiteTraffic = mysqlTable("websiteTraffic", {
	id: int().autoincrement().primaryKey(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	pageUrl: varchar({ length: 500 }).notNull(),
	pageTitle: varchar({ length: 500 }),
	visitors: int().default(0).notNull(),
	pageViews: int().default(0).notNull(),
	bounceRate: decimal({ precision: 5, scale: 2 }).default('0'),
	avgTimeOnPage: int().default(0),
	referrer: varchar({ length: 500 }),
	country: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const conversionEvents = mysqlTable("conversionEvents", {
	id: int().autoincrement().primaryKey(),
	eventName: varchar({ length: 120 }).notNull(),
	pageUrl: varchar({ length: 500 }).notNull(),
	elementId: varchar({ length: 180 }),
	sessionId: varchar({ length: 120 }),
	userId: int(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("conversionEvents_event_idx").on(table.eventName),
	index("conversionEvents_created_idx").on(table.createdAt),
	index("conversionEvents_session_idx").on(table.sessionId),
]);

export const websiteAssessments = mysqlTable("websiteAssessments", {
	id: int().autoincrement().primaryKey(),
	publicId: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 180 }).notNull(),
	company: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	employees: int().notNull(),
	priority: varchar({ length: 120 }).notNull(),
	overallScore: int().notNull(),
	maturityLevel: varchar({ length: 80 }).notNull(),
	recommendations: json().notNull(),
	inputs: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	uniqueIndex("websiteAssessments_publicId_unique").on(table.publicId),
	index("websiteAssessments_email_idx").on(table.email),
	index("websiteAssessments_created_idx").on(table.createdAt),
]);

export const xeroTokens = mysqlTable("xeroTokens", {
	id: int().autoincrement().primaryKey(),
	tenantId: varchar({ length: 255 }).notNull(),
	tenantName: varchar({ length: 255 }),
	accessToken: text().notNull(),
	refreshToken: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	scopes: text(),
	connectedBy: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("xeroTokens_tenantId_unique").on(table.tenantId),
]);


// ── Search Index Tables ──────────────────────────────────────────────────────

export const searchIndex = mysqlTable("searchIndex", {
	id: int().autoincrement().primaryKey(),
	contentType: mysqlEnum(['blog', 'kb', 'service', 'industry', 'page', 'faq', 'pricing', 'case_study']).notNull(),
	sourceId: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	excerpt: text().notNull(),
	content: text().notNull(),
	url: varchar({ length: 500 }).notNull(),
	metadata: text(), // JSON stringified
	embedding: text(), // JSON stringified embedding vector
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("searchIndex_contentType_sourceId_unique").on(table.contentType, table.sourceId),
	index("searchIndex_contentType_idx").on(table.contentType),
	index("searchIndex_url_idx").on(table.url),
]);

export const searchAnalytics = mysqlTable("searchAnalytics", {
	id: int().autoincrement().primaryKey(),
	query: varchar({ length: 500 }).notNull(),
	resultCount: int().default(0).notNull(),
	sessionId: varchar({ length: 255 }).notNull(),
	userId: int(),
	resultClicked: tinyint().default(0).notNull(),
	clickedResultId: int(),
	clickedResultUrl: varchar({ length: 500 }),
	durationMs: int(),
	userAgent: text(),
	referrer: varchar({ length: 500 }),
	country: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("searchAnalytics_query_idx").on(table.query),
	index("searchAnalytics_sessionId_idx").on(table.sessionId),
	index("searchAnalytics_userId_idx").on(table.userId),
]);

export const uptimeAlerts = mysqlTable("uptimeAlerts", {
	id: int().autoincrement().primaryKey(),
	monitorId: int().notNull(),
	monitorName: varchar({ length: 255 }).notNull(),
	monitorUrl: varchar({ length: 2048 }).notNull(),
	previousStatus: varchar({ length: 50 }).notNull(), // 'up' or 'down'
	currentStatus: varchar({ length: 50 }).notNull(), // 'up' or 'down'
	transitionType: mysqlEnum(['up_to_down', 'down_to_up']).notNull(),
	downtimeMinutes: int(), // How long it was down (if transitioning to up)
	downStartedAt: timestamp({ mode: 'string' }),
	downEndedAt: timestamp({ mode: 'string' }),
	teamsNotificationSent: tinyint().default(0).notNull(),
	emailNotificationSent: tinyint().default(0).notNull(),
	teamsMessageId: varchar({ length: 255 }),
	teamsChannelId: varchar({ length: 255 }),
	acknowledgedAt: timestamp({ mode: 'string' }),
	acknowledgedBy: varchar({ length: 320 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("uptimeAlerts_monitorId_idx").on(table.monitorId),
	index("uptimeAlerts_transitionType_idx").on(table.transitionType),
	index("uptimeAlerts_createdAt_idx").on(table.createdAt),
]);

export const searchSuggestions = mysqlTable("searchSuggestions", {
	id: int().autoincrement().primaryKey(),
	query: varchar({ length: 500 }).notNull(),
	suggestion: varchar({ length: 500 }).notNull(),
	frequency: int().default(1).notNull(),
	category: mysqlEnum(['blog', 'kb', 'service', 'industry', 'general']).default('general').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("searchSuggestions_query_idx").on(table.query),
	index("searchSuggestions_suggestion_idx").on(table.suggestion),
	index("searchSuggestions_category_idx").on(table.category),
]);

// ─── Inferred Types (Insert & Select) ────────────────────────────────────────
// These are derived from the table definitions above using Drizzle's type inference.
// Use these instead of manually defined interfaces to stay in sync with schema changes.

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export type TicketReply = typeof ticketReplies.$inferSelect;
export type InsertTicketReply = typeof ticketReplies.$inferInsert;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

export type CustomerInvite = typeof customerInvites.$inferSelect;
export type InsertCustomerInvite = typeof customerInvites.$inferInsert;

export type TicketFeedback = typeof ticketFeedback.$inferSelect;
export type InsertTicketFeedback = typeof ticketFeedback.$inferInsert;

export type EmailDigestPreferences = typeof emailDigestPreferences.$inferSelect;
export type InsertEmailDigestPreferences = typeof emailDigestPreferences.$inferInsert;

export type EmailDigestHistory = typeof emailDigestHistory.$inferSelect;
export type InsertEmailDigestHistory = typeof emailDigestHistory.$inferInsert;

export type KbArticleFeedback = typeof kbArticleFeedback.$inferSelect;
export type InsertKbArticleFeedback = typeof kbArticleFeedback.$inferInsert;

export type EscalationPattern = typeof escalationPatterns.$inferSelect;
export type InsertEscalationPattern = typeof escalationPatterns.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;

export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = typeof customerFeedback.$inferInsert;

export type WebsiteTraffic = typeof websiteTraffic.$inferSelect;
export type InsertWebsiteTraffic = typeof websiteTraffic.$inferInsert;

export type ChatAnalytic = typeof chatAnalytics.$inferSelect;
export type InsertChatAnalytic = typeof chatAnalytics.$inferInsert;

export type ResponseRating = typeof responseRatings.$inferSelect;
export type InsertResponseRating = typeof responseRatings.$inferInsert;

export type ConversationSummary = typeof conversationSummaries.$inferSelect;
export type InsertConversationSummary = typeof conversationSummaries.$inferInsert;

export type TeamsIntegration = typeof teamsIntegration.$inferSelect;
export type InsertTeamsIntegration = typeof teamsIntegration.$inferInsert;

export type AgentTakeoverRequest = typeof agentTakeoverRequests.$inferSelect;
export type InsertAgentTakeoverRequest = typeof agentTakeoverRequests.$inferInsert;


// ── Customer Account Management Tables ───────────────────────────────────────

export const accountAuditLog = mysqlTable("accountAuditLog", {
	id: int().autoincrement().primaryKey(),
	accountId: int().notNull().references(() => customerInvites.id, { onDelete: "cascade" }),
	action: mysqlEnum(['created','updated','deleted','restored','role_changed','resend_invitation','login','logout']).notNull(),
	performedBy: int().notNull(),
	performedByEmail: varchar({ length: 320 }).notNull(),
	changes: text(), // JSON object with before/after values
	reason: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("accountAuditLog_accountId_idx").on(table.accountId),
	index("accountAuditLog_performedBy_idx").on(table.performedBy),
	index("accountAuditLog_createdAt_idx").on(table.createdAt),
]);

export type AccountAuditLog = typeof accountAuditLog.$inferSelect;
export type InsertAccountAuditLog = typeof accountAuditLog.$inferInsert;

export const ticketAttachments = mysqlTable("ticketAttachments", {
	id: int().autoincrement().primaryKey(),
	ticketId: int().notNull().references(() => tickets.id, { onDelete: "cascade" }),
	fileName: varchar({ length: 255 }).notNull(),
	fileKey: varchar({ length: 500 }).notNull(), // S3 key
	fileUrl: varchar({ length: 2048 }).notNull(), // CDN URL
	fileMimeType: varchar({ length: 100 }).notNull(),
	fileSizeBytes: int().notNull(),
	uploadedBy: varchar({ length: 320 }), // email for public submissions
	virusScanStatus: mysqlEnum(['pending','clean','infected','error']).default('pending').notNull(),
	virusScanResult: text(), // JSON with scan details
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("ticketAttachments_ticketId_idx").on(table.ticketId),
	index("ticketAttachments_createdAt_idx").on(table.createdAt),
]);

export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketAttachment = typeof ticketAttachments.$inferInsert;




export const kbCommonIssues = mysqlTable("kbCommonIssues", {
	id: int().autoincrement().primaryKey(),
	title: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 500 }),
	icon: varchar({ length: 50 }),
	articleId: int().references(() => kbArticles.id, { onDelete: "set null" }),
	orderNum: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("kbCommonIssues_orderNum").on(table.orderNum),
]);


// ============================================
// COMMAND CENTER TABLES
// ============================================

export const commandCenterWidgets = mysqlTable("commandCenter_widgets", {
	id: int().autoincrement().notNull().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	widgetType: mysqlEnum(['uptime', 'agents', 'email', 'tickets', 'alerts', 'api_status']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	position: int().default(0).notNull(),
	isVisible: tinyint().default(1).notNull(),
	refreshInterval: int().default(30000).notNull(), // milliseconds
	config: json(), // widget-specific settings
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("commandCenter_widgets_userId").on(table.userId),
	index("commandCenter_widgets_widgetType").on(table.widgetType),
]);

export type CommandCenterWidget = typeof commandCenterWidgets.$inferSelect;
export type InsertCommandCenterWidget = typeof commandCenterWidgets.$inferInsert;

export const commandCenterCommands = mysqlTable("commandCenter_commands", {
	id: int().autoincrement().notNull().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	rawInput: varchar({ length: 1000 }).notNull(), // "Show me website uptime"
	intent: varchar({ length: 100 }).notNull(), // "query_uptime"
	entities: json(), // {domain: "gigitekai.com", period: "7d"}
	apiCalls: json(), // [{api: "uptimerobot", endpoint: "monitors", params: {...}}]
	result: json(), // {uptime: 99.9, incidents: [...]}
	executionTime: int(), // milliseconds
	status: mysqlEnum(['success', 'partial', 'failed']).default('success').notNull(),
	errorMessage: varchar({ length: 500 }),
	isSaved: tinyint().default(0).notNull(),
	commandName: varchar({ length: 255 }), // "Website Uptime Check"
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("commandCenter_commands_userId").on(table.userId),
	index("commandCenter_commands_createdAt").on(table.createdAt),
	index("commandCenter_commands_intent").on(table.intent),
	index("commandCenter_commands_isSaved").on(table.isSaved),
]);

export type CommandCenterCommand = typeof commandCenterCommands.$inferSelect;
export type InsertCommandCenterCommand = typeof commandCenterCommands.$inferInsert;

export const commandCenterAlerts = mysqlTable("commandCenter_alerts", {
	id: int().autoincrement().notNull().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(), // "Agent Offline Alert"
	condition: varchar({ length: 500 }).notNull(), // "agent_status == 'offline'"
	threshold: decimal({ precision: 10, scale: 2 }), // e.g., uptime < 95%
	isActive: tinyint().default(1).notNull(),
	notificationChannels: json(), // ["email", "teams", "sms"]
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("commandCenter_alerts_userId").on(table.userId),
	index("commandCenter_alerts_isActive").on(table.isActive),
]);

export type CommandCenterAlert = typeof commandCenterAlerts.$inferSelect;
export type InsertCommandCenterAlert = typeof commandCenterAlerts.$inferInsert;

export const commandCenterAlertsTriggered = mysqlTable("commandCenter_alerts_triggered", {
	id: int().autoincrement().notNull().primaryKey(),
	alertId: int().notNull(),
	value: decimal({ precision: 10, scale: 2 }), // actual value that triggered alert
	message: varchar({ length: 500 }),
	notificationsSent: json(), // {email: true, teams: true}
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("cc_alerts_triggered_alertId").on(table.alertId),
	index("cc_alerts_triggered_createdAt").on(table.createdAt),
	foreignKey({ columns: [table.alertId], foreignColumns: [commandCenterAlerts.id], name: "cc_alerts_trig_alertId_fk" }).onDelete("cascade"),
]);

export type CommandCenterAlertTriggered = typeof commandCenterAlertsTriggered.$inferSelect;
export type InsertCommandCenterAlertTriggered = typeof commandCenterAlertsTriggered.$inferInsert;

export const commandCenterAuditLogs = mysqlTable("commandCenter_audit_logs", {
	id: int().autoincrement().notNull().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	action: varchar({ length: 100 }).notNull(), // "query_api", "create_alert", "execute_command"
	resource: varchar({ length: 255 }), // "uptimerobot", "teams_agent_status"
	details: json(),
	result: varchar({ length: 50 }).notNull(), // "success", "failed"
	errorMessage: varchar({ length: 500 }),
	ipAddress: varchar({ length: 45 }),
	userAgent: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("commandCenter_audit_logs_userId").on(table.userId),
	index("commandCenter_audit_logs_createdAt").on(table.createdAt),
	index("commandCenter_audit_logs_action").on(table.action),
]);

export type CommandCenterAuditLog = typeof commandCenterAuditLogs.$inferSelect;
export type InsertCommandCenterAuditLog = typeof commandCenterAuditLogs.$inferInsert;

export const commandCenterApiIntegrations = mysqlTable("commandCenter_api_integrations", {
	id: int().autoincrement().notNull().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	apiName: varchar({ length: 100 }).notNull(), // "uptimerobot", "teams", "m365", "twilio"
	apiKey: varchar({ length: 500 }).notNull(), // encrypted
	apiSecret: varchar({ length: 500 }), // encrypted
	baseUrl: varchar({ length: 255 }),
	isActive: tinyint().default(1).notNull(),
	lastSyncedAt: timestamp({ mode: 'string' }),
	syncStatus: mysqlEnum(['success', 'failed', 'pending']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("commandCenter_api_integrations_userId").on(table.userId),
	index("commandCenter_api_integrations_apiName").on(table.apiName),
	// Unique constraint: one API per user per apiName
	index("commandCenter_api_integrations_unique").on(table.userId, table.apiName),
]);

export type CommandCenterApiIntegration = typeof commandCenterApiIntegrations.$inferSelect;
export type InsertCommandCenterApiIntegration = typeof commandCenterApiIntegrations.$inferInsert;

export const commandCenterSavedCommands = mysqlTable("commandCenter_saved_commands", {
	id: int().autoincrement().notNull().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(), // "Website Uptime Check"
	description: text(), // "Check gigitekai.com uptime for last 7 days"
	commandTemplate: varchar({ length: 1000 }).notNull(), // "Show me website uptime for {domain} in the last {period}"
	defaultEntities: json(), // {domain: "gigitekai.com", period: "7d"}
	category: varchar({ length: 100 }), // "monitoring", "alerts", "reporting"
	isPublic: tinyint().default(0).notNull(), // share with team
	usageCount: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("commandCenter_saved_commands_userId").on(table.userId),
	index("commandCenter_saved_commands_category").on(table.category),
	index("commandCenter_saved_commands_isPublic").on(table.isPublic),
]);

export type CommandCenterSavedCommand = typeof commandCenterSavedCommands.$inferSelect;
export type InsertCommandCenterSavedCommand = typeof commandCenterSavedCommands.$inferInsert;

export const scripts = mysqlTable("scripts", {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 50 }).notNull(),
	version: varchar({ length: 20 }).notNull(),
	author: varchar({ length: 100 }).notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	download_count: int().default(0).notNull(),
	rating: decimal({ precision: 3, scale: 2 }).default('0'),
	difficulty_level: mysqlEnum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner').notNull(),
	tags: json(),
	documentation: text(),
	github_url: varchar({ length: 500 }).notNull(),
},
(table) => [
	index("scripts_category_idx").on(table.category),
	index("scripts_name_idx").on(table.name),
]);

export const scriptExecutions = mysqlTable("scriptExecutions", {
	id: int().autoincrement().primaryKey(),
	script_id: int().notNull().references(() => scripts.id, { onDelete: "cascade" }),
	user_id: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	executed_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	status: mysqlEnum(['Success', 'Failed', 'Running']).default('Running').notNull(),
	duration_ms: int().default(0).notNull(),
	error_message: text(),
	result: json(),
},
(table) => [
	index("scriptExecutions_script_id_idx").on(table.script_id),
	index("scriptExecutions_user_id_idx").on(table.user_id),
	index("scriptExecutions_executed_at_idx").on(table.executed_at),
]);

export const scriptFeedback = mysqlTable("scriptFeedback", {
	id: int().autoincrement().primaryKey(),
	script_id: int().notNull().references(() => scripts.id, { onDelete: "cascade" }),
	user_id: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	feedback_type: mysqlEnum(['Bug', 'Feature Request', 'General']).default('General').notNull(),
	message: text().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	status: mysqlEnum(['Open', 'In Progress', 'Resolved']).default('Open').notNull(),
},
(table) => [
	index("scriptFeedback_script_id_idx").on(table.script_id),
	index("scriptFeedback_user_id_idx").on(table.user_id),
	index("scriptFeedback_status_idx").on(table.status),
]);

export type Script = typeof scripts.$inferSelect;
export type InsertScript = typeof scripts.$inferInsert;

export type ScriptExecution = typeof scriptExecutions.$inferSelect;
export type InsertScriptExecution = typeof scriptExecutions.$inferInsert;

export type ScriptFeedback = typeof scriptFeedback.$inferSelect;
export type InsertScriptFeedback = typeof scriptFeedback.$inferInsert;


// ============================================================================
// CLIENT ONBOARDING
// ============================================================================

export const clients = mysqlTable("clients", {
	id: int().autoincrement().primaryKey(),
	// Company Info
	companyName: varchar({ length: 255 }).notNull(),
	companyDomain: varchar({ length: 255 }).notNull(),
	serviceType: varchar({ length: 100 }).notNull(),
	annualContractValue: decimal({ precision: 12, scale: 2 }).notNull(),
	// Primary Contact
	contactFirstName: varchar({ length: 100 }).notNull(),
	contactLastName: varchar({ length: 100 }).notNull(),
	contactEmail: varchar({ length: 320 }).notNull(),
	contactPhone: varchar({ length: 50 }).notNull(),
	// Onboarding Status
	status: mysqlEnum(['pending', 'onboarding', 'active', 'paused', 'churned']).default('pending').notNull(),
	onboardingStep: mysqlEnum(['submitted', 'kickoff_scheduled', 'discovery', 'implementation', 'training', 'completed']).default('submitted').notNull(),
	// Metadata
	notes: text(),
	kickoffMeetingDate: timestamp({ mode: 'string' }),
	onboardingCompletedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("clients_company_domain_idx").on(table.companyDomain),
	index("clients_status_idx").on(table.status),
	index("clients_contact_email_idx").on(table.contactEmail),
]);

export const clientTimeline = mysqlTable("clientTimeline", {
	id: int().autoincrement().primaryKey(),
	clientId: int().notNull().references(() => clients.id, { onDelete: "cascade" }),
	event: varchar({ length: 100 }).notNull(),
	description: text(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("clientTimeline_client_idx").on(table.clientId),
]);

export const clientOnboardingTasks = mysqlTable("clientOnboardingTasks", {
	id: int().autoincrement().primaryKey(),
	clientId: int().notNull().references(() => clients.id, { onDelete: "cascade" }),
	category: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	status: mysqlEnum(['pending', 'in_progress', 'completed', 'blocked']).default('pending').notNull(),
	clientVisible: tinyint().default(1).notNull(),
	sortOrder: int().default(0).notNull(),
	dueDate: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("clientOnboardingTasks_client_idx").on(table.clientId),
	index("clientOnboardingTasks_status_idx").on(table.status),
]);

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
export type ClientTimelineEntry = typeof clientTimeline.$inferSelect;
export type InsertClientTimelineEntry = typeof clientTimeline.$inferInsert;
export type ClientOnboardingTask = typeof clientOnboardingTasks.$inferSelect;
export type InsertClientOnboardingTask = typeof clientOnboardingTasks.$inferInsert;


// ============================================================================
// EMAIL DIAGNOSTICS SUITE
// ============================================================================

export const emailAnalysisHistory = mysqlTable("emailAnalysisHistory", {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	domain: varchar({ length: 255 }).notNull(),
	emailAddress: varchar({ length: 320 }),
	analysisType: mysqlEnum(['header', 'dkim_spf_dmarc', 'deliverability', 'reverse_dns', 'mx_records', 'ssl_tls', 'bounce_rate', 'comprehensive']).notNull(),
	rawInput: text(), // Raw email headers or domain
	resultsJson: json().notNull(), // Full analysis results
	headerAnalysis: json(), // Parsed header data
	dkimSpfDmarcAnalysis: json(), // DKIM/SPF/DMARC validation
	deliverabilityAnalysis: json(), // Blacklist and reputation checks
	reverseDnsAnalysis: json(), // PTR records and reputation
	mxRecordsAnalysis: json(), // MX record validation
	sslTlsAnalysis: json(), // Certificate and encryption checks
	bounceRateAnalysis: json(), // Delivery pattern analysis
	overallScore: int(), // 0-100 score
	status: mysqlEnum(['pass', 'warning', 'fail']).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("emailAnalysisHistory_user_idx").on(table.userId),
	index("emailAnalysisHistory_domain_idx").on(table.domain),
	index("emailAnalysisHistory_created_idx").on(table.createdAt),
	index("emailAnalysisHistory_type_idx").on(table.analysisType),
]);

export const emailReports = mysqlTable("emailReports", {
	id: int().autoincrement().primaryKey(),
	analysisId: int().notNull().references(() => emailAnalysisHistory.id, { onDelete: "cascade" }),
	reportType: mysqlEnum(['pdf', 'email', 'html']).notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: varchar({ length: 500 }).notNull(), // S3 URL
	fileSize: int(), // bytes
	sentTo: json(), // Array of email addresses
	sentAt: timestamp({ mode: 'string' }),
	downloadCount: int().default(0).notNull(),
	lastDownloadedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("emailReports_analysis_idx").on(table.analysisId),
	index("emailReports_created_idx").on(table.createdAt),
]);

export const emailDiagnosticsCache = mysqlTable("emailDiagnosticsCache", {
	id: int().autoincrement().primaryKey(),
	cacheKey: varchar({ length: 255 }).notNull().unique(),
	toolType: mysqlEnum(['header', 'dkim_spf_dmarc', 'deliverability', 'reverse_dns', 'mx_records', 'ssl_tls', 'bounce_rate']).notNull(),
	domain: varchar({ length: 255 }).notNull(),
	resultsJson: json().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("emailDiagnosticsCache_key_idx").on(table.cacheKey),
	index("emailDiagnosticsCache_expires_idx").on(table.expiresAt),
]);

export type EmailAnalysisHistory = typeof emailAnalysisHistory.$inferSelect;
export type InsertEmailAnalysisHistory = typeof emailAnalysisHistory.$inferInsert;
export type EmailReport = typeof emailReports.$inferSelect;
export type InsertEmailReport = typeof emailReports.$inferInsert;
export type EmailDiagnosticsCache = typeof emailDiagnosticsCache.$inferSelect;
export type InsertEmailDiagnosticsCache = typeof emailDiagnosticsCache.$inferInsert;


// ============================================================================
// UPWORK INTEGRATION TABLES
// ============================================================================

export const upworkProposals = mysqlTable("upworkProposals", {
	id: int().autoincrement().notNull().primaryKey(),
	upworkProposalId: varchar({ length: 255 }).notNull().unique(),
	upworkJobId: varchar({ length: 255 }).notNull(),
	jobTitle: varchar({ length: 500 }).notNull(),
	bidAmount: decimal({ precision: 10, scale: 2 }).notNull(),
	coverLetter: text().notNull(),
	status: mysqlEnum(['pending', 'accepted', 'rejected', 'withdrawn']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("upworkProposals_upworkProposalId_idx").on(table.upworkProposalId),
	index("upworkProposals_upworkJobId_idx").on(table.upworkJobId),
	index("upworkProposals_status_idx").on(table.status),
	index("upworkProposals_created_idx").on(table.createdAt),
]);

export const upworkJobs = mysqlTable("upworkJobs", {
	id: int().autoincrement().notNull().primaryKey(),
	upworkJobId: varchar({ length: 255 }).notNull().unique(),
	title: varchar({ length: 500 }).notNull(),
	description: text().notNull(),
	category: varchar({ length: 100 }).notNull(),
	budget: decimal({ precision: 10, scale: 2 }),
	duration: varchar({ length: 50 }),
	clientRating: decimal({ precision: 3, scale: 1 }),
	clientReviews: int(),
	isRelevant: tinyint().default(0).notNull(),
	relevanceScore: int(), // 0-100
	appliedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("upworkJobs_upworkJobId_idx").on(table.upworkJobId),
	index("upworkJobs_isRelevant_idx").on(table.isRelevant),
	index("upworkJobs_created_idx").on(table.createdAt),
]);

export const upworkMessages = mysqlTable("upworkMessages", {
	id: int().autoincrement().notNull().primaryKey(),
	upworkProposalId: varchar({ length: 255 }).notNull(),
	sender: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	messageType: mysqlEnum(['text', 'system']).default('text').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("upworkMessages_proposalId_idx").on(table.upworkProposalId),
	index("upworkMessages_created_idx").on(table.createdAt),
]);

	export const formSubmissions = mysqlTable("formSubmissions", {
		id: int().autoincrement().notNull().primaryKey(),
		email: varchar({ length: 320 }).notNull(),
		name: varchar({ length: 255 }).notNull(),
		phone: varchar({ length: 50 }).notNull(),
		company: varchar({ length: 255 }),
		category: varchar({ length: 100 }).notNull(),
		message: text().notNull(),
		source: varchar({ length: 100 }).notNull(),
		status: mysqlEnum(['new', 'contacted', 'converted', 'spam']).default('new').notNull(),
		submittedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
		contactedAt: timestamp({ mode: 'string' }),
		notes: text(),
},
(table) => [
	index("formSubmissions_email_idx").on(table.email),
	index("formSubmissions_category_idx").on(table.category),
	index("formSubmissions_status_idx").on(table.status),
	index("formSubmissions_submitted_idx").on(table.submittedAt),
]);

// ─── AI News Collection & Management ────────────────────────────────────────

export const aiNewsArticles = mysqlTable("aiNewsArticles", {
	id: int().autoincrement().notNull().primaryKey(),
	title: varchar({ length: 500 }).notNull(),
	summary: text().notNull(),
	content: text(),
	category: varchar({ length: 100 }).notNull(),
	source: varchar({ length: 255 }).notNull(),
	url: varchar({ length: 768 }).notNull(),
	imageUrl: varchar({ length: 1000 }),
	publishedAt: timestamp({ mode: 'string' }).notNull(),
	fetchedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	keyTakeaways: json(),
	gigitekAiAngle: text(),
	readMoreText: varchar({ length: 255 }),
	includedInNewsletter: tinyint().default(0).notNull(),
	includedInBlog: tinyint().default(0).notNull(),
	sentAt: timestamp({ mode: 'string' }),
	clickCount: int().default(0).notNull(),
	shareCount: int().default(0).notNull(),
	viewCount: int().default(0).notNull(),
	isManuallyAdded: tinyint().default(0).notNull(),
	isArchived: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("aiNewsArticles_category_idx").on(table.category),
	index("aiNewsArticles_source_idx").on(table.source),
	index("aiNewsArticles_publishedAt_idx").on(table.publishedAt),
	index("aiNewsArticles_includedInNewsletter_idx").on(table.includedInNewsletter),
	index("aiNewsArticles_fetchedAt_idx").on(table.fetchedAt),
]);

export const newsletterSends = mysqlTable("newsletterSends", {
	id: int().autoincrement().notNull().primaryKey(),
	title: varchar({ length: 500 }).notNull(),
	description: text(),
	articleIds: json().notNull(),
	recipientCount: int().default(0).notNull(),
	sentCount: int().default(0).notNull(),
	failedCount: int().default(0).notNull(),
	openCount: int().default(0).notNull(),
	clickCount: int().default(0).notNull(),
	unsubscribeCount: int().default(0).notNull(),
	status: mysqlEnum(['draft', 'scheduled', 'sending', 'sent', 'failed']).default('draft').notNull(),
	scheduledFor: timestamp({ mode: 'string' }),
	sentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("newsletterSends_status_idx").on(table.status),
	index("newsletterSends_sentAt_idx").on(table.sentAt),
]);

export const newsEngagementMetrics = mysqlTable("newsEngagementMetrics", {
	id: int().autoincrement().notNull().primaryKey(),
	articleId: int().notNull().references(() => aiNewsArticles.id, { onDelete: "cascade" }),
	subscriberId: int().notNull().references(() => newsletterSubscribers.id, { onDelete: "cascade" }),
	action: mysqlEnum(['opened', 'clicked', 'shared', 'saved', 'reported']).notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("newsEngagementMetrics_articleId_idx").on(table.articleId),
	index("newsEngagementMetrics_subscriberId_idx").on(table.subscriberId),
	index("newsEngagementMetrics_action_idx").on(table.action),
]);

export const voicemailSourceTombstones = mysqlTable("voicemailSourceTombstones", {
	id: int().autoincrement().primaryKey(),
	source: varchar({ length: 50 }).default("m365-group").notNull(),
	groupId: varchar({ length: 255 }).notNull(),
	threadId: varchar({ length: 255 }).notNull(),
	postId: varchar({ length: 255 }),
	callLogId: int(),
	draftTicketId: int(),
	action: mysqlEnum(["deleted", "rejected", "dismissed"]).notNull(),
	reason: text(),
	createdBy: varchar({ length: 320 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("voicemailSourceTombstones_groupId_threadId").on(table.groupId, table.threadId),
	index("voicemailSourceTombstones_callLogId").on(table.callLogId),
]);

// Portal Access Requests — users request access before being approved
export const portalAccessRequests = mysqlTable("portalAccessRequests", {
	id: int().autoincrement().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	company: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	reason: text(),
	status: mysqlEnum(['pending', 'approved', 'denied']).default('pending').notNull(),
	userId: int(),
	reviewedBy: varchar({ length: 320 }),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewNote: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("portalAccessRequests_email").on(table.email),
	index("portalAccessRequests_status").on(table.status),
]);
export type PortalAccessRequest = typeof portalAccessRequests.$inferSelect;
export type InsertPortalAccessRequest = typeof portalAccessRequests.$inferInsert;

// Type exports
export type UpworkProposal = typeof upworkProposals.$inferSelect;
export type InsertUpworkProposal = typeof upworkProposals.$inferInsert;
export type UpworkJob = typeof upworkJobs.$inferSelect;
export type InsertUpworkJob = typeof upworkJobs.$inferInsert;
export type UpworkMessage = typeof upworkMessages.$inferSelect;
export type InsertUpworkMessage = typeof upworkMessages.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;
export type VoicemailSourceTombstone = typeof voicemailSourceTombstones.$inferSelect;
export type InsertVoicemailSourceTombstone = typeof voicemailSourceTombstones.$inferInsert;


// Workflow Execution History
export const workflowExecutions = mysqlTable("workflowExecutions", {
	id: int().autoincrement().primaryKey().notNull(),
	workflowId: varchar({ length: 100 }).notNull(),
	workflowName: varchar({ length: 255 }).notNull(),
	status: mysqlEnum(['pending', 'running', 'completed', 'failed', 'cancelled']).default('pending').notNull(),
	initiatedBy: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	parameters: json().notNull(),
	steps: json(), // Array of step results
	result: json(), // Final result
	errorMessage: text(),
	startedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp({ mode: 'string' }),
	duration: int(), // Duration in milliseconds
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("workflowExecutions_workflowId").on(table.workflowId),
	index("workflowExecutions_status").on(table.status),
	index("workflowExecutions_createdAt").on(table.createdAt),
]);

// Workflow Templates
export const workflowTemplates = mysqlTable("workflowTemplates", {
	id: int().autoincrement().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).notNull(),
	steps: json().notNull(), // Array of workflow steps
	parameters: json().notNull(), // Required parameters
	isActive: tinyint().default(1).notNull(),
	createdBy: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("workflowTemplates_category").on(table.category),
	index("workflowTemplates_isActive").on(table.isActive),
]);

// Type exports
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplates.$inferInsert;

// ─── Aria Logs ────────────────────────────────────────────────────────────────
export const ariaLogs = mysqlTable("aria_logs", {
  id: int().autoincrement().primaryKey(),
  userId: int("user_id"),
  question: text(),
  transcribedQuestion: text("transcribed_question"),
  response: text(),
  intent: varchar({ length: 100 }),
  sources: text(), // JSON array
  status: varchar({ length: 50 }).default("success").notNull(), // success | error | voice_error | fallback
  errorMessage: text("error_message"),
  errorCode: varchar("error_code", { length: 50 }),
  inputMethod: varchar("input_method", { length: 20 }).default("text").notNull(), // text | voice | slash_command
  responseTimeMs: int("response_time_ms"),
  modelUsed: varchar("model_used", { length: 50 }), // claude | built-in | none
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export type AriaLog = typeof ariaLogs.$inferSelect;
export type InsertAriaLog = typeof ariaLogs.$inferInsert;

// ============ Aria Sessions (for live takeover) ============
export const ariaSessions = mysqlTable("aria_sessions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  userName: varchar("user_name", { length: 255 }),
  userEmail: varchar("user_email", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active").notNull(), // active, taken_over, closed
  takenOverBy: int("taken_over_by"),
  takenOverByName: varchar("taken_over_by_name", { length: 255 }),
  takenOverAt: timestamp("taken_over_at"),
  messageCount: int("message_count").default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const ariaSessionMessages = mysqlTable("aria_session_messages", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: int("session_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // user, aria, admin
  content: text("content").notNull(),
  intent: varchar("intent", { length: 100 }),
  senderName: varchar("sender_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AriaSession = typeof ariaSessions.$inferSelect;
export type InsertAriaSession = typeof ariaSessions.$inferInsert;
export type AriaSessionMessage = typeof ariaSessionMessages.$inferSelect;

// ============ Aria Custom Intents (for training) ============
export const ariaCustomIntents = mysqlTable("aria_custom_intents", {
  id: int("id").primaryKey().autoincrement(),
  intentName: varchar("intent_name", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  responseTemplate: text("response_template"),
  action: varchar("action", { length: 100 }), // e.g., "run_procedure", "redirect", "respond"
  actionTarget: varchar("action_target", { length: 255 }), // e.g., procedure name or URL
  isActive: int("is_active").default(1).notNull(),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ariaIntentExamples = mysqlTable("aria_intent_examples", {
  id: int("id").primaryKey().autoincrement(),
  intentId: int("intent_id").notNull(),
  examplePhrase: varchar("example_phrase", { length: 500 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AriaCustomIntent = typeof ariaCustomIntents.$inferSelect;
export type InsertAriaCustomIntent = typeof ariaCustomIntents.$inferInsert;
export type AriaIntentExample = typeof ariaIntentExamples.$inferSelect;

// ============ Aria LLM Response Cache (for cost optimization) ============
export const ariaLlmCache = mysqlTable("aria_llm_cache", {
  id: int("id").primaryKey().autoincrement(),
  cacheKey: varchar("cache_key", { length: 64 }).notNull().unique(),
  question: varchar("question", { length: 500 }).notNull(),
  response: text("response").notNull(),
  intent: varchar("intent", { length: 100 }).notNull(),
  focus: varchar("focus", { length: 100 }).notNull(),
  hitCount: int("hit_count").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type AriaLlmCache = typeof ariaLlmCache.$inferSelect;
export type InsertAriaLlmCache = typeof ariaLlmCache.$inferInsert;

// ============ Aria TTS Audio Cache (for cost optimization) ============
export const ariaTtsCache = mysqlTable("aria_tts_cache", {
  id: int("id").primaryKey().autoincrement(),
  cacheKey: varchar("cache_key", { length: 64 }).notNull().unique(),
  text: varchar("text", { length: 500 }).notNull(),
  audioData: text("audio_data").notNull(),
  rate: varchar("rate", { length: 20 }).default("0%").notNull(),
  pitch: varchar("pitch", { length: 20 }).default("0%").notNull(),
  hitCount: int("hit_count").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AriaTtsCache = typeof ariaTtsCache.$inferSelect;
export type InsertAriaTtsCache = typeof ariaTtsCache.$inferInsert;

export const intakeTickets = mysqlTable("intakeTickets", {
  id: int().autoincrement().primaryKey(),
  creatorName: varchar({ length: 255 }).notNull(),
  creatorEmail: varchar({ length: 320 }).notNull(),
  subject: varchar({ length: 500 }).notNull(),
  description: text(),
  status: mysqlEnum(["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum(["low", "medium", "high"]).default("medium").notNull(),
  intakeData: json(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
});
