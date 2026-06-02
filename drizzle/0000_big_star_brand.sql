CREATE TABLE `accountAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`action` enum('created','updated','deleted','restored','role_changed','resend_invitation','login','logout') NOT NULL,
	`performedBy` int NOT NULL,
	`performedByEmail` varchar(320) NOT NULL,
	`changes` text,
	`reason` text,
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `adminCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255) NOT NULL,
	`hashedPassword` varchar(255) NOT NULL,
	`role` enum('admin','agent','viewer') NOT NULL DEFAULT 'agent',
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastLoginAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `adminMenuCustomization` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`menuOrder` json NOT NULL,
	`collapsedSections` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `adminNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`href` varchar(500),
	`priority` varchar(20) NOT NULL DEFAULT 'normal',
	`isRead` tinyint NOT NULL DEFAULT 0,
	`ticketId` int,
	`sessionId` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `agentAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`ticketId` int,
	`chatSessionId` int,
	`assignedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`completedAt` timestamp,
	`status` enum('assigned','in-progress','completed','escalated') NOT NULL DEFAULT 'assigned',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `agent_dashboard_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`live_transcript` text,
	`suggested_kb_articles` json,
	`current_sentiment` decimal(3,2),
	`sentiment_color` varchar(50),
	`suggested_responses` json,
	`is_active` tinyint DEFAULT 1,
	`session_started` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`session_ended` timestamp,
	`last_transcript_update` timestamp,
	`last_sentiment_update` timestamp,
	`last_kb_update` timestamp,
	`last_response_update` timestamp,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `agentMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`date` date NOT NULL,
	`ticketsHandled` int NOT NULL DEFAULT 0,
	`chatsHandled` int NOT NULL DEFAULT 0,
	`averageResolutionTime` int,
	`customerSatisfactionScore` varchar(10),
	`firstContactResolution` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `agent_queue_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`queue_id` int NOT NULL,
	`skill_level` int DEFAULT 1,
	`assigned_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`removed_at` timestamp
);
--> statement-breakpoint
CREATE TABLE `agent_queues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('general','senior','specialist','vip') DEFAULT 'general',
	`priority` int DEFAULT 0,
	`max_concurrent_calls` int DEFAULT 5,
	`average_wait_time` int,
	`calls_waiting` int DEFAULT 0,
	`agent_count` int DEFAULT 0,
	`skill_requirements` json,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `agentSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`isWorkingDay` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `agentTakeoverRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`visitorName` varchar(255),
	`visitorEmail` varchar(320),
	`visitorPhone` varchar(50),
	`reason` text,
	`status` enum('pending','accepted','declined','timeout') NOT NULL DEFAULT 'pending',
	`assignedAdminId` int,
	`ticketId` int,
	`conversationContext` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`acceptedAt` timestamp,
	`closedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `agentWorkload` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`assignedTickets` int NOT NULL DEFAULT 0,
	`completedTickets` int NOT NULL DEFAULT 0,
	`avgResolutionTime` decimal(8,2),
	`slaBreaches` int NOT NULL DEFAULT 0,
	`customerSatisfaction` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('available','busy','offline','on-break') NOT NULL DEFAULT 'offline',
	`specialization` varchar(255),
	`maxConcurrentTickets` int NOT NULL DEFAULT 5,
	`currentTicketCount` int NOT NULL DEFAULT 0,
	`averageResolutionTime` int,
	`customerSatisfactionScore` varchar(10),
	`totalTicketsResolved` int NOT NULL DEFAULT 0,
	`totalChatsHandled` int NOT NULL DEFAULT 0,
	`lastStatusChange` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `alertThresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(100) NOT NULL,
	`responseTimeThreshold` int NOT NULL DEFAULT 5000,
	`errorRateThreshold` int NOT NULL DEFAULT 10,
	`unprocessedTicketsThreshold` int DEFAULT 50,
	`agentAvailabilityThreshold` int DEFAULT 50,
	`slaComplianceThreshold` int DEFAULT 90,
	`enabled` tinyint NOT NULL DEFAULT 1,
	`notifyOnDegraded` tinyint NOT NULL DEFAULT 1,
	`notifyOnCritical` tinyint NOT NULL DEFAULT 1,
	`notifyOnRecovery` tinyint NOT NULL DEFAULT 1,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `blogPostTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `blogPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`readTime` varchar(50) NOT NULL,
	`published` tinyint NOT NULL DEFAULT 0,
	`authorName` varchar(255) NOT NULL DEFAULT 'GigitekAI Team',
	`featuredImage` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	`authorTitle` varchar(255),
	`authorBio` text,
	`authorAvatar` varchar(1000)
);
--> statement-breakpoint
CREATE TABLE `blogTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `bulkTicketActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionType` varchar(50) NOT NULL,
	`ticketIds` text NOT NULL,
	`assignedTo` int,
	`newPriority` varchar(20),
	`newStatus` varchar(20),
	`performedBy` int NOT NULL,
	`affectedCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `call_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`recording_id` int,
	`customer_id` int,
	`agent_id` int,
	`duration` int,
	`hold_time` int,
	`talk_time` int,
	`silence_time` int,
	`transfer_count` int DEFAULT 0,
	`initial_sentiment` decimal(3,2),
	`final_sentiment` decimal(3,2),
	`sentiment_trend` varchar(50),
	`customer_satisfaction` decimal(3,2),
	`nps_score` int,
	`effort_score` int,
	`is_resolved` tinyint DEFAULT 0,
	`resolution_time` int,
	`requires_follow_up` tinyint DEFAULT 0,
	`ai_handled_percentage` decimal(3,2),
	`ai_accuracy` decimal(3,2),
	`kb_articles_used` int DEFAULT 0,
	`estimated_cost` decimal(10,2),
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `callDraftTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callLogId` int NOT NULL,
	`callerPhone` varchar(50),
	`callerName` varchar(255),
	`callerEmail` varchar(320),
	`userId` int,
	`title` varchar(500) NOT NULL,
	`description` text,
	`category` varchar(100),
	`priority` varchar(50),
	`reviewStatus` enum('pending','approved','rejected','edited') DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`ticketId` int,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `callLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`graphCallId` varchar(255) NOT NULL,
	`callerNumber` varchar(50),
	`calleeNumber` varchar(50),
	`calleeDisplayName` varchar(255),
	`calleeUpn` varchar(320),
	`matchedUserId` int,
	`direction` enum('inbound','outbound') DEFAULT 'inbound',
	`startedAt` timestamp,
	`endedAt` timestamp,
	`durationSeconds` int,
	`hasTranscript` tinyint DEFAULT 0,
	`transcriptText` text,
	`aiSummary` text,
	`aiTitle` varchar(500),
	`aiPriority` varchar(50),
	`aiCategory` varchar(100),
	`aiConfidence` varchar(10),
	`status` enum('pending','analyzed','draft_created','ticket_created','dismissed') DEFAULT 'pending',
	`draftTicketId` int,
	`ticketId` int,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`transcriptionStatus` enum('pending','transcribing','done','failed','unavailable') DEFAULT 'unavailable',
	`acsRecordingId` varchar(255),
	`acsRecordingUrl` varchar(2048)
);
--> statement-breakpoint
CREATE TABLE `callQualityScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callLogId` int NOT NULL,
	`agentName` varchar(255),
	`agentUpn` varchar(320),
	`scoreGreeting` int,
	`scoreEmpathy` int,
	`scoreTechnical` int,
	`scoreResolution` int,
	`scoreCommunication` int,
	`scoreCompliance` int,
	`totalScore` int,
	`grade` varchar(2),
	`aiSummary` text,
	`strengths` text,
	`improvements` text,
	`modelVersion` varchar(20) NOT NULL DEFAULT 'v1',
	`scoredBy` enum('auto','manual') NOT NULL DEFAULT 'auto',
	`scoredAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `call_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`customer_id` int,
	`agent_id` int,
	`recording_url` text NOT NULL,
	`recording_key` varchar(255) NOT NULL,
	`duration` int,
	`file_size` int,
	`mime_type` varchar(100) DEFAULT 'audio/wav',
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`retention_days` int DEFAULT 90,
	`expires_at` timestamp,
	`is_transcribed` tinyint DEFAULT 0,
	`consent_given` tinyint DEFAULT 1,
	`compliance_notes` text,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `call_routing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`customer_id` int,
	`queue_id` int,
	`agent_id` int,
	`routing_reason` varchar(100),
	`sentiment_score` decimal(3,2),
	`complexity_score` decimal(3,2),
	`routing_decision` varchar(100),
	`routing_time` int,
	`routing_confidence` decimal(3,2),
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `call_transcripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recording_id` int NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`full_transcript` text NOT NULL,
	`segments` json,
	`language` varchar(10) DEFAULT 'en-US',
	`confidence` decimal(3,2),
	`keywords` json,
	`entities` json,
	`summary` text,
	`action_items` json,
	`searchable` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `cannedResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'general',
	`usageCount` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `chatAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`messageId` int NOT NULL,
	`sentiment` enum('positive','neutral','negative','angry') NOT NULL DEFAULT 'neutral',
	`sentimentScore` varchar(10),
	`intent` enum('sales','support','billing','general','complaint') NOT NULL DEFAULT 'general',
	`intentConfidence` varchar(10),
	`routedTo` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `chatLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(255),
	`interest` varchar(255),
	`conversationSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`phone` varchar(50),
	`consentEmail` tinyint NOT NULL DEFAULT 0,
	`consentPhone` tinyint NOT NULL DEFAULT 0,
	`consentText` tinyint NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `chatSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`visitorName` varchar(255),
	`visitorEmail` varchar(320),
	`visitorCompany` varchar(255),
	`visitorInterest` varchar(100),
	`escalatedToTicketId` int,
	`status` enum('active','escalated','closed') NOT NULL DEFAULT 'active',
	`messageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`closedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `chatSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatSessionId` int NOT NULL,
	`articleId` int NOT NULL,
	`suggestedBy` enum('ai','agent') NOT NULL DEFAULT 'ai',
	`suggestedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`clickedAt` timestamp,
	`helpful` tinyint,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `clientTimeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`event` varchar(100) NOT NULL,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companyDomain` varchar(255) NOT NULL,
	`serviceType` varchar(100) NOT NULL,
	`annualContractValue` decimal(12,2) NOT NULL,
	`contactFirstName` varchar(100) NOT NULL,
	`contactLastName` varchar(100) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50) NOT NULL,
	`status` enum('pending','onboarding','active','paused','churned') NOT NULL DEFAULT 'pending',
	`onboardingStep` enum('submitted','kickoff_scheduled','discovery','implementation','training','completed') NOT NULL DEFAULT 'submitted',
	`notes` text,
	`kickoffMeetingDate` timestamp,
	`onboardingCompletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `commandCenter_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`condition` varchar(500) NOT NULL,
	`threshold` decimal(10,2),
	`isActive` tinyint NOT NULL DEFAULT 1,
	`notificationChannels` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commandCenter_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commandCenter_alerts_triggered` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`value` decimal(10,2),
	`message` varchar(500),
	`notificationsSent` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `commandCenter_alerts_triggered_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commandCenter_api_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiName` varchar(100) NOT NULL,
	`apiKey` varchar(500) NOT NULL,
	`apiSecret` varchar(500),
	`baseUrl` varchar(255),
	`isActive` tinyint NOT NULL DEFAULT 1,
	`lastSyncedAt` timestamp,
	`syncStatus` enum('success','failed','pending') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commandCenter_api_integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commandCenter_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resource` varchar(255),
	`details` json,
	`result` varchar(50) NOT NULL,
	`errorMessage` varchar(500),
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `commandCenter_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commandCenter_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rawInput` varchar(1000) NOT NULL,
	`intent` varchar(100) NOT NULL,
	`entities` json,
	`apiCalls` json,
	`result` json,
	`executionTime` int,
	`status` enum('success','partial','failed') NOT NULL DEFAULT 'success',
	`errorMessage` varchar(500),
	`isSaved` tinyint NOT NULL DEFAULT 0,
	`commandName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `commandCenter_commands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commandCenter_saved_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`commandTemplate` varchar(1000) NOT NULL,
	`defaultEntities` json,
	`category` varchar(100),
	`isPublic` tinyint NOT NULL DEFAULT 0,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commandCenter_saved_commands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commandCenter_widgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`widgetType` enum('uptime','agents','email','tickets','alerts','api_status') NOT NULL,
	`title` varchar(255) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`isVisible` tinyint NOT NULL DEFAULT 1,
	`refreshInterval` int NOT NULL DEFAULT 30000,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commandCenter_widgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255),
	`contactEmail` varchar(255),
	`contactPhone` varchar(50),
	`industry` varchar(100),
	`tier` enum('starter','professional','enterprise') DEFAULT 'starter',
	`teamsChannelId` varchar(255),
	`teamsChannelName` varchar(255),
	`teamsChannelWebhookUrl` varchar(1024),
	`teamsChannelCreatedAt` timestamp,
	`notes` text,
	`isActive` tinyint DEFAULT 1,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `contactSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(255),
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`hearAboutUs` varchar(100),
	`phone` varchar(20),
	`fileKey` varchar(255),
	`fileName` varchar(255),
	`fileSize` int,
	`fileMimeType` varchar(100),
	`fileUrl` text,
	`pricingTier` varchar(50),
	`companySize` varchar(50),
	`subject` varchar(255)
);
--> statement-breakpoint
CREATE TABLE `conversationSummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`summary` text NOT NULL,
	`keyPoints` text,
	`suggestedActions` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `customRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`permissions` json NOT NULL,
	`isSystem` tinyint NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `customerFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`categories` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `customerInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviteToken` varchar(128) NOT NULL,
	`invitedEmail` varchar(320) NOT NULL,
	`invitedName` varchar(255),
	`invitedCompany` varchar(255),
	`invitedBy` int NOT NULL,
	`status` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
	`acceptedBy` int,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`acceptedAt` timestamp,
	`reminderSent` tinyint NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `customerPortalActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`action` enum('view_ticket','view_kb','submit_survey','add_comment','login','logout') NOT NULL,
	`resourceType` varchar(50),
	`resourceId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `customerPortalSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastActivityAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `demoLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(255),
	`scenario` varchar(100),
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `emailAnalysisHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`domain` varchar(255) NOT NULL,
	`emailAddress` varchar(320),
	`analysisType` enum('header','dkim_spf_dmarc','deliverability','reverse_dns','mx_records','ssl_tls','bounce_rate','comprehensive') NOT NULL,
	`rawInput` text,
	`resultsJson` json NOT NULL,
	`headerAnalysis` json,
	`dkimSpfDmarcAnalysis` json,
	`deliverabilityAnalysis` json,
	`reverseDnsAnalysis` json,
	`mxRecordsAnalysis` json,
	`sslTlsAnalysis` json,
	`bounceRateAnalysis` json,
	`overallScore` int,
	`status` enum('pass','warning','fail') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `emailDiagnosticsCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cacheKey` varchar(255) NOT NULL,
	`toolType` enum('header','dkim_spf_dmarc','deliverability','reverse_dns','mx_records','ssl_tls','bounce_rate') NOT NULL,
	`domain` varchar(255) NOT NULL,
	`resultsJson` json NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `emailDiagnosticsCache_cacheKey_unique` UNIQUE(`cacheKey`)
);
--> statement-breakpoint
CREATE TABLE `emailDigestHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`leadsCount` int NOT NULL DEFAULT 0,
	`ticketsCount` int NOT NULL DEFAULT 0,
	`approvalsCount` int NOT NULL DEFAULT 0,
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `emailDigestPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` tinyint NOT NULL DEFAULT 1,
	`frequency` enum('daily','weekly','bi-weekly','monthly') NOT NULL DEFAULT 'daily',
	`sendTime` varchar(5) NOT NULL DEFAULT '06:00',
	`includeLeads` tinyint NOT NULL DEFAULT 1,
	`includeTickets` tinyint NOT NULL DEFAULT 1,
	`includeApprovals` tinyint NOT NULL DEFAULT 1,
	`lastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `emailGroupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `emailMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`direction` varchar(20) NOT NULL,
	`from` varchar(255) NOT NULL,
	`to` varchar(1000) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`templateId` int,
	`linkedTicketId` int,
	`linkedSessionId` int,
	`status` varchar(20) NOT NULL DEFAULT 'sent',
	`messageId` varchar(255),
	`sentBy` int,
	`timestamp` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `emailMessages_messageId_unique` UNIQUE(`messageId`)
);
--> statement-breakpoint
CREATE TABLE `emailRecipientGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` varchar(50) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `emailReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`reportType` enum('pdf','email','html') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileSize` int,
	`sentTo` json,
	`sentAt` timestamp,
	`downloadCount` int NOT NULL DEFAULT 0,
	`lastDownloadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(50) NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `escalationPatterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`originalMessage` text NOT NULL,
	`detectedIntent` varchar(100) DEFAULT 'general',
	`intentConfidence` varchar(20) DEFAULT '0.5',
	`sentiment` varchar(50) DEFAULT 'neutral',
	`sentimentScore` varchar(20) DEFAULT '0.5',
	`escalationReason` varchar(255) DEFAULT 'user_requested',
	`kbArticleSuggested` tinyint DEFAULT 0,
	`kbArticleId` int,
	`ticketId` int,
	`resolvedByAgent` tinyint DEFAULT 0,
	`resolutionNotes` text,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`resolvedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `exitIntentPopups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(20),
	`companyName` varchar(255),
	`leadMagnetDownloaded` varchar(255),
	`downloadUrl` varchar(500),
	`pageUrl` varchar(500) NOT NULL,
	`emailSent` tinyint DEFAULT 0,
	`leadCaptured` tinyint DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `freeAuditSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`industry` varchar(100) NOT NULL,
	`description` text,
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`auditType` varchar(100),
	`currentChallenges` text,
	`goals` text,
	`status` enum('submitted','contacted','in_progress','completed','archived') NOT NULL DEFAULT 'submitted',
	`notes` text,
	`assignedTo` int,
	`submittedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`contactedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `healthCheckHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(100) NOT NULL,
	`status` enum('healthy','degraded','critical','offline') NOT NULL,
	`responseTime` int NOT NULL,
	`message` text,
	`metrics` json,
	`checkedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kbArticleAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`ticketsResolved` int NOT NULL DEFAULT 0,
	`avgHelpfulnessRating` decimal(3,2),
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `kbArticleComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`userEmail` varchar(320),
	`comment` text NOT NULL,
	`helpful` tinyint,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `kbArticleFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`articleId` int NOT NULL,
	`rating` enum('helpful','unhelpful') NOT NULL,
	`feedbackMessage` text,
	`sessionId` varchar(64),
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kbArticleRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int,
	`rating` int NOT NULL,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `kbArticleShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`sharedBy` int NOT NULL,
	`sharedWith` varchar(255),
	`sharedVia` enum('email','link','ticket') NOT NULL DEFAULT 'email',
	`ticketId` int,
	`message` text,
	`sharedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`viewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kbArticleTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`tag` varchar(100) NOT NULL,
	`source` varchar(50) NOT NULL DEFAULT 'manual',
	`confidence` decimal(3,2) DEFAULT '1.00',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kbArticleVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`tags` varchar(500),
	`editedBy` int,
	`changeDescription` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kbArticleViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`viewedBy` int,
	`viewedFrom` enum('kb_portal','ticket_detail','search_widget','share_link') NOT NULL DEFAULT 'kb_portal',
	`ticketId` int,
	`viewedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`timeSpent` int,
	`helpful` tinyint
);
--> statement-breakpoint
CREATE TABLE `kbArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'general',
	`tags` varchar(500),
	`isPublished` tinyint NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`viewCount` int DEFAULT 0,
	`averageRating` decimal(3,2),
	`ratingCount` int DEFAULT 0,
	`commentCount` int DEFAULT 0,
	`sourceUrl` varchar(1000),
	`externalUid` varchar(500),
	`syncSource` varchar(100),
	`lastSyncedAt` timestamp,
	`subcategory` varchar(150),
	`audience` enum('end-user','technician','admin') DEFAULT 'technician',
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'intermediate',
	`estimatedResolutionTime` varchar(50),
	`ariaEnabled` tinyint NOT NULL DEFAULT 1,
	`articleCode` varchar(20)
);
--> statement-breakpoint
CREATE TABLE `kbCommonIssues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` varchar(500),
	`icon` varchar(50),
	`articleId` int,
	`orderNum` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kbGenerationMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`totalGenerated` int DEFAULT 0,
	`totalApproved` int DEFAULT 0,
	`totalPublished` int DEFAULT 0,
	`totalRejected` int DEFAULT 0,
	`avgConfidenceScore` int DEFAULT 0,
	`avgApprovalTime` int DEFAULT 0,
	`suggestionsShown` int DEFAULT 0,
	`suggestionsUsed` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `kbGenerationQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`priority` int DEFAULT 0,
	`errorMessage` text,
	`attemptCount` int DEFAULT 0,
	`maxAttempts` int DEFAULT 3,
	`nextRetryAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `kbGenerations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`sourceTicketTitle` varchar(500) NOT NULL,
	`sourceTicketContent` text NOT NULL,
	`generatedTitle` varchar(500) NOT NULL,
	`generatedContent` text NOT NULL,
	`suggestedCategory` varchar(100) DEFAULT 'general',
	`suggestedTags` varchar(500),
	`status` enum('draft','pending_approval','approved','published','rejected') NOT NULL DEFAULT 'draft',
	`confidence` int DEFAULT 0,
	`generatedBy` varchar(50) DEFAULT 'copilot',
	`generatedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`rejectedBy` int,
	`rejectedAt` timestamp,
	`publishedArticleId` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `kbSearchQueries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(500) NOT NULL,
	`resultsCount` int NOT NULL DEFAULT 0,
	`clickedArticleId` int,
	`source` varchar(50) NOT NULL DEFAULT 'kb_portal',
	`userId` int,
	`sessionId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `knowledgeBase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`keywords` text NOT NULL,
	`priority` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `leadGenAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`assessmentLeads` int DEFAULT 0,
	`popupLeads` int DEFAULT 0,
	`formLeads` int DEFAULT 0,
	`totalLeads` int DEFAULT 0,
	`assessmentConversions` int DEFAULT 0,
	`popupConversions` int DEFAULT 0,
	`formConversions` int DEFAULT 0,
	`totalConversions` int DEFAULT 0,
	`conversionRate` decimal(5,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `magicLinkTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` datetime NOT NULL,
	`used` tinyint NOT NULL DEFAULT 0,
	`createdAt` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `meetingBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`company` varchar(255),
	`meetingDate` varchar(10) NOT NULL,
	`meetingTime` varchar(5) NOT NULL,
	`notes` text,
	`status` enum('confirmed','cancelled','rescheduled') NOT NULL DEFAULT 'confirmed',
	`cancelToken` varchar(64),
	`m365EventId` varchar(500),
	`cancelledAt` timestamp,
	`rescheduledTo` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `multiStepFormSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`employeeCount` varchar(50),
	`currentITSetup` varchar(500),
	`needsCybersecurity` tinyint DEFAULT 0,
	`needsCloud` tinyint DEFAULT 0,
	`needsHelpdesk` tinyint DEFAULT 0,
	`needsAi` tinyint DEFAULT 0,
	`otherNeeds` varchar(500),
	`formCompletedAt` timestamp,
	`leadQuality` varchar(20),
	`assignedTo` int,
	`status` varchar(20) DEFAULT 'new',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	`fileKey` varchar(255),
	`fileName` varchar(255),
	`fileSize` int,
	`fileMimeType` varchar(100),
	`fileUrl` text
);
--> statement-breakpoint
CREATE TABLE `newsletterCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	`sentCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`status` varchar(50) NOT NULL DEFAULT 'completed',
	`sentBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`scheduledAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `newsletterSubscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`unsubscribeToken` varchar(64) NOT NULL,
	`source` varchar(500),
	`active` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailNotifications` tinyint NOT NULL DEFAULT 1,
	`smsNotifications` tinyint NOT NULL DEFAULT 0,
	`inAppNotifications` tinyint NOT NULL DEFAULT 1,
	`emailFrequency` enum('immediate','daily','weekly') NOT NULL DEFAULT 'immediate',
	`smsPhoneNumber` varchar(20),
	`notifyOnTicketCreated` tinyint NOT NULL DEFAULT 1,
	`notifyOnTicketUpdated` tinyint NOT NULL DEFAULT 1,
	`notifyOnTicketResolved` tinyint NOT NULL DEFAULT 1,
	`notifyOnSurveyRequest` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `notificationQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('email','sms','in_app') NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`relatedTicketId` int,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`status` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`failureReason` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `pricingAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`pageViews` int NOT NULL DEFAULT 0,
	`tierViews` text,
	`calculatorUsed` int NOT NULL DEFAULT 0,
	`contactFormSubmitted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `pricingTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`monthlyPrice` decimal(10,2) NOT NULL,
	`annualPrice` decimal(10,2) NOT NULL,
	`isPopular` tinyint NOT NULL DEFAULT 0,
	`features` text NOT NULL,
	`maxUsers` int,
	`maxTickets` int,
	`maxStorage` int,
	`supportLevel` varchar(50),
	`slaResponse` varchar(50),
	`slaResolution` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `pushNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`auth` varchar(255) NOT NULL,
	`p256Dh` varchar(255) NOT NULL,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`endpoint` text NOT NULL,
	`p256Dh` text NOT NULL,
	`auth` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `quickAssistSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionCode` varchar(10) NOT NULL,
	`ticketId` int,
	`customerId` int,
	`initiatedBy` int NOT NULL,
	`description` text,
	`status` enum('active','ended','expired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`expiresAt` timestamp NOT NULL,
	`endedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `realtimeChatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderRole` enum('user','admin') NOT NULL,
	`message` text NOT NULL,
	`isRead` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `realtimeChatSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`adminId` int,
	`status` enum('active','closed','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`closedAt` timestamp,
	`ticketId` int
);
--> statement-breakpoint
CREATE TABLE `responseRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`messageId` int NOT NULL,
	`rating` enum('helpful','neutral','unhelpful') NOT NULL,
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `roiCalculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`tierName` varchar(255),
	`currentEmployees` int NOT NULL,
	`ticketsPerMonth` int NOT NULL,
	`avgResolutionTime` decimal(5,2) NOT NULL,
	`costPerHour` decimal(10,2) NOT NULL,
	`estimatedSavings` decimal(12,2) NOT NULL,
	`paybackPeriod` decimal(5,2),
	`roiPercentage` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `roiReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` varchar(255),
	`clientName` varchar(255),
	`periodStart` datetime NOT NULL,
	`periodEnd` datetime NOT NULL,
	`ticketCount` int NOT NULL DEFAULT 0,
	`resolvedCount` int NOT NULL DEFAULT 0,
	`avgHandleTimeMinutes` float NOT NULL,
	`aiDeflectionCount` int NOT NULL DEFAULT 0,
	`aiDeflectionRate` float NOT NULL,
	`uptimePct` float NOT NULL DEFAULT 99.9,
	`hoursFreed` float NOT NULL,
	`estimatedCostSavings` float NOT NULL,
	`avgCallQualityScore` float,
	`totalCalls` int NOT NULL DEFAULT 0,
	`voicemailCount` int NOT NULL DEFAULT 0,
	`kbArticlesCreated` int NOT NULL DEFAULT 0,
	`kbSearches` int NOT NULL DEFAULT 0,
	`snapshotAt` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `scriptExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`script_id` int NOT NULL,
	`user_id` int NOT NULL,
	`executed_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`status` enum('Success','Failed','Running') NOT NULL DEFAULT 'Running',
	`duration_ms` int NOT NULL DEFAULT 0,
	`error_message` text,
	`result` json
);
--> statement-breakpoint
CREATE TABLE `scriptFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`script_id` int NOT NULL,
	`user_id` int NOT NULL,
	`feedback_type` enum('Bug','Feature Request','General') NOT NULL DEFAULT 'General',
	`message` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`status` enum('Open','In Progress','Resolved') NOT NULL DEFAULT 'Open'
);
--> statement-breakpoint
CREATE TABLE `scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`version` varchar(20) NOT NULL,
	`author` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`download_count` int NOT NULL DEFAULT 0,
	`rating` decimal(3,2) DEFAULT '0',
	`difficulty_level` enum('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
	`tags` json,
	`documentation` text,
	`github_url` varchar(500) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `searchAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(500) NOT NULL,
	`resultCount` int NOT NULL DEFAULT 0,
	`sessionId` varchar(255) NOT NULL,
	`userId` int,
	`resultClicked` tinyint NOT NULL DEFAULT 0,
	`clickedResultId` int,
	`clickedResultUrl` varchar(500),
	`durationMs` int,
	`userAgent` text,
	`referrer` varchar(500),
	`country` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `searchIndex` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` enum('blog','kb','service','industry','page','faq','pricing','case_study') NOT NULL,
	`sourceId` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`url` varchar(500) NOT NULL,
	`metadata` text,
	`embedding` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `searchSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(500) NOT NULL,
	`suggestion` varchar(500) NOT NULL,
	`frequency` int NOT NULL DEFAULT 1,
	`category` enum('blog','kb','service','industry','general') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `securityAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(20),
	`emailSecurityScore` int NOT NULL,
	`endpointProtectionScore` int NOT NULL,
	`backupRecoveryScore` int NOT NULL,
	`identityManagementScore` int NOT NULL,
	`complianceScore` int NOT NULL,
	`overallScore` int NOT NULL,
	`riskLevel` varchar(20) NOT NULL,
	`nistCoverage` int DEFAULT 0,
	`isoCoverage` int DEFAULT 0,
	`soc2Coverage` int DEFAULT 0,
	`hipaaCoverage` int DEFAULT 0,
	`pciDssCoverage` int DEFAULT 0,
	`cmmcCoverage` int DEFAULT 0,
	`findings` json DEFAULT '[]',
	`executiveSummary` text,
	`pdfGenerated` tinyint DEFAULT 0,
	`pdfUrl` varchar(500),
	`htmlReportUrl` varchar(500),
	`leadCaptured` tinyint DEFAULT 1,
	`emailSent` tinyint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `sentiment_routing_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sentiment_min` decimal(3,2),
	`sentiment_max` decimal(3,2),
	`target_queue_id` int,
	`target_agent_id` int,
	`escalate_to_senior` tinyint DEFAULT 0,
	`priority` int DEFAULT 0,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `serviceStatusChanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(100) NOT NULL,
	`previousStatus` enum('healthy','degraded','critical','offline') NOT NULL,
	`newStatus` enum('healthy','degraded','critical','offline') NOT NULL,
	`message` text,
	`notificationsSent` int NOT NULL DEFAULT 0,
	`changedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `serviceStatusSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`service` varchar(100) NOT NULL,
	`notifyOnHealthy` tinyint NOT NULL DEFAULT 0,
	`notifyOnDegraded` tinyint NOT NULL DEFAULT 1,
	`notifyOnCritical` tinyint NOT NULL DEFAULT 1,
	`notifyOnOffline` tinyint NOT NULL DEFAULT 1,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`unsubscribeToken` varchar(64),
	`subscribedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`lastNotificationSentAt` timestamp,
	`unsubscribedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `slaConfigurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`priority` varchar(20) NOT NULL,
	`responseTimeMinutes` int NOT NULL,
	`resolutionTimeMinutes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `slaSnoozes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`snoozedUntil` timestamp NOT NULL,
	`snoozedBy` int NOT NULL,
	`reason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `slaTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`responseDeadline` timestamp NOT NULL,
	`resolutionDeadline` timestamp NOT NULL,
	`responseBreached` tinyint NOT NULL DEFAULT 0,
	`resolutionBreached` tinyint NOT NULL DEFAULT 0,
	`firstResponseAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `smsCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`message` text NOT NULL,
	`status` enum('draft','scheduled','sending','sent','paused','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdBy` int,
	`totalRecipients` int NOT NULL DEFAULT 0,
	`totalSent` int NOT NULL DEFAULT 0,
	`totalDelivered` int NOT NULL DEFAULT 0,
	`totalFailed` int NOT NULL DEFAULT 0,
	`totalOptedOut` int NOT NULL DEFAULT 0,
	`fromNumber` varchar(20),
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `smsContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`company` varchar(255),
	`source` varchar(50) NOT NULL DEFAULT 'manual',
	`optedIn` tinyint NOT NULL DEFAULT 1,
	`optedInAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`optedOutAt` timestamp,
	`optOutReason` varchar(100),
	`tags` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `smsMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`contactId` int NOT NULL,
	`toPhone` varchar(20) NOT NULL,
	`fromPhone` varchar(20) NOT NULL,
	`body` text NOT NULL,
	`status` enum('queued','sent','delivered','failed','undelivered') NOT NULL DEFAULT 'queued',
	`provider` enum('twilio','acs') NOT NULL DEFAULT 'twilio',
	`providerMessageId` varchar(100),
	`errorCode` varchar(50),
	`errorMessage` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `smsOptOuts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`contactId` int,
	`reason` varchar(100) NOT NULL DEFAULT 'STOP',
	`source` varchar(50) NOT NULL DEFAULT 'inbound',
	`processedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `socialConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('linkedin','twitter','facebook') NOT NULL,
	`accessToken` text NOT NULL,
	`accessTokenSecret` text,
	`refreshToken` text,
	`expiresAt` timestamp,
	`pageId` varchar(255),
	`personUrn` varchar(255),
	`screenName` varchar(255),
	`connectedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `socialPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`platform` enum('linkedin','twitter','facebook') NOT NULL,
	`postId` varchar(500),
	`content` text NOT NULL,
	`url` varchar(1000),
	`status` enum('published','failed','pending','scheduled','draft') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`publishedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`scheduledAt` timestamp,
	`platforms` text,
	`link` varchar(1000),
	`engagementLikes` int DEFAULT 0,
	`engagementComments` int DEFAULT 0,
	`engagementShares` int DEFAULT 0,
	`engagementLastFetched` timestamp
);
--> statement-breakpoint
CREATE TABLE `stripeCustomers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `stripe_invoices` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`stripe_invoice_id` varchar(255) NOT NULL,
	`stripe_subscription_id` varchar(255) NOT NULL,
	`stripe_customer_id` varchar(255) NOT NULL,
	`amount_cents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('draft','open','paid','void','uncollectible') NOT NULL,
	`paid_at` timestamp,
	`due_date` timestamp,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `stripe_payment_intents` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`stripe_payment_intent_id` varchar(255) NOT NULL,
	`stripe_customer_id` varchar(255) NOT NULL,
	`amount_cents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`description` text,
	`status` enum('succeeded','processing','requires_payment_method','requires_confirmation','canceled') NOT NULL,
	`metadata` text,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `stripeSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`stripeSubscriptionId` varchar(255) NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`planName` varchar(50) NOT NULL,
	`userCount` int NOT NULL,
	`isAnnual` tinyint NOT NULL DEFAULT 0,
	`status` varchar(50) NOT NULL,
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`canceledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `stripe_webhook_events` (
	`id` varchar(255) NOT NULL,
	`stripe_event_id` varchar(255) NOT NULL,
	`event_type` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`payload` text NOT NULL,
	`processed` tinyint NOT NULL DEFAULT 0,
	`processed_at` timestamp,
	`error` text,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `teamsClientChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`teamsTeamId` varchar(255) NOT NULL,
	`teamsChannelId` varchar(255) NOT NULL,
	`teamsChannelName` varchar(255) NOT NULL,
	`webhookUrl` varchar(1024),
	`provisionedBy` int,
	`provisionedAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`isActive` tinyint DEFAULT 1,
	`lastNotificationAt` timestamp,
	`notificationCount` int DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `teamsIntegration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`teamsConversationId` varchar(255) NOT NULL,
	`teamsUserId` varchar(255) NOT NULL,
	`status` enum('active','archived','synced') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `ticketActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`actorId` int NOT NULL,
	`actorName` varchar(255) NOT NULL,
	`action` varchar(100) NOT NULL,
	`fromValue` varchar(255),
	`toValue` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `ticketAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` varchar(2048) NOT NULL,
	`fileMimeType` varchar(100) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`uploadedBy` varchar(320),
	`virusScanStatus` enum('pending','clean','infected','error') NOT NULL DEFAULT 'pending',
	`virusScanResult` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `ticketFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` enum('1','2','3','4','5') NOT NULL,
	`comment` text,
	`wouldRecommend` tinyint,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `ticketKbSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`articleId` int NOT NULL,
	`relevanceScore` int DEFAULT 0,
	`suggestedBy` enum('ai','agent') NOT NULL DEFAULT 'ai',
	`suggestedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`viewedAt` timestamp,
	`usedAt` timestamp,
	`helpful` tinyint,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `ticketMerges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryTicketId` int NOT NULL,
	`mergedTicketId` int NOT NULL,
	`mergedBy` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `ticketNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `ticketReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`isStaffReply` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `ticketSurveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`submittedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`submittedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `ticketTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`stepsAttempted` text,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`category` enum('bug_report','feature_request','general_support','billing','email','printer','internet','network','other') NOT NULL DEFAULT 'general_support',
	`status` enum('open','in_progress','on_hold','resolved','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	`assignedTo` int,
	`aiCategory` varchar(100),
	`aiPriority` varchar(20),
	`aiConfidence` decimal(4,2),
	`aiReasoning` text,
	`source` varchar(50) NOT NULL DEFAULT 'web',
	`closingNotes` text,
	`closedAt` timestamp,
	`mergedInto` int,
	`requesterName` varchar(255),
	`requesterEmail` varchar(320),
	`tags` varchar(255),
	`includeChatTranscript` tinyint NOT NULL DEFAULT 1,
	`chatSessionId` varchar(100),
	`chatTranscript` text
);
--> statement-breakpoint
CREATE TABLE `uptimeAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monitorId` int NOT NULL,
	`monitorName` varchar(255) NOT NULL,
	`monitorUrl` varchar(2048) NOT NULL,
	`previousStatus` varchar(50) NOT NULL,
	`currentStatus` varchar(50) NOT NULL,
	`transitionType` enum('up_to_down','down_to_up') NOT NULL,
	`downtimeMinutes` int,
	`downStartedAt` timestamp,
	`downEndedAt` timestamp,
	`teamsNotificationSent` tinyint NOT NULL DEFAULT 0,
	`emailNotificationSent` tinyint NOT NULL DEFAULT 0,
	`teamsMessageId` varchar(255),
	`teamsChannelId` varchar(255),
	`acknowledgedAt` timestamp,
	`acknowledgedBy` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `uptimeStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(100) NOT NULL,
	`period` enum('1h','24h','7d','30d') NOT NULL,
	`uptimePercentage` decimal(5,2) NOT NULL,
	`totalChecks` int NOT NULL,
	`healthyChecks` int NOT NULL,
	`degradedChecks` int NOT NULL,
	`criticalChecks` int NOT NULL,
	`offlineChecks` int NOT NULL,
	`avgResponseTime` int,
	`calculatedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `userActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activityType` varchar(50) NOT NULL,
	`description` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `userRoleAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `userSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isOnline` tinyint NOT NULL DEFAULT 0,
	`lastActivityAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','technician') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`approved` tinyint NOT NULL DEFAULT 0,
	`deletedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `voicemailDedup` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callerPhone` varchar(50) NOT NULL,
	`transcriptHash` varchar(100) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`expiresAt` timestamp NOT NULL,
	`source` enum('email','webhook','group') NOT NULL DEFAULT 'email',
	`externalId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `websiteTraffic` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`pageUrl` varchar(500) NOT NULL,
	`pageTitle` varchar(500),
	`visitors` int NOT NULL DEFAULT 0,
	`pageViews` int NOT NULL DEFAULT 0,
	`bounceRate` decimal(5,2) DEFAULT '0',
	`avgTimeOnPage` int DEFAULT 0,
	`referrer` varchar(500),
	`country` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `xeroTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(255) NOT NULL,
	`tenantName` varchar(255),
	`accessToken` text NOT NULL,
	`refreshToken` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`scopes` text,
	`connectedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `accountAuditLog` ADD CONSTRAINT `accountAuditLog_accountId_customerInvites_id_fk` FOREIGN KEY (`accountId`) REFERENCES `customerInvites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adminMenuCustomization` ADD CONSTRAINT `adminMenuCustomization_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blogPostTags` ADD CONSTRAINT `blogPostTags_postId_blogPosts_id_fk` FOREIGN KEY (`postId`) REFERENCES `blogPosts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blogPostTags` ADD CONSTRAINT `blogPostTags_tagId_blogTags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `blogTags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientTimeline` ADD CONSTRAINT `clientTimeline_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_alerts` ADD CONSTRAINT `commandCenter_alerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_alerts_triggered` ADD CONSTRAINT `commandCenter_alerts_triggered_alertId_commandCenter_alerts_id_fk` FOREIGN KEY (`alertId`) REFERENCES `commandCenter_alerts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_api_integrations` ADD CONSTRAINT `commandCenter_api_integrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_audit_logs` ADD CONSTRAINT `commandCenter_audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_commands` ADD CONSTRAINT `commandCenter_commands_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_saved_commands` ADD CONSTRAINT `commandCenter_saved_commands_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_widgets` ADD CONSTRAINT `commandCenter_widgets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customerFeedback` ADD CONSTRAINT `customerFeedback_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customerFeedback` ADD CONSTRAINT `customerFeedback_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailAnalysisHistory` ADD CONSTRAINT `emailAnalysisHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailReports` ADD CONSTRAINT `emailReports_analysisId_emailAnalysisHistory_id_fk` FOREIGN KEY (`analysisId`) REFERENCES `emailAnalysisHistory`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbArticleComments` ADD CONSTRAINT `kbArticleComments_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbArticleRatings` ADD CONSTRAINT `kbArticleRatings_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbArticleTags` ADD CONSTRAINT `kbArticleTags_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbArticleVersions` ADD CONSTRAINT `kbArticleVersions_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbCommonIssues` ADD CONSTRAINT `kbCommonIssues_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbGenerationQueue` ADD CONSTRAINT `kbGenerationQueue_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbGenerations` ADD CONSTRAINT `kbGenerations_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scriptExecutions` ADD CONSTRAINT `scriptExecutions_script_id_scripts_id_fk` FOREIGN KEY (`script_id`) REFERENCES `scripts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scriptExecutions` ADD CONSTRAINT `scriptExecutions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scriptFeedback` ADD CONSTRAINT `scriptFeedback_script_id_scripts_id_fk` FOREIGN KEY (`script_id`) REFERENCES `scripts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scriptFeedback` ADD CONSTRAINT `scriptFeedback_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticketAttachments` ADD CONSTRAINT `ticketAttachments_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` ADD CONSTRAINT `ticketKbSuggestions_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` ADD CONSTRAINT `ticketKbSuggestions_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userActivity` ADD CONSTRAINT `userActivity_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userRoleAssignments` ADD CONSTRAINT `userRoleAssignments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userRoleAssignments` ADD CONSTRAINT `userRoleAssignments_roleId_customRoles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `customRoles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accountAuditLog_accountId_idx` ON `accountAuditLog` (`accountId`);--> statement-breakpoint
CREATE INDEX `accountAuditLog_performedBy_idx` ON `accountAuditLog` (`performedBy`);--> statement-breakpoint
CREATE INDEX `accountAuditLog_createdAt_idx` ON `accountAuditLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `adminCredentials_email_unique` ON `adminCredentials` (`email`);--> statement-breakpoint
CREATE INDEX `agent_queues_name_unique` ON `agent_queues` (`name`);--> statement-breakpoint
CREATE INDEX `agents_userId_unique` ON `agents` (`userId`);--> statement-breakpoint
CREATE INDEX `alertThresholds_service_unique` ON `alertThresholds` (`service`);--> statement-breakpoint
CREATE INDEX `blogPosts_slug_unique` ON `blogPosts` (`slug`);--> statement-breakpoint
CREATE INDEX `blogTags_name_unique` ON `blogTags` (`name`);--> statement-breakpoint
CREATE INDEX `blogTags_slug_unique` ON `blogTags` (`slug`);--> statement-breakpoint
CREATE INDEX `callLogs_graphCallId_unique` ON `callLogs` (`graphCallId`);--> statement-breakpoint
CREATE INDEX `callQualityScores_callLogId_unique` ON `callQualityScores` (`callLogId`);--> statement-breakpoint
CREATE INDEX `call_recordings_call_id_unique` ON `call_recordings` (`call_id`);--> statement-breakpoint
CREATE INDEX `chatSessions_sessionId_unique` ON `chatSessions` (`sessionId`);--> statement-breakpoint
CREATE INDEX `clientTimeline_client_idx` ON `clientTimeline` (`clientId`);--> statement-breakpoint
CREATE INDEX `clients_company_domain_idx` ON `clients` (`companyDomain`);--> statement-breakpoint
CREATE INDEX `clients_status_idx` ON `clients` (`status`);--> statement-breakpoint
CREATE INDEX `clients_contact_email_idx` ON `clients` (`contactEmail`);--> statement-breakpoint
CREATE INDEX `commandCenter_alerts_userId` ON `commandCenter_alerts` (`userId`);--> statement-breakpoint
CREATE INDEX `commandCenter_alerts_isActive` ON `commandCenter_alerts` (`isActive`);--> statement-breakpoint
CREATE INDEX `commandCenter_alerts_triggered_alertId` ON `commandCenter_alerts_triggered` (`alertId`);--> statement-breakpoint
CREATE INDEX `commandCenter_alerts_triggered_createdAt` ON `commandCenter_alerts_triggered` (`createdAt`);--> statement-breakpoint
CREATE INDEX `commandCenter_api_integrations_userId` ON `commandCenter_api_integrations` (`userId`);--> statement-breakpoint
CREATE INDEX `commandCenter_api_integrations_apiName` ON `commandCenter_api_integrations` (`apiName`);--> statement-breakpoint
CREATE INDEX `commandCenter_api_integrations_unique` ON `commandCenter_api_integrations` (`userId`,`apiName`);--> statement-breakpoint
CREATE INDEX `commandCenter_audit_logs_userId` ON `commandCenter_audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `commandCenter_audit_logs_createdAt` ON `commandCenter_audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `commandCenter_audit_logs_action` ON `commandCenter_audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `commandCenter_commands_userId` ON `commandCenter_commands` (`userId`);--> statement-breakpoint
CREATE INDEX `commandCenter_commands_createdAt` ON `commandCenter_commands` (`createdAt`);--> statement-breakpoint
CREATE INDEX `commandCenter_commands_intent` ON `commandCenter_commands` (`intent`);--> statement-breakpoint
CREATE INDEX `commandCenter_commands_isSaved` ON `commandCenter_commands` (`isSaved`);--> statement-breakpoint
CREATE INDEX `commandCenter_saved_commands_userId` ON `commandCenter_saved_commands` (`userId`);--> statement-breakpoint
CREATE INDEX `commandCenter_saved_commands_category` ON `commandCenter_saved_commands` (`category`);--> statement-breakpoint
CREATE INDEX `commandCenter_saved_commands_isPublic` ON `commandCenter_saved_commands` (`isPublic`);--> statement-breakpoint
CREATE INDEX `commandCenter_widgets_userId` ON `commandCenter_widgets` (`userId`);--> statement-breakpoint
CREATE INDEX `commandCenter_widgets_widgetType` ON `commandCenter_widgets` (`widgetType`);--> statement-breakpoint
CREATE INDEX `conversationSummaries_sessionId_unique` ON `conversationSummaries` (`sessionId`);--> statement-breakpoint
CREATE INDEX `customRoles_name_unique` ON `customRoles` (`name`);--> statement-breakpoint
CREATE INDEX `customerInvites_inviteToken_unique` ON `customerInvites` (`inviteToken`);--> statement-breakpoint
CREATE INDEX `customerPortalSessions_sessionToken_unique` ON `customerPortalSessions` (`sessionToken`);--> statement-breakpoint
CREATE INDEX `emailAnalysisHistory_user_idx` ON `emailAnalysisHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `emailAnalysisHistory_domain_idx` ON `emailAnalysisHistory` (`domain`);--> statement-breakpoint
CREATE INDEX `emailAnalysisHistory_created_idx` ON `emailAnalysisHistory` (`createdAt`);--> statement-breakpoint
CREATE INDEX `emailAnalysisHistory_type_idx` ON `emailAnalysisHistory` (`analysisType`);--> statement-breakpoint
CREATE INDEX `emailDiagnosticsCache_key_idx` ON `emailDiagnosticsCache` (`cacheKey`);--> statement-breakpoint
CREATE INDEX `emailDiagnosticsCache_expires_idx` ON `emailDiagnosticsCache` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `emailDigestPreferences_userId_unique` ON `emailDigestPreferences` (`userId`);--> statement-breakpoint
CREATE INDEX `emailReports_analysis_idx` ON `emailReports` (`analysisId`);--> statement-breakpoint
CREATE INDEX `emailReports_created_idx` ON `emailReports` (`createdAt`);--> statement-breakpoint
CREATE INDEX `unique_user_article` ON `kbArticleRatings` (`articleId`,`userId`);--> statement-breakpoint
CREATE INDEX `kbCommonIssues_orderNum` ON `kbCommonIssues` (`orderNum`);--> statement-breakpoint
CREATE INDEX `kbGenerationMetrics_date_unique` ON `kbGenerationMetrics` (`date`);--> statement-breakpoint
CREATE INDEX `token` ON `magicLinkTokens` (`token`);--> statement-breakpoint
CREATE INDEX `meetingBookings_cancelToken_unique` ON `meetingBookings` (`cancelToken`);--> statement-breakpoint
CREATE INDEX `newsletterSubscribers_email_unique` ON `newsletterSubscribers` (`email`);--> statement-breakpoint
CREATE INDEX `newsletterSubscribers_unsubscribeToken_unique` ON `newsletterSubscribers` (`unsubscribeToken`);--> statement-breakpoint
CREATE INDEX `notificationPreferences_userId_unique` ON `notificationPreferences` (`userId`);--> statement-breakpoint
CREATE INDEX `pricingAnalytics_date_unique` ON `pricingAnalytics` (`date`);--> statement-breakpoint
CREATE INDEX `pricingTiers_name_unique` ON `pricingTiers` (`name`);--> statement-breakpoint
CREATE INDEX `quickAssistSessions_sessionCode_unique` ON `quickAssistSessions` (`sessionCode`);--> statement-breakpoint
CREATE INDEX `idx_roi_period` ON `roiReports` (`periodStart`,`periodEnd`);--> statement-breakpoint
CREATE INDEX `idx_roi_client` ON `roiReports` (`clientId`);--> statement-breakpoint
CREATE INDEX `scriptExecutions_script_id_idx` ON `scriptExecutions` (`script_id`);--> statement-breakpoint
CREATE INDEX `scriptExecutions_user_id_idx` ON `scriptExecutions` (`user_id`);--> statement-breakpoint
CREATE INDEX `scriptExecutions_executed_at_idx` ON `scriptExecutions` (`executed_at`);--> statement-breakpoint
CREATE INDEX `scriptFeedback_script_id_idx` ON `scriptFeedback` (`script_id`);--> statement-breakpoint
CREATE INDEX `scriptFeedback_user_id_idx` ON `scriptFeedback` (`user_id`);--> statement-breakpoint
CREATE INDEX `scriptFeedback_status_idx` ON `scriptFeedback` (`status`);--> statement-breakpoint
CREATE INDEX `scripts_category_idx` ON `scripts` (`category`);--> statement-breakpoint
CREATE INDEX `scripts_name_idx` ON `scripts` (`name`);--> statement-breakpoint
CREATE INDEX `searchAnalytics_query_idx` ON `searchAnalytics` (`query`);--> statement-breakpoint
CREATE INDEX `searchAnalytics_sessionId_idx` ON `searchAnalytics` (`sessionId`);--> statement-breakpoint
CREATE INDEX `searchAnalytics_userId_idx` ON `searchAnalytics` (`userId`);--> statement-breakpoint
CREATE INDEX `searchIndex_contentType_sourceId_unique` ON `searchIndex` (`contentType`,`sourceId`);--> statement-breakpoint
CREATE INDEX `searchIndex_contentType_idx` ON `searchIndex` (`contentType`);--> statement-breakpoint
CREATE INDEX `searchIndex_url_idx` ON `searchIndex` (`url`);--> statement-breakpoint
CREATE INDEX `searchSuggestions_query_idx` ON `searchSuggestions` (`query`);--> statement-breakpoint
CREATE INDEX `searchSuggestions_suggestion_idx` ON `searchSuggestions` (`suggestion`);--> statement-breakpoint
CREATE INDEX `searchSuggestions_category_idx` ON `searchSuggestions` (`category`);--> statement-breakpoint
CREATE INDEX `serviceStatusSubscriptions_unsubscribeToken_unique` ON `serviceStatusSubscriptions` (`unsubscribeToken`);--> statement-breakpoint
CREATE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE INDEX `slaTracking_ticketId_unique` ON `slaTracking` (`ticketId`);--> statement-breakpoint
CREATE INDEX `socialConnections_platform_unique` ON `socialConnections` (`platform`);--> statement-breakpoint
CREATE INDEX `stripeCustomers_userId_unique` ON `stripeCustomers` (`userId`);--> statement-breakpoint
CREATE INDEX `stripeCustomers_stripeCustomerId_unique` ON `stripeCustomers` (`stripeCustomerId`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_stripe_invoice_id_unique` ON `stripe_invoices` (`stripe_invoice_id`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_user_id_idx` ON `stripe_invoices` (`user_id`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_stripe_invoice_id_idx` ON `stripe_invoices` (`stripe_invoice_id`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_stripe_subscription_id_idx` ON `stripe_invoices` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_status_idx` ON `stripe_invoices` (`status`);--> statement-breakpoint
CREATE INDEX `stripe_payment_intents_stripe_payment_intent_id_unique` ON `stripe_payment_intents` (`stripe_payment_intent_id`);--> statement-breakpoint
CREATE INDEX `stripe_payment_intents_user_id_idx` ON `stripe_payment_intents` (`user_id`);--> statement-breakpoint
CREATE INDEX `stripe_payment_intents_stripe_payment_intent_id_idx` ON `stripe_payment_intents` (`stripe_payment_intent_id`);--> statement-breakpoint
CREATE INDEX `stripe_payment_intents_status_idx` ON `stripe_payment_intents` (`status`);--> statement-breakpoint
CREATE INDEX `stripeSubscriptions_stripeSubscriptionId_unique` ON `stripeSubscriptions` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_stripe_event_id_unique` ON `stripe_webhook_events` (`stripe_event_id`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_stripe_event_id_idx` ON `stripe_webhook_events` (`stripe_event_id`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_event_type_idx` ON `stripe_webhook_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_user_id_idx` ON `stripe_webhook_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_processed_idx` ON `stripe_webhook_events` (`processed`);--> statement-breakpoint
CREATE INDEX `ticketAttachments_ticketId_idx` ON `ticketAttachments` (`ticketId`);--> statement-breakpoint
CREATE INDEX `ticketAttachments_createdAt_idx` ON `ticketAttachments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `ticketSurveys_ticketId_unique` ON `ticketSurveys` (`ticketId`);--> statement-breakpoint
CREATE INDEX `uptimeAlerts_monitorId_idx` ON `uptimeAlerts` (`monitorId`);--> statement-breakpoint
CREATE INDEX `uptimeAlerts_transitionType_idx` ON `uptimeAlerts` (`transitionType`);--> statement-breakpoint
CREATE INDEX `uptimeAlerts_createdAt_idx` ON `uptimeAlerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userSessions_userId_unique` ON `userSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `voicemailDedup_externalId_unique` ON `voicemailDedup` (`externalId`);--> statement-breakpoint
CREATE INDEX `voicemailDedup_phone_hash` ON `voicemailDedup` (`callerPhone`,`transcriptHash`);--> statement-breakpoint
CREATE INDEX `voicemailDedup_expiresAt` ON `voicemailDedup` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `xeroTokens_tenantId_unique` ON `xeroTokens` (`tenantId`);