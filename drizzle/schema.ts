import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, uniqueIndex, int, varchar, mysqlEnum, timestamp, foreignKey, json, text, date, decimal, datetime, float, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const adminCredentials = mysqlTable("adminCredentials", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 320 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	hashedPassword: varchar({ length: 255 }).notNull(),
	role: mysqlEnum(['admin','agent','viewer']).default('agent').notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastLoginAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("adminCredentials_email_unique").on(table.email),
]);

export const adminMenuCustomization = mysqlTable("adminMenuCustomization", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	menuOrder: json().notNull(),
	collapsedSections: json().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const adminNotifications = mysqlTable("adminNotifications", {
	id: int().autoincrement().notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text(),
	href: varchar({ length: 500 }),
	priority: varchar({ length: 20 }).default('normal').notNull(),
	isRead: tinyint().default(0).notNull(),
	ticketId: int(),
	sessionId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const agentAssignments = mysqlTable("agentAssignments", {
	id: int().autoincrement().notNull(),
	agentId: int().notNull(),
	ticketId: int(),
	chatSessionId: int(),
	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	completedAt: timestamp({ mode: 'string' }),
	status: mysqlEnum(['assigned','in-progress','completed','escalated']).default('assigned').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const agentMetrics = mysqlTable("agentMetrics", {
	id: int().autoincrement().notNull(),
	agentId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	ticketsHandled: int().default(0).notNull(),
	chatsHandled: int().default(0).notNull(),
	averageResolutionTime: int(),
	customerSatisfactionScore: varchar({ length: 10 }),
	firstContactResolution: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const agentSchedules = mysqlTable("agentSchedules", {
	id: int().autoincrement().notNull(),
	agentId: int().notNull(),
	dayOfWeek: int().notNull(),
	startTime: varchar({ length: 5 }).notNull(),
	endTime: varchar({ length: 5 }).notNull(),
	isWorkingDay: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const agentTakeoverRequests = mysqlTable("agentTakeoverRequests", {
	id: int().autoincrement().notNull(),
	sessionId: varchar({ length: 100 }).notNull(),
	visitorName: varchar({ length: 255 }),
	visitorEmail: varchar({ length: 320 }),
	visitorPhone: varchar({ length: 50 }),
	reason: text(),
	status: mysqlEnum(['pending','accepted','declined','timeout']).default('pending').notNull(),
	assignedAdminId: int(),
	ticketId: int(),
	conversationContext: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	acceptedAt: timestamp({ mode: 'string' }),
	closedAt: timestamp({ mode: 'string' }),
});

export const agentWorkload = mysqlTable("agentWorkload", {
	id: int().autoincrement().notNull(),
	agentId: int().notNull(),
	date: varchar({ length: 10 }).notNull(),
	assignedTickets: int().default(0).notNull(),
	completedTickets: int().default(0).notNull(),
	avgResolutionTime: decimal({ precision: 8, scale: 2 }),
	slaBreaches: int().default(0).notNull(),
	customerSatisfaction: decimal({ precision: 3, scale: 2 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const agentDashboardSessions = mysqlTable("agent_dashboard_sessions", {
	id: int().autoincrement().notNull(),
	agentId: int("agent_id").notNull(),
	callId: varchar("call_id", { length: 255 }).notNull(),
	liveTranscript: text("live_transcript"),
	suggestedKbArticles: json("suggested_kb_articles"),
	currentSentiment: decimal("current_sentiment", { precision: 3, scale: 2 }),
	sentimentColor: varchar("sentiment_color", { length: 50 }),
	suggestedResponses: json("suggested_responses"),
	isActive: tinyint("is_active").default(1),
	sessionStarted: timestamp("session_started", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	sessionEnded: timestamp("session_ended", { mode: 'string' }),
	lastTranscriptUpdate: timestamp("last_transcript_update", { mode: 'string' }),
	lastSentimentUpdate: timestamp("last_sentiment_update", { mode: 'string' }),
	lastKbUpdate: timestamp("last_kb_update", { mode: 'string' }),
	lastResponseUpdate: timestamp("last_response_update", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const agentQueueAssignments = mysqlTable("agent_queue_assignments", {
	id: int().autoincrement().notNull(),
	agentId: int("agent_id").notNull(),
	queueId: int("queue_id").notNull(),
	skillLevel: int("skill_level").default(1),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	removedAt: timestamp("removed_at", { mode: 'string' }),
});

export const agentQueues = mysqlTable("agent_queues", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("agent_queues_name_unique").on(table.name),
]);

export const agents = mysqlTable("agents", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	status: mysqlEnum(['available','busy','offline','on-break']).default('offline').notNull(),
	specialization: varchar({ length: 255 }),
	maxConcurrentTickets: int().default(5).notNull(),
	currentTicketCount: int().default(0).notNull(),
	averageResolutionTime: int(),
	customerSatisfactionScore: varchar({ length: 10 }),
	totalTicketsResolved: int().default(0).notNull(),
	totalChatsHandled: int().default(0).notNull(),
	lastStatusChange: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("agents_userId_unique").on(table.userId),
]);

export const alertThresholds = mysqlTable("alertThresholds", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("alertThresholds_service_unique").on(table.service),
]);

export const blogPostTags = mysqlTable("blogPostTags", {
	id: int().autoincrement().notNull(),
	postId: int().notNull().references(() => blogPosts.id, { onDelete: "cascade" } ),
	tagId: int().notNull().references(() => blogTags.id, { onDelete: "cascade" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const blogPosts = mysqlTable("blogPosts", {
	id: int().autoincrement().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	excerpt: text().notNull(),
	content: text().notNull(),
	category: varchar({ length: 100 }).notNull(),
	readTime: varchar({ length: 50 }).notNull(),
	published: tinyint().default(0).notNull(),
	authorName: varchar({ length: 255 }).default('GigitekAI Team').notNull(),
	featuredImage: varchar({ length: 1000 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
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
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("blogTags_name_unique").on(table.name),
	index("blogTags_slug_unique").on(table.slug),
]);

export const bulkTicketActions = mysqlTable("bulkTicketActions", {
	id: int().autoincrement().notNull(),
	actionType: varchar({ length: 50 }).notNull(),
	ticketIds: text().notNull(),
	assignedTo: int(),
	newPriority: varchar({ length: 20 }),
	newStatus: varchar({ length: 20 }),
	performedBy: int().notNull(),
	affectedCount: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const voicemailDedup = mysqlTable("voicemailDedup", {
	id: int().autoincrement().notNull(),
	callerPhone: varchar({ length: 50 }).notNull(),
	transcriptHash: varchar({ length: 100 }).notNull(), // First 50 chars of transcript
	timestamp: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(), // 24 hours from creation
	source: mysqlEnum(['email','webhook','group']).default('email').notNull(),
	externalId: varchar({ length: 255 }), // messageId, callId, or threadId
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	},
	(table) => [
		index("voicemailDedup_externalId_unique").on(table.externalId),
		index("voicemailDedup_phone_hash").on(table.callerPhone, table.transcriptHash),
		index("voicemailDedup_expiresAt").on(table.expiresAt),
	]);

export const callDraftTickets = mysqlTable("callDraftTickets", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const callLogs = mysqlTable("callLogs", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
	transcriptionStatus: mysqlEnum(['pending','transcribing','done','failed','unavailable']).default('unavailable'),
	acsRecordingId: varchar({ length: 255 }),
	acsRecordingUrl: varchar({ length: 2048 }),
},
(table) => [
	index("callLogs_graphCallId_unique").on(table.graphCallId),
]);

export const callQualityScores = mysqlTable("callQualityScores", {
	id: int().autoincrement().notNull(),
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
	scoredAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("callQualityScores_callLogId_unique").on(table.callLogId),
]);

export const callAnalytics = mysqlTable("call_analytics", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const callRecordings = mysqlTable("call_recordings", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("call_recordings_call_id_unique").on(table.callId),
]);

export const callRouting = mysqlTable("call_routing", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const callTranscripts = mysqlTable("call_transcripts", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const cannedResponses = mysqlTable("cannedResponses", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	category: varchar({ length: 100 }).default('general').notNull(),
	usageCount: int().default(0).notNull(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const chatAnalytics = mysqlTable("chatAnalytics", {
	id: int().autoincrement().notNull(),
	sessionId: varchar({ length: 100 }).notNull(),
	messageId: int().notNull(),
	sentiment: mysqlEnum(['positive','neutral','negative','angry']).default('neutral').notNull(),
	sentimentScore: varchar({ length: 10 }),
	intent: mysqlEnum(['sales','support','billing','general','complaint']).default('general').notNull(),
	intentConfidence: varchar({ length: 10 }),
	routedTo: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const chatLeads = mysqlTable("chatLeads", {
	id: int().autoincrement().notNull(),
	sessionId: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	company: varchar({ length: 255 }),
	interest: varchar({ length: 255 }),
	conversationSummary: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	phone: varchar({ length: 50 }),
	consentEmail: tinyint().default(0).notNull(),
	consentPhone: tinyint().default(0).notNull(),
	consentText: tinyint().default(0).notNull(),
});

export const chatMessages = mysqlTable("chatMessages", {
	id: int().autoincrement().notNull(),
	sessionId: varchar({ length: 100 }).notNull(),
	role: mysqlEnum(['user','assistant']).notNull(),
	message: text().notNull(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const chatSessions = mysqlTable("chatSessions", {
	id: int().autoincrement().notNull(),
	sessionId: varchar({ length: 100 }).notNull(),
	visitorName: varchar({ length: 255 }),
	visitorEmail: varchar({ length: 320 }),
	visitorCompany: varchar({ length: 255 }),
	visitorInterest: varchar({ length: 100 }),
	escalatedToTicketId: int(),
	status: mysqlEnum(['active','escalated','closed']).default('active').notNull(),
	messageCount: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	closedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("chatSessions_sessionId_unique").on(table.sessionId),
]);

export const chatSuggestions = mysqlTable("chatSuggestions", {
	id: int().autoincrement().notNull(),
	chatSessionId: int().notNull(),
	articleId: int().notNull(),
	suggestedBy: mysqlEnum(['ai','agent']).default('ai').notNull(),
	suggestedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	clickedAt: timestamp({ mode: 'string' }),
	helpful: tinyint(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const companies = mysqlTable("companies", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const contactSubmissions = mysqlTable("contactSubmissions", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	company: varchar({ length: 255 }),
	message: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
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
	id: int().autoincrement().notNull(),
	sessionId: varchar({ length: 100 }).notNull(),
	summary: text().notNull(),
	keyPoints: text(),
	suggestedActions: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("conversationSummaries_sessionId_unique").on(table.sessionId),
]);

export const customRoles = mysqlTable("customRoles", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	permissions: json().notNull(),
	isSystem: tinyint().default(0).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("customRoles_name_unique").on(table.name),
]);

export const customerFeedback = mysqlTable("customerFeedback", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull().references(() => tickets.id, { onDelete: "cascade" } ),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	rating: int().notNull(),
	comment: text(),
	categories: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const customerInvites = mysqlTable("customerInvites", {
	id: int().autoincrement().notNull(),
	inviteToken: varchar({ length: 128 }).notNull(),
	invitedEmail: varchar({ length: 320 }).notNull(),
	invitedName: varchar({ length: 255 }),
	invitedCompany: varchar({ length: 255 }),
	invitedBy: int().notNull(),
	status: mysqlEnum(['pending','accepted','expired','revoked']).default('pending').notNull(),
	acceptedBy: int(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	acceptedAt: timestamp({ mode: 'string' }),
	reminderSent: tinyint().default(0).notNull(),
},
(table) => [
	index("customerInvites_inviteToken_unique").on(table.inviteToken),
]);

export const customerPortalActivity = mysqlTable("customerPortalActivity", {
	id: int().autoincrement().notNull(),
	customerId: int().notNull(),
	action: mysqlEnum(['view_ticket','view_kb','submit_survey','add_comment','login','logout']).notNull(),
	resourceType: varchar({ length: 50 }),
	resourceId: int(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const customerPortalSessions = mysqlTable("customerPortalSessions", {
	id: int().autoincrement().notNull(),
	customerId: int().notNull(),
	sessionToken: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	lastActivityAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	ipAddress: varchar({ length: 45 }),
	userAgent: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("customerPortalSessions_sessionToken_unique").on(table.sessionToken),
]);

export const demoLeads = mysqlTable("demoLeads", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	company: varchar({ length: 255 }),
	scenario: varchar({ length: 100 }),
	message: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const emailDigestHistory = mysqlTable("emailDigestHistory", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	sentAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	leadsCount: int().default(0).notNull(),
	ticketsCount: int().default(0).notNull(),
	approvalsCount: int().default(0).notNull(),
	status: mysqlEnum(['sent','failed','pending']).default('pending').notNull(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const emailDigestPreferences = mysqlTable("emailDigestPreferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	enabled: tinyint().default(1).notNull(),
	frequency: mysqlEnum(['daily','weekly','bi-weekly','monthly']).default('daily').notNull(),
	sendTime: varchar({ length: 5 }).default('06:00').notNull(),
	includeLeads: tinyint().default(1).notNull(),
	includeTickets: tinyint().default(1).notNull(),
	includeApprovals: tinyint().default(1).notNull(),
	lastSentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("emailDigestPreferences_userId_unique").on(table.userId),
]);

export const emailGroupMembers = mysqlTable("emailGroupMembers", {
	id: int().autoincrement().notNull(),
	groupId: int().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const emailMessages = mysqlTable("emailMessages", {
	id: int().autoincrement().notNull(),
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
	timestamp: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	uniqueIndex("emailMessages_messageId_unique").on(table.messageId),
]);

export const emailRecipientGroups = mysqlTable("emailRecipientGroups", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	type: varchar({ length: 50 }).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailTemplates = mysqlTable("emailTemplates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	category: varchar({ length: 50 }).notNull(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const escalationPatterns = mysqlTable("escalationPatterns", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	resolvedAt: timestamp({ mode: 'string' }),
});

export const exitIntentPopups = mysqlTable("exitIntentPopups", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const freeAuditSubmissions = mysqlTable("freeAuditSubmissions", {
	id: int().autoincrement().notNull(),
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
	submittedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	contactedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const healthCheckHistory = mysqlTable("healthCheckHistory", {
	id: int().autoincrement().notNull(),
	service: varchar({ length: 100 }).notNull(),
	status: mysqlEnum(['healthy','degraded','critical','offline']).notNull(),
	responseTime: int().notNull(),
	message: text(),
	metrics: json(),
	checkedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const kbArticleAnalytics = mysqlTable("kbArticleAnalytics", {
	id: int().autoincrement().notNull(),
	articleId: int().notNull(),
	views: int().default(0).notNull(),
	shares: int().default(0).notNull(),
	ticketsResolved: int().default(0).notNull(),
	avgHelpfulnessRating: decimal({ precision: 3, scale: 2 }),
	lastViewedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kbArticleComments = mysqlTable("kbArticleComments", {
	id: int().autoincrement().notNull(),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	userId: int(),
	userName: varchar({ length: 255 }),
	userEmail: varchar({ length: 320 }),
	comment: text().notNull(),
	helpful: tinyint(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const kbArticleFeedback = mysqlTable("kbArticleFeedback", {
	id: int().autoincrement().notNull(),
	messageId: int().notNull(),
	articleId: int().notNull(),
	rating: mysqlEnum(['helpful','unhelpful']).notNull(),
	feedbackMessage: text(),
	sessionId: varchar({ length: 64 }),
	userId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const kbArticleRatings = mysqlTable("kbArticleRatings", {
	id: int().autoincrement().notNull(),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	userId: int(),
	rating: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("unique_user_article").on(table.articleId, table.userId),
]);

export const kbArticleShares = mysqlTable("kbArticleShares", {
	id: int().autoincrement().notNull(),
	articleId: int().notNull(),
	sharedBy: int().notNull(),
	sharedWith: varchar({ length: 255 }),
	sharedVia: mysqlEnum(['email','link','ticket']).default('email').notNull(),
	ticketId: int(),
	message: text(),
	sharedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	viewedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const kbArticleTags = mysqlTable("kbArticleTags", {
	id: int().autoincrement().notNull(),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	tag: varchar({ length: 100 }).notNull(),
	source: varchar({ length: 50 }).default('manual').notNull(),
	confidence: decimal({ precision: 3, scale: 2 }).default('1.00'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const kbArticleVersions = mysqlTable("kbArticleVersions", {
	id: int().autoincrement().notNull(),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	title: varchar({ length: 500 }).notNull(),
	content: text().notNull(),
	category: varchar({ length: 100 }).notNull(),
	tags: varchar({ length: 500 }),
	editedBy: int(),
	changeDescription: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const kbArticleViews = mysqlTable("kbArticleViews", {
	id: int().autoincrement().notNull(),
	articleId: int().notNull(),
	viewedBy: int(),
	viewedFrom: mysqlEnum(['kb_portal','ticket_detail','search_widget','share_link']).default('kb_portal').notNull(),
	ticketId: int(),
	viewedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	timeSpent: int(),
	helpful: tinyint(),
});

export const kbArticles = mysqlTable("kbArticles", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text().notNull(),
	category: varchar({ length: 100 }).default('general').notNull(),
	tags: varchar({ length: 500 }),
	isPublished: tinyint().default(0).notNull(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
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
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("kbGenerationMetrics_date_unique").on(table.date),
]);

export const kbGenerationQueue = mysqlTable("kbGenerationQueue", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull().references(() => tickets.id, { onDelete: "cascade" } ),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	priority: int().default(0),
	errorMessage: text(),
	attemptCount: int().default(0),
	maxAttempts: int().default(3),
	nextRetryAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kbGenerations = mysqlTable("kbGenerations", {
	id: int().autoincrement().notNull(),
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
	generatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	rejectionReason: text(),
	rejectedBy: int(),
	rejectedAt: timestamp({ mode: 'string' }),
	publishedArticleId: int(),
	publishedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kbSearchQueries = mysqlTable("kbSearchQueries", {
	id: int().autoincrement().notNull(),
	query: varchar({ length: 500 }).notNull(),
	resultsCount: int().default(0).notNull(),
	clickedArticleId: int(),
	source: varchar({ length: 50 }).default('kb_portal').notNull(),
	userId: int(),
	sessionId: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const knowledgeBase = mysqlTable("knowledgeBase", {
	id: int().autoincrement().notNull(),
	category: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	keywords: text().notNull(),
	priority: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const leadGenAnalytics = mysqlTable("leadGenAnalytics", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const magicLinkTokens = mysqlTable("magicLinkTokens", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 320 }).notNull(),
	token: varchar({ length: 128 }).notNull(),
	expiresAt: datetime({ mode: 'string'}).notNull(),
	used: tinyint().default(0).notNull(),
	createdAt: datetime({ mode: 'string'}).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("token").on(table.token),
]);

export const meetingBookings = mysqlTable("meetingBookings", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("meetingBookings_cancelToken_unique").on(table.cancelToken),
]);

export const multiStepFormSubmissions = mysqlTable("multiStepFormSubmissions", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 255 }).notNull(),
	firstName: varchar({ length: 100 }).notNull(),
	lastName: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	employeeCount: varchar({ length: 50 }),
	currentItSetup: varchar({ length: 500 }),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).onUpdateNow().notNull(),
	fileKey: varchar({ length: 255 }),
	fileName: varchar({ length: 255 }),
	fileSize: int(),
	fileMimeType: varchar({ length: 100 }),
	fileUrl: text(),
});

export const newsletterCampaigns = mysqlTable("newsletterCampaigns", {
	id: int().autoincrement().notNull(),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	recipientCount: int().default(0).notNull(),
	sentCount: int().default(0).notNull(),
	failedCount: int().default(0).notNull(),
	status: varchar({ length: 50 }).default('completed').notNull(),
	sentBy: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 320 }).notNull(),
	unsubscribeToken: varchar({ length: 64 }).notNull(),
	source: varchar({ length: 500 }),
	active: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("newsletterSubscribers_email_unique").on(table.email),
	index("newsletterSubscribers_unsubscribeToken_unique").on(table.unsubscribeToken),
]);

export const notificationPreferences = mysqlTable("notificationPreferences", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("notificationPreferences_userId_unique").on(table.userId),
]);

export const notificationQueue = mysqlTable("notificationQueue", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const pricingAnalytics = mysqlTable("pricingAnalytics", {
	id: int().autoincrement().notNull(),
	date: varchar({ length: 10 }).notNull(),
	pageViews: int().default(0).notNull(),
	tierViews: text(),
	calculatorUsed: int().default(0).notNull(),
	contactFormSubmitted: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("pricingAnalytics_date_unique").on(table.date),
]);

export const pricingTiers = mysqlTable("pricingTiers", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("pricingTiers_name_unique").on(table.name),
]);

export const pushNotifications = mysqlTable("pushNotifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	endpoint: text().notNull(),
	auth: varchar({ length: 255 }).notNull(),
	p256Dh: varchar({ length: 255 }).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const pushSubscriptions = mysqlTable("pushSubscriptions", {
	id: int().autoincrement().notNull(),
	sessionId: varchar({ length: 64 }).notNull(),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const quickAssistSessions = mysqlTable("quickAssistSessions", {
	id: int().autoincrement().notNull(),
	sessionCode: varchar({ length: 10 }).notNull(),
	ticketId: int(),
	customerId: int(),
	initiatedBy: int().notNull(),
	description: text(),
	status: mysqlEnum(['active','ended','expired']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	endedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("quickAssistSessions_sessionCode_unique").on(table.sessionCode),
]);

export const realtimeChatMessages = mysqlTable("realtimeChatMessages", {
	id: int().autoincrement().notNull(),
	sessionId: int().notNull(),
	senderId: int().notNull(),
	senderRole: mysqlEnum(['user','admin']).notNull(),
	message: text().notNull(),
	isRead: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const realtimeChatSessions = mysqlTable("realtimeChatSessions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	adminId: int(),
	status: mysqlEnum(['active','closed','archived']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	closedAt: timestamp({ mode: 'string' }),
	ticketId: int(),
});

export const responseRatings = mysqlTable("responseRatings", {
	id: int().autoincrement().notNull(),
	sessionId: varchar({ length: 100 }).notNull(),
	messageId: int().notNull(),
	rating: mysqlEnum(['helpful','neutral','unhelpful']).notNull(),
	feedback: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const roiCalculations = mysqlTable("roiCalculations", {
	id: int().autoincrement().notNull(),
	userId: int(),
	tierName: varchar({ length: 255 }),
	currentEmployees: int().notNull(),
	ticketsPerMonth: int().notNull(),
	avgResolutionTime: decimal({ precision: 5, scale: 2 }).notNull(),
	costPerHour: decimal({ precision: 10, scale: 2 }).notNull(),
	estimatedSavings: decimal({ precision: 12, scale: 2 }).notNull(),
	paybackPeriod: decimal({ precision: 5, scale: 2 }),
	roiPercentage: decimal({ precision: 10, scale: 2 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const roiReports = mysqlTable("roiReports", {
	id: int().autoincrement().notNull(),
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
	snapshotAt: datetime({ mode: 'string'}).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: datetime({ mode: 'string'}).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_roi_period").on(table.periodStart, table.periodEnd),
	index("idx_roi_client").on(table.clientId),
]);

export const securityAssessments = mysqlTable("securityAssessments", {
	id: int().autoincrement().notNull(),
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
	pdfGenerated: tinyint().default(0),
	pdfUrl: varchar({ length: 500 }),
	leadCaptured: tinyint().default(1),
	emailSent: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).onUpdateNow().notNull(),
});

export const sentimentRoutingRules = mysqlTable("sentiment_routing_rules", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	sentimentMin: decimal("sentiment_min", { precision: 3, scale: 2 }),
	sentimentMax: decimal("sentiment_max", { precision: 3, scale: 2 }),
	targetQueueId: int("target_queue_id"),
	targetAgentId: int("target_agent_id"),
	escalateToSenior: tinyint("escalate_to_senior").default(0),
	priority: int().default(0),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const serviceStatusChanges = mysqlTable("serviceStatusChanges", {
	id: int().autoincrement().notNull(),
	service: varchar({ length: 100 }).notNull(),
	previousStatus: mysqlEnum(['healthy','degraded','critical','offline']).notNull(),
	newStatus: mysqlEnum(['healthy','degraded','critical','offline']).notNull(),
	message: text(),
	notificationsSent: int().default(0).notNull(),
	changedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const serviceStatusSubscriptions = mysqlTable("serviceStatusSubscriptions", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 320 }).notNull(),
	service: varchar({ length: 100 }).notNull(),
	notifyOnHealthy: tinyint().default(0).notNull(),
	notifyOnDegraded: tinyint().default(1).notNull(),
	notifyOnCritical: tinyint().default(1).notNull(),
	notifyOnOffline: tinyint().default(1).notNull(),
	isActive: tinyint().default(1).notNull(),
	unsubscribeToken: varchar({ length: 64 }),
	subscribedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	lastNotificationSentAt: timestamp({ mode: 'string' }),
	unsubscribedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("serviceStatusSubscriptions_unsubscribeToken_unique").on(table.unsubscribeToken),
]);

export const settings = mysqlTable("settings", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text().notNull(),
	description: text(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("settings_key_unique").on(table.key),
]);

export const slaConfigurations = mysqlTable("slaConfigurations", {
	id: int().autoincrement().notNull(),
	category: varchar({ length: 100 }).notNull(),
	priority: varchar({ length: 20 }).notNull(),
	responseTimeMinutes: int().notNull(),
	resolutionTimeMinutes: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const slaSnoozes = mysqlTable("slaSnoozes", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull(),
	snoozedUntil: timestamp({ mode: 'string' }).notNull(),
	snoozedBy: int().notNull(),
	reason: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const slaTracking = mysqlTable("slaTracking", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull(),
	responseDeadline: timestamp({ mode: 'string' }).notNull(),
	resolutionDeadline: timestamp({ mode: 'string' }).notNull(),
	responseBreached: tinyint().default(0).notNull(),
	resolutionBreached: tinyint().default(0).notNull(),
	firstResponseAt: timestamp({ mode: 'string' }),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("slaTracking_ticketId_unique").on(table.ticketId),
]);

export const smsCampaigns = mysqlTable("smsCampaigns", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const smsContacts = mysqlTable("smsContacts", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	email: varchar({ length: 320 }),
	company: varchar({ length: 255 }),
	source: varchar({ length: 50 }).default('manual').notNull(),
	optedIn: tinyint().default(1).notNull(),
	optedInAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	optedOutAt: timestamp({ mode: 'string' }),
	optOutReason: varchar({ length: 100 }),
	tags: json(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const smsMessages = mysqlTable("smsMessages", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const smsOptOuts = mysqlTable("smsOptOuts", {
	id: int().autoincrement().notNull(),
	phone: varchar({ length: 20 }).notNull(),
	contactId: int(),
	reason: varchar({ length: 100 }).default('STOP').notNull(),
	source: varchar({ length: 50 }).default('inbound').notNull(),
	processedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const socialConnections = mysqlTable("socialConnections", {
	id: int().autoincrement().notNull(),
	platform: mysqlEnum(['linkedin','twitter','facebook']).notNull(),
	accessToken: text().notNull(),
	accessTokenSecret: text(),
	refreshToken: text(),
	expiresAt: timestamp({ mode: 'string' }),
	pageId: varchar({ length: 255 }),
	personUrn: varchar({ length: 255 }),
	screenName: varchar({ length: 255 }),
	connectedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("socialConnections_platform_unique").on(table.platform),
]);

export const socialPosts = mysqlTable("socialPosts", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 500 }).notNull(),
	platform: mysqlEnum(['linkedin','twitter','facebook']).notNull(),
	postId: varchar({ length: 500 }),
	content: text().notNull(),
	url: varchar({ length: 1000 }),
	status: mysqlEnum(['published','failed','pending','scheduled','draft']).default('pending').notNull(),
	errorMessage: text(),
	publishedAt: timestamp({ mode: 'string' }),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	platforms: text(),
	link: varchar({ length: 1000 }),
	engagementLikes: int().default(0),
	engagementComments: int().default(0),
	engagementShares: int().default(0),
	engagementLastFetched: timestamp({ mode: 'string' }),
});

export const stripeCustomers = mysqlTable("stripeCustomers", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	stripeCustomerId: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("stripeCustomers_userId_unique").on(table.userId),
	index("stripeCustomers_stripeCustomerId_unique").on(table.stripeCustomerId),
]);

export const stripeSubscriptions = mysqlTable("stripeSubscriptions", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("stripe_webhook_events_stripe_event_id_unique").on(table.stripeEventId),
	index("stripe_webhook_events_stripe_event_id_idx").on(table.stripeEventId),
	index("stripe_webhook_events_event_type_idx").on(table.eventType),
	index("stripe_webhook_events_user_id_idx").on(table.userId),
	index("stripe_webhook_events_processed_idx").on(table.processed),
]);

export const teamsClientChannels = mysqlTable("teamsClientChannels", {
	id: int().autoincrement().notNull(),
	companyId: int().notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	teamsTeamId: varchar({ length: 255 }).notNull(),
	teamsChannelId: varchar({ length: 255 }).notNull(),
	teamsChannelName: varchar({ length: 255 }).notNull(),
	webhookUrl: varchar({ length: 1024 }),
	provisionedBy: int(),
	provisionedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	isActive: tinyint().default(1),
	lastNotificationAt: timestamp({ mode: 'string' }),
	notificationCount: int().default(0),
});

export const teamsIntegration = mysqlTable("teamsIntegration", {
	id: int().autoincrement().notNull(),
	sessionId: varchar({ length: 100 }).notNull(),
	teamsConversationId: varchar({ length: 255 }).notNull(),
	teamsUserId: varchar({ length: 255 }).notNull(),
	status: mysqlEnum(['active','archived','synced']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const ticketActivity = mysqlTable("ticketActivity", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull(),
	actorId: int().notNull(),
	actorName: varchar({ length: 255 }).notNull(),
	action: varchar({ length: 100 }).notNull(),
	fromValue: varchar({ length: 255 }),
	toValue: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const ticketFeedback = mysqlTable("ticketFeedback", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull(),
	userId: int().notNull(),
	rating: mysqlEnum(['1','2','3','4','5']).notNull(),
	comment: text(),
	wouldRecommend: tinyint(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const ticketKbSuggestions = mysqlTable("ticketKbSuggestions", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull().references(() => tickets.id, { onDelete: "cascade" } ),
	articleId: int().notNull().references(() => kbArticles.id, { onDelete: "cascade" } ),
	relevanceScore: int().default(0),
	suggestedBy: mysqlEnum(['ai','agent']).default('ai').notNull(),
	suggestedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	viewedAt: timestamp({ mode: 'string' }),
	usedAt: timestamp({ mode: 'string' }),
	helpful: tinyint(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const ticketMerges = mysqlTable("ticketMerges", {
	id: int().autoincrement().notNull(),
	primaryTicketId: int().notNull(),
	mergedTicketId: int().notNull(),
	mergedBy: int().notNull(),
	reason: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const ticketNotes = mysqlTable("ticketNotes", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull(),
	authorId: int().notNull(),
	authorName: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const ticketReplies = mysqlTable("ticketReplies", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull(),
	userId: int().notNull(),
	message: text().notNull(),
	isStaffReply: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const ticketSurveys = mysqlTable("ticketSurveys", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull(),
	rating: int().notNull(),
	comment: text(),
	submittedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	submittedBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("ticketSurveys_ticketId_unique").on(table.ticketId),
]);

export const ticketTemplates = mysqlTable("ticketTemplates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	category: varchar({ length: 100 }).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const tickets = mysqlTable("tickets", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	stepsAttempted: text(),
	priority: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	category: mysqlEnum(['bug_report','feature_request','general_support','billing','email','printer','internet','network','other']).default('general_support').notNull(),
	status: mysqlEnum(['open','in_progress','on_hold','resolved','closed']).default('open').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
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
	id: int().autoincrement().notNull(),
	service: varchar({ length: 100 }).notNull(),
	period: mysqlEnum(['1h','24h','7d','30d']).notNull(),
	uptimePercentage: decimal({ precision: 5, scale: 2 }).notNull(),
	totalChecks: int().notNull(),
	healthyChecks: int().notNull(),
	degradedChecks: int().notNull(),
	criticalChecks: int().notNull(),
	offlineChecks: int().notNull(),
	avgResponseTime: int(),
	calculatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const userActivity = mysqlTable("userActivity", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	activityType: varchar({ length: 50 }).notNull(),
	description: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const userRoleAssignments = mysqlTable("userRoleAssignments", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	roleId: int().notNull().references(() => customRoles.id, { onDelete: "cascade" } ),
	assignedBy: int().notNull(),
	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const userSessions = mysqlTable("userSessions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	isOnline: tinyint().default(0).notNull(),
	lastActivityAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("userSessions_userId_unique").on(table.userId),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','technician']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	approved: tinyint().default(0).notNull(),
	deletedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const websiteTraffic = mysqlTable("websiteTraffic", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const xeroTokens = mysqlTable("xeroTokens", {
	id: int().autoincrement().notNull(),
	tenantId: varchar({ length: 255 }).notNull(),
	tenantName: varchar({ length: 255 }),
	accessToken: text().notNull(),
	refreshToken: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	scopes: text(),
	connectedBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("xeroTokens_tenantId_unique").on(table.tenantId),
]);


// ── Search Index Tables ──────────────────────────────────────────────────────

export const searchIndex = mysqlTable("searchIndex", {
	id: int().autoincrement().notNull(),
	contentType: mysqlEnum(['blog', 'kb', 'service', 'industry', 'page', 'faq', 'pricing', 'case_study']).notNull(),
	sourceId: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	excerpt: text().notNull(),
	content: text().notNull(),
	url: varchar({ length: 500 }).notNull(),
	metadata: text(), // JSON stringified
	embedding: text(), // JSON stringified embedding vector
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("searchIndex_contentType_sourceId_unique").on(table.contentType, table.sourceId),
	index("searchIndex_contentType_idx").on(table.contentType),
	index("searchIndex_url_idx").on(table.url),
]);

export const searchAnalytics = mysqlTable("searchAnalytics", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("searchAnalytics_query_idx").on(table.query),
	index("searchAnalytics_sessionId_idx").on(table.sessionId),
	index("searchAnalytics_userId_idx").on(table.userId),
]);

export const uptimeAlerts = mysqlTable("uptimeAlerts", {
	id: int().autoincrement().notNull(),
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
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("uptimeAlerts_monitorId_idx").on(table.monitorId),
	index("uptimeAlerts_transitionType_idx").on(table.transitionType),
	index("uptimeAlerts_createdAt_idx").on(table.createdAt),
]);

export const searchSuggestions = mysqlTable("searchSuggestions", {
	id: int().autoincrement().notNull(),
	query: varchar({ length: 500 }).notNull(),
	suggestion: varchar({ length: 500 }).notNull(),
	frequency: int().default(1).notNull(),
	category: mysqlEnum(['blog', 'kb', 'service', 'industry', 'general']).default('general').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
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
	id: int().autoincrement().notNull(),
	accountId: int().notNull().references(() => customerInvites.id, { onDelete: "cascade" }),
	action: mysqlEnum(['created','updated','deleted','restored','role_changed','resend_invitation','login','logout']).notNull(),
	performedBy: int().notNull(),
	performedByEmail: varchar({ length: 320 }).notNull(),
	changes: text(), // JSON object with before/after values
	reason: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("accountAuditLog_accountId_idx").on(table.accountId),
	index("accountAuditLog_performedBy_idx").on(table.performedBy),
	index("accountAuditLog_createdAt_idx").on(table.createdAt),
]);

export type AccountAuditLog = typeof accountAuditLog.$inferSelect;
export type InsertAccountAuditLog = typeof accountAuditLog.$inferInsert;

export const ticketAttachments = mysqlTable("ticketAttachments", {
	id: int().autoincrement().notNull(),
	ticketId: int().notNull().references(() => tickets.id, { onDelete: "cascade" }),
	fileName: varchar({ length: 255 }).notNull(),
	fileKey: varchar({ length: 500 }).notNull(), // S3 key
	fileUrl: varchar({ length: 2048 }).notNull(), // CDN URL
	fileMimeType: varchar({ length: 100 }).notNull(),
	fileSizeBytes: int().notNull(),
	uploadedBy: varchar({ length: 320 }), // email for public submissions
	virusScanStatus: mysqlEnum(['pending','clean','infected','error']).default('pending').notNull(),
	virusScanResult: text(), // JSON with scan details
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("ticketAttachments_ticketId_idx").on(table.ticketId),
	index("ticketAttachments_createdAt_idx").on(table.createdAt),
]);

export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketAttachment = typeof ticketAttachments.$inferInsert;




export const kbCommonIssues = mysqlTable("kbCommonIssues", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 500 }),
	icon: varchar({ length: 50 }),
	articleId: int().references(() => kbArticles.id, { onDelete: "set null" }),
	orderNum: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("kbCommonIssues_orderNum").on(table.orderNum),
]);
