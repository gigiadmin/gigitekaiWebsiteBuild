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
CREATE TABLE `kbArticleRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int,
	`rating` int NOT NULL,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
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
CREATE TABLE `magicLinkTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` datetime NOT NULL,
	`used` tinyint NOT NULL DEFAULT 0,
	`createdAt` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
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
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
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
ALTER TABLE `adminCredentials` DROP INDEX `adminCredentials_email_unique`;--> statement-breakpoint
ALTER TABLE `agent_queues` DROP INDEX `agent_queues_name_unique`;--> statement-breakpoint
ALTER TABLE `agents` DROP INDEX `agents_userId_unique`;--> statement-breakpoint
ALTER TABLE `alertThresholds` DROP INDEX `alertThresholds_service_unique`;--> statement-breakpoint
ALTER TABLE `blogPosts` DROP INDEX `blogPosts_slug_unique`;--> statement-breakpoint
ALTER TABLE `blogTags` DROP INDEX `blogTags_name_unique`;--> statement-breakpoint
ALTER TABLE `blogTags` DROP INDEX `blogTags_slug_unique`;--> statement-breakpoint
ALTER TABLE `callLogs` DROP INDEX `callLogs_graphCallId_unique`;--> statement-breakpoint
ALTER TABLE `call_recordings` DROP INDEX `call_recordings_call_id_unique`;--> statement-breakpoint
ALTER TABLE `chatSessions` DROP INDEX `chatSessions_sessionId_unique`;--> statement-breakpoint
ALTER TABLE `conversationSummaries` DROP INDEX `conversationSummaries_sessionId_unique`;--> statement-breakpoint
ALTER TABLE `customRoles` DROP INDEX `customRoles_name_unique`;--> statement-breakpoint
ALTER TABLE `customerInvites` DROP INDEX `customerInvites_inviteToken_unique`;--> statement-breakpoint
ALTER TABLE `customerPortalSessions` DROP INDEX `customerPortalSessions_sessionToken_unique`;--> statement-breakpoint
ALTER TABLE `emailDigestPreferences` DROP INDEX `emailDigestPreferences_userId_unique`;--> statement-breakpoint
ALTER TABLE `kbGenerationMetrics` DROP INDEX `kbGenerationMetrics_date_unique`;--> statement-breakpoint
ALTER TABLE `meetingBookings` DROP INDEX `meetingBookings_cancelToken_unique`;--> statement-breakpoint
ALTER TABLE `newsletterSubscribers` DROP INDEX `newsletterSubscribers_email_unique`;--> statement-breakpoint
ALTER TABLE `newsletterSubscribers` DROP INDEX `newsletterSubscribers_unsubscribeToken_unique`;--> statement-breakpoint
ALTER TABLE `notificationPreferences` DROP INDEX `notificationPreferences_userId_unique`;--> statement-breakpoint
ALTER TABLE `pricingAnalytics` DROP INDEX `pricingAnalytics_date_unique`;--> statement-breakpoint
ALTER TABLE `pricingTiers` DROP INDEX `pricingTiers_name_unique`;--> statement-breakpoint
ALTER TABLE `quickAssistSessions` DROP INDEX `quickAssistSessions_sessionCode_unique`;--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` DROP INDEX `serviceStatusSubscriptions_unsubscribeToken_unique`;--> statement-breakpoint
ALTER TABLE `slaTracking` DROP INDEX `slaTracking_ticketId_unique`;--> statement-breakpoint
ALTER TABLE `socialConnections` DROP INDEX `socialConnections_platform_unique`;--> statement-breakpoint
ALTER TABLE `stripeCustomers` DROP INDEX `stripeCustomers_userId_unique`;--> statement-breakpoint
ALTER TABLE `stripeCustomers` DROP INDEX `stripeCustomers_stripeCustomerId_unique`;--> statement-breakpoint
ALTER TABLE `stripeSubscriptions` DROP INDEX `stripeSubscriptions_stripeSubscriptionId_unique`;--> statement-breakpoint
ALTER TABLE `ticketSurveys` DROP INDEX `ticketSurveys_ticketId_unique`;--> statement-breakpoint
ALTER TABLE `userSessions` DROP INDEX `userSessions_userId_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `xeroTokens` DROP INDEX `xeroTokens_tenantId_unique`;--> statement-breakpoint
ALTER TABLE `adminCredentials` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `adminMenuCustomization` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `adminNotifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agentAssignments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agent_dashboard_sessions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agentMetrics` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agent_queue_assignments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agent_queues` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agentSchedules` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agentTakeoverRequests` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agentWorkload` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agents` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `alertThresholds` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `blogPostTags` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `blogPosts` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `blogTags` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `bulkTicketActions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `call_analytics` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `callDraftTickets` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `callLogs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `call_recordings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `call_routing` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `call_transcripts` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `cannedResponses` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chatAnalytics` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chatLeads` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chatMessages` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chatSessions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `chatSuggestions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `companies` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `contactSubmissions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `conversationSummaries` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `customRoles` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `customerFeedback` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `customerInvites` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `customerPortalActivity` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `customerPortalSessions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `demoLeads` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emailDigestHistory` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emailDigestPreferences` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emailGroupMembers` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emailMessages` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emailRecipientGroups` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emailTemplates` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `escalationPatterns` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `exitIntentPopups` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `healthCheckHistory` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbArticleAnalytics` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbArticleFeedback` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbArticleShares` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbArticleTags` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbArticleVersions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbArticleViews` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbArticles` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbGenerationMetrics` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbGenerationQueue` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbGenerations` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kbSearchQueries` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `knowledgeBase` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `leadGenAnalytics` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `meetingBookings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `newsletterCampaigns` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `newsletterSubscribers` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `notificationPreferences` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `notificationQueue` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `pricingAnalytics` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `pricingTiers` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `pushNotifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `pushSubscriptions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `quickAssistSessions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `realtimeChatMessages` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `realtimeChatSessions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `responseRatings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `roiCalculations` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `securityAssessments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `sentiment_routing_rules` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `serviceStatusChanges` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `slaConfigurations` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `slaSnoozes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `slaTracking` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `smsCampaigns` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `smsContacts` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `smsMessages` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `smsOptOuts` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `socialConnections` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `socialPosts` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `stripeCustomers` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `stripeSubscriptions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `teamsClientChannels` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `teamsIntegration` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ticketActivity` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ticketFeedback` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ticketMerges` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ticketNotes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ticketReplies` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ticketSurveys` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ticketTemplates` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tickets` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `uptimeStatistics` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `userActivity` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `userRoleAssignments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `userSessions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `websiteTraffic` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `xeroTokens` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `adminCredentials` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `adminCredentials` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `adminNotifications` MODIFY COLUMN `isRead` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `adminNotifications` MODIFY COLUMN `isRead` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `adminNotifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agentAssignments` MODIFY COLUMN `assignedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agentAssignments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agent_dashboard_sessions` MODIFY COLUMN `is_active` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `agent_dashboard_sessions` MODIFY COLUMN `session_started` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agent_dashboard_sessions` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agentMetrics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agent_queue_assignments` MODIFY COLUMN `assigned_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agent_queues` MODIFY COLUMN `is_active` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `agent_queues` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agentSchedules` MODIFY COLUMN `isWorkingDay` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `agentSchedules` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agentTakeoverRequests` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agentWorkload` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agents` MODIFY COLUMN `lastStatusChange` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `agents` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `alertThresholds` MODIFY COLUMN `enabled` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `alertThresholds` MODIFY COLUMN `notifyOnDegraded` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `alertThresholds` MODIFY COLUMN `notifyOnCritical` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `alertThresholds` MODIFY COLUMN `notifyOnRecovery` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `alertThresholds` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `blogPostTags` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `blogPosts` MODIFY COLUMN `published` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `blogPosts` MODIFY COLUMN `published` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `blogPosts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `blogTags` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `bulkTicketActions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `call_analytics` MODIFY COLUMN `is_resolved` tinyint;--> statement-breakpoint
ALTER TABLE `call_analytics` MODIFY COLUMN `is_resolved` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `call_analytics` MODIFY COLUMN `requires_follow_up` tinyint;--> statement-breakpoint
ALTER TABLE `call_analytics` MODIFY COLUMN `requires_follow_up` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `call_analytics` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `callDraftTickets` MODIFY COLUMN `createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `callLogs` MODIFY COLUMN `hasTranscript` tinyint;--> statement-breakpoint
ALTER TABLE `callLogs` MODIFY COLUMN `hasTranscript` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `callLogs` MODIFY COLUMN `createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `call_recordings` MODIFY COLUMN `is_transcribed` tinyint;--> statement-breakpoint
ALTER TABLE `call_recordings` MODIFY COLUMN `is_transcribed` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `call_recordings` MODIFY COLUMN `consent_given` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `call_recordings` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `call_routing` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `call_transcripts` MODIFY COLUMN `searchable` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `call_transcripts` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `cannedResponses` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `chatAnalytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `chatLeads` MODIFY COLUMN `consentEmail` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `chatLeads` MODIFY COLUMN `consentEmail` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `chatLeads` MODIFY COLUMN `consentPhone` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `chatLeads` MODIFY COLUMN `consentPhone` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `chatLeads` MODIFY COLUMN `consentText` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `chatLeads` MODIFY COLUMN `consentText` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `chatLeads` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `chatMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `chatSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `chatSuggestions` MODIFY COLUMN `suggestedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `chatSuggestions` MODIFY COLUMN `helpful` tinyint;--> statement-breakpoint
ALTER TABLE `chatSuggestions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `isActive` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `contactSubmissions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `conversationSummaries` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `customRoles` MODIFY COLUMN `isSystem` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `customRoles` MODIFY COLUMN `isSystem` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `customRoles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `customerFeedback` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `customerInvites` MODIFY COLUMN `reminderSent` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `customerInvites` MODIFY COLUMN `reminderSent` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `customerInvites` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `customerPortalActivity` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `customerPortalSessions` MODIFY COLUMN `lastActivityAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `customerPortalSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `demoLeads` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailDigestHistory` MODIFY COLUMN `sentAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailDigestHistory` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailDigestPreferences` MODIFY COLUMN `enabled` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `emailDigestPreferences` MODIFY COLUMN `includeLeads` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `emailDigestPreferences` MODIFY COLUMN `includeTickets` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `emailDigestPreferences` MODIFY COLUMN `includeApprovals` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `emailDigestPreferences` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailGroupMembers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailMessages` MODIFY COLUMN `timestamp` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailRecipientGroups` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailTemplates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `escalationPatterns` MODIFY COLUMN `kbArticleSuggested` tinyint;--> statement-breakpoint
ALTER TABLE `escalationPatterns` MODIFY COLUMN `kbArticleSuggested` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `escalationPatterns` MODIFY COLUMN `resolvedByAgent` tinyint;--> statement-breakpoint
ALTER TABLE `escalationPatterns` MODIFY COLUMN `resolvedByAgent` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `escalationPatterns` MODIFY COLUMN `createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `exitIntentPopups` MODIFY COLUMN `emailSent` tinyint;--> statement-breakpoint
ALTER TABLE `exitIntentPopups` MODIFY COLUMN `emailSent` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `exitIntentPopups` MODIFY COLUMN `leadCaptured` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `exitIntentPopups` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `healthCheckHistory` MODIFY COLUMN `checkedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `healthCheckHistory` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbArticleAnalytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbArticleFeedback` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbArticleShares` MODIFY COLUMN `sharedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbArticleShares` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbArticleTags` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbArticleVersions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbArticleViews` MODIFY COLUMN `viewedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbArticleViews` MODIFY COLUMN `helpful` tinyint;--> statement-breakpoint
ALTER TABLE `kbArticles` MODIFY COLUMN `isPublished` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `kbArticles` MODIFY COLUMN `isPublished` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `kbArticles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbGenerationMetrics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbGenerationQueue` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbGenerations` MODIFY COLUMN `generatedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbGenerations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbSearchQueries` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `knowledgeBase` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `leadGenAnalytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `meetingBookings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` MODIFY COLUMN `needsCybersecurity` tinyint;--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` MODIFY COLUMN `needsCybersecurity` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` MODIFY COLUMN `needsCloud` tinyint;--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` MODIFY COLUMN `needsCloud` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` MODIFY COLUMN `needsHelpdesk` tinyint;--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` MODIFY COLUMN `needsHelpdesk` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `newsletterCampaigns` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `newsletterSubscribers` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `newsletterSubscribers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `emailNotifications` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `smsNotifications` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `smsNotifications` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `inAppNotifications` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `notifyOnTicketCreated` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `notifyOnTicketUpdated` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `notifyOnTicketResolved` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `notifyOnSurveyRequest` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `notificationQueue` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `pricingAnalytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `pricingTiers` MODIFY COLUMN `isPopular` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `pricingTiers` MODIFY COLUMN `isPopular` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pricingTiers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `pushNotifications` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `pushNotifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `pushSubscriptions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `quickAssistSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `realtimeChatMessages` MODIFY COLUMN `isRead` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `realtimeChatMessages` MODIFY COLUMN `isRead` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `realtimeChatMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `realtimeChatSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `responseRatings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `roiCalculations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `securityAssessments` MODIFY COLUMN `pdfGenerated` tinyint;--> statement-breakpoint
ALTER TABLE `securityAssessments` MODIFY COLUMN `pdfGenerated` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `securityAssessments` MODIFY COLUMN `leadCaptured` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `securityAssessments` MODIFY COLUMN `emailSent` tinyint;--> statement-breakpoint
ALTER TABLE `securityAssessments` MODIFY COLUMN `emailSent` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `securityAssessments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `sentiment_routing_rules` MODIFY COLUMN `escalate_to_senior` tinyint;--> statement-breakpoint
ALTER TABLE `sentiment_routing_rules` MODIFY COLUMN `escalate_to_senior` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sentiment_routing_rules` MODIFY COLUMN `is_active` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `sentiment_routing_rules` MODIFY COLUMN `created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `serviceStatusChanges` MODIFY COLUMN `changedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` MODIFY COLUMN `notifyOnHealthy` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` MODIFY COLUMN `notifyOnHealthy` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` MODIFY COLUMN `notifyOnDegraded` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` MODIFY COLUMN `notifyOnCritical` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` MODIFY COLUMN `notifyOnOffline` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` MODIFY COLUMN `subscribedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `slaConfigurations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `slaSnoozes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `slaTracking` MODIFY COLUMN `responseBreached` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `slaTracking` MODIFY COLUMN `responseBreached` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `slaTracking` MODIFY COLUMN `resolutionBreached` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `slaTracking` MODIFY COLUMN `resolutionBreached` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `slaTracking` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `smsCampaigns` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `smsContacts` MODIFY COLUMN `optedIn` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `smsContacts` MODIFY COLUMN `optedInAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `smsContacts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `smsMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `smsOptOuts` MODIFY COLUMN `processedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `socialConnections` MODIFY COLUMN `connectedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `socialConnections` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `socialPosts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `stripeCustomers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `stripeSubscriptions` MODIFY COLUMN `isAnnual` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `stripeSubscriptions` MODIFY COLUMN `isAnnual` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `stripeSubscriptions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `teamsClientChannels` MODIFY COLUMN `provisionedAt` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `teamsClientChannels` MODIFY COLUMN `isActive` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `teamsIntegration` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketActivity` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketFeedback` MODIFY COLUMN `wouldRecommend` tinyint;--> statement-breakpoint
ALTER TABLE `ticketFeedback` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` MODIFY COLUMN `suggestedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` MODIFY COLUMN `helpful` tinyint;--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketMerges` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketNotes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketReplies` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketSurveys` MODIFY COLUMN `submittedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketSurveys` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `ticketTemplates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `uptimeStatistics` MODIFY COLUMN `calculatedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `userActivity` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `userRoleAssignments` MODIFY COLUMN `assignedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `userSessions` MODIFY COLUMN `isOnline` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `userSessions` MODIFY COLUMN `isOnline` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `userSessions` MODIFY COLUMN `lastActivityAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `userSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `approved` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `approved` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `websiteTraffic` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `xeroTokens` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `viewCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `averageRating` decimal(3,2);--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `ratingCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `commentCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `subcategory` varchar(150);--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `audience` enum('end-user','technician','admin') DEFAULT 'technician';--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `difficulty` enum('beginner','intermediate','advanced') DEFAULT 'intermediate';--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `estimatedResolutionTime` varchar(50);--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `ariaEnabled` tinyint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `articleCode` varchar(20);--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` ADD `needsAi` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pushNotifications` ADD `p256Dh` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD `p256Dh` text NOT NULL;--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD `nistCoverage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD `isoCoverage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD `soc2Coverage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD `hipaaCoverage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD `pciDssCoverage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD `cmmcCoverage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD `findings` json DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD `executiveSummary` text;--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD `htmlReportUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `tickets` ADD `requesterName` varchar(255);--> statement-breakpoint
ALTER TABLE `tickets` ADD `requesterEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `tickets` ADD `tags` varchar(255);--> statement-breakpoint
ALTER TABLE `tickets` ADD `includeChatTranscript` tinyint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `chatSessionId` varchar(100);--> statement-breakpoint
ALTER TABLE `tickets` ADD `chatTranscript` text;--> statement-breakpoint
ALTER TABLE `emailMessages` ADD CONSTRAINT `emailMessages_messageId_unique` UNIQUE(`messageId`);--> statement-breakpoint
ALTER TABLE `accountAuditLog` ADD CONSTRAINT `accountAuditLog_accountId_customerInvites_id_fk` FOREIGN KEY (`accountId`) REFERENCES `customerInvites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientTimeline` ADD CONSTRAINT `clientTimeline_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_alerts` ADD CONSTRAINT `commandCenter_alerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_alerts_triggered` ADD CONSTRAINT `commandCenter_alerts_triggered_alertId_commandCenter_alerts_id_fk` FOREIGN KEY (`alertId`) REFERENCES `commandCenter_alerts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_api_integrations` ADD CONSTRAINT `commandCenter_api_integrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_audit_logs` ADD CONSTRAINT `commandCenter_audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_commands` ADD CONSTRAINT `commandCenter_commands_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_saved_commands` ADD CONSTRAINT `commandCenter_saved_commands_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commandCenter_widgets` ADD CONSTRAINT `commandCenter_widgets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbArticleComments` ADD CONSTRAINT `kbArticleComments_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbArticleRatings` ADD CONSTRAINT `kbArticleRatings_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbCommonIssues` ADD CONSTRAINT `kbCommonIssues_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scriptExecutions` ADD CONSTRAINT `scriptExecutions_script_id_scripts_id_fk` FOREIGN KEY (`script_id`) REFERENCES `scripts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scriptExecutions` ADD CONSTRAINT `scriptExecutions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scriptFeedback` ADD CONSTRAINT `scriptFeedback_script_id_scripts_id_fk` FOREIGN KEY (`script_id`) REFERENCES `scripts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scriptFeedback` ADD CONSTRAINT `scriptFeedback_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticketAttachments` ADD CONSTRAINT `ticketAttachments_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accountAuditLog_accountId_idx` ON `accountAuditLog` (`accountId`);--> statement-breakpoint
CREATE INDEX `accountAuditLog_performedBy_idx` ON `accountAuditLog` (`performedBy`);--> statement-breakpoint
CREATE INDEX `accountAuditLog_createdAt_idx` ON `accountAuditLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `callQualityScores_callLogId_unique` ON `callQualityScores` (`callLogId`);--> statement-breakpoint
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
CREATE INDEX `unique_user_article` ON `kbArticleRatings` (`articleId`,`userId`);--> statement-breakpoint
CREATE INDEX `kbCommonIssues_orderNum` ON `kbCommonIssues` (`orderNum`);--> statement-breakpoint
CREATE INDEX `token` ON `magicLinkTokens` (`token`);--> statement-breakpoint
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
CREATE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_stripe_invoice_id_unique` ON `stripe_invoices` (`stripe_invoice_id`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_user_id_idx` ON `stripe_invoices` (`user_id`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_stripe_invoice_id_idx` ON `stripe_invoices` (`stripe_invoice_id`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_stripe_subscription_id_idx` ON `stripe_invoices` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `stripe_invoices_status_idx` ON `stripe_invoices` (`status`);--> statement-breakpoint
CREATE INDEX `stripe_payment_intents_stripe_payment_intent_id_unique` ON `stripe_payment_intents` (`stripe_payment_intent_id`);--> statement-breakpoint
CREATE INDEX `stripe_payment_intents_user_id_idx` ON `stripe_payment_intents` (`user_id`);--> statement-breakpoint
CREATE INDEX `stripe_payment_intents_stripe_payment_intent_id_idx` ON `stripe_payment_intents` (`stripe_payment_intent_id`);--> statement-breakpoint
CREATE INDEX `stripe_payment_intents_status_idx` ON `stripe_payment_intents` (`status`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_stripe_event_id_unique` ON `stripe_webhook_events` (`stripe_event_id`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_stripe_event_id_idx` ON `stripe_webhook_events` (`stripe_event_id`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_event_type_idx` ON `stripe_webhook_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_user_id_idx` ON `stripe_webhook_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_processed_idx` ON `stripe_webhook_events` (`processed`);--> statement-breakpoint
CREATE INDEX `ticketAttachments_ticketId_idx` ON `ticketAttachments` (`ticketId`);--> statement-breakpoint
CREATE INDEX `ticketAttachments_createdAt_idx` ON `ticketAttachments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `uptimeAlerts_monitorId_idx` ON `uptimeAlerts` (`monitorId`);--> statement-breakpoint
CREATE INDEX `uptimeAlerts_transitionType_idx` ON `uptimeAlerts` (`transitionType`);--> statement-breakpoint
CREATE INDEX `uptimeAlerts_createdAt_idx` ON `uptimeAlerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `voicemailDedup_externalId_unique` ON `voicemailDedup` (`externalId`);--> statement-breakpoint
CREATE INDEX `voicemailDedup_phone_hash` ON `voicemailDedup` (`callerPhone`,`transcriptHash`);--> statement-breakpoint
CREATE INDEX `voicemailDedup_expiresAt` ON `voicemailDedup` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `adminCredentials_email_unique` ON `adminCredentials` (`email`);--> statement-breakpoint
CREATE INDEX `agent_queues_name_unique` ON `agent_queues` (`name`);--> statement-breakpoint
CREATE INDEX `agents_userId_unique` ON `agents` (`userId`);--> statement-breakpoint
CREATE INDEX `alertThresholds_service_unique` ON `alertThresholds` (`service`);--> statement-breakpoint
CREATE INDEX `blogPosts_slug_unique` ON `blogPosts` (`slug`);--> statement-breakpoint
CREATE INDEX `blogTags_name_unique` ON `blogTags` (`name`);--> statement-breakpoint
CREATE INDEX `blogTags_slug_unique` ON `blogTags` (`slug`);--> statement-breakpoint
CREATE INDEX `callLogs_graphCallId_unique` ON `callLogs` (`graphCallId`);--> statement-breakpoint
CREATE INDEX `call_recordings_call_id_unique` ON `call_recordings` (`call_id`);--> statement-breakpoint
CREATE INDEX `chatSessions_sessionId_unique` ON `chatSessions` (`sessionId`);--> statement-breakpoint
CREATE INDEX `conversationSummaries_sessionId_unique` ON `conversationSummaries` (`sessionId`);--> statement-breakpoint
CREATE INDEX `customRoles_name_unique` ON `customRoles` (`name`);--> statement-breakpoint
CREATE INDEX `customerInvites_inviteToken_unique` ON `customerInvites` (`inviteToken`);--> statement-breakpoint
CREATE INDEX `customerPortalSessions_sessionToken_unique` ON `customerPortalSessions` (`sessionToken`);--> statement-breakpoint
CREATE INDEX `emailDigestPreferences_userId_unique` ON `emailDigestPreferences` (`userId`);--> statement-breakpoint
CREATE INDEX `kbGenerationMetrics_date_unique` ON `kbGenerationMetrics` (`date`);--> statement-breakpoint
CREATE INDEX `meetingBookings_cancelToken_unique` ON `meetingBookings` (`cancelToken`);--> statement-breakpoint
CREATE INDEX `newsletterSubscribers_email_unique` ON `newsletterSubscribers` (`email`);--> statement-breakpoint
CREATE INDEX `newsletterSubscribers_unsubscribeToken_unique` ON `newsletterSubscribers` (`unsubscribeToken`);--> statement-breakpoint
CREATE INDEX `notificationPreferences_userId_unique` ON `notificationPreferences` (`userId`);--> statement-breakpoint
CREATE INDEX `pricingAnalytics_date_unique` ON `pricingAnalytics` (`date`);--> statement-breakpoint
CREATE INDEX `pricingTiers_name_unique` ON `pricingTiers` (`name`);--> statement-breakpoint
CREATE INDEX `quickAssistSessions_sessionCode_unique` ON `quickAssistSessions` (`sessionCode`);--> statement-breakpoint
CREATE INDEX `serviceStatusSubscriptions_unsubscribeToken_unique` ON `serviceStatusSubscriptions` (`unsubscribeToken`);--> statement-breakpoint
CREATE INDEX `slaTracking_ticketId_unique` ON `slaTracking` (`ticketId`);--> statement-breakpoint
CREATE INDEX `socialConnections_platform_unique` ON `socialConnections` (`platform`);--> statement-breakpoint
CREATE INDEX `stripeCustomers_userId_unique` ON `stripeCustomers` (`userId`);--> statement-breakpoint
CREATE INDEX `stripeCustomers_stripeCustomerId_unique` ON `stripeCustomers` (`stripeCustomerId`);--> statement-breakpoint
CREATE INDEX `stripeSubscriptions_stripeSubscriptionId_unique` ON `stripeSubscriptions` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE INDEX `ticketSurveys_ticketId_unique` ON `ticketSurveys` (`ticketId`);--> statement-breakpoint
CREATE INDEX `userSessions_userId_unique` ON `userSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `xeroTokens_tenantId_unique` ON `xeroTokens` (`tenantId`);--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` DROP COLUMN `needsAI`;--> statement-breakpoint
ALTER TABLE `pushNotifications` DROP COLUMN `p256dh`;--> statement-breakpoint
ALTER TABLE `pushSubscriptions` DROP COLUMN `p256dh`;