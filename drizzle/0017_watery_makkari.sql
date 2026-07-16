CREATE TABLE `aria_custom_intents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`intent_name` varchar(100) NOT NULL,
	`description` varchar(500),
	`response_template` text,
	`action` varchar(100),
	`action_target` varchar(255),
	`is_active` int NOT NULL DEFAULT 1,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aria_custom_intents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aria_intent_examples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`intent_id` int NOT NULL,
	`example_phrase` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aria_intent_examples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aria_llm_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cache_key` varchar(64) NOT NULL,
	`question` varchar(500) NOT NULL,
	`response` text NOT NULL,
	`intent` varchar(100) NOT NULL,
	`focus` varchar(100) NOT NULL,
	`hit_count` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `aria_llm_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `aria_llm_cache_cache_key_unique` UNIQUE(`cache_key`)
);
--> statement-breakpoint
CREATE TABLE `aria_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`question` text,
	`transcribed_question` text,
	`response` text,
	`intent` varchar(100),
	`sources` text,
	`status` varchar(50) NOT NULL DEFAULT 'success',
	`error_message` text,
	`error_code` varchar(50),
	`input_method` varchar(20) NOT NULL DEFAULT 'text',
	`response_time_ms` int,
	`model_used` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aria_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aria_session_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`role` varchar(20) NOT NULL,
	`content` text NOT NULL,
	`intent` varchar(100),
	`sender_name` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aria_session_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aria_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`user_name` varchar(255),
	`user_email` varchar(255),
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`taken_over_by` int,
	`taken_over_by_name` varchar(255),
	`taken_over_at` timestamp,
	`message_count` int DEFAULT 0,
	`last_message_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`closed_at` timestamp,
	CONSTRAINT `aria_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `commandCenter_alerts_triggered` DROP FOREIGN KEY `commandCenter_alerts_triggered_alertId_commandCenter_alerts_id_fk`;
--> statement-breakpoint
DROP INDEX `aiNewsArticles_url_unique` ON `aiNewsArticles`;--> statement-breakpoint
DROP INDEX `commandCenter_alerts_triggered_alertId` ON `commandCenter_alerts_triggered`;--> statement-breakpoint
DROP INDEX `commandCenter_alerts_triggered_createdAt` ON `commandCenter_alerts_triggered`;--> statement-breakpoint
ALTER TABLE `accountAuditLog` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `adminCredentials` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `adminNotifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agentAssignments` MODIFY COLUMN `assignedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agentAssignments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agent_dashboard_sessions` MODIFY COLUMN `session_started` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agent_dashboard_sessions` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agentMetrics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agent_queue_assignments` MODIFY COLUMN `assigned_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agent_queues` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agentSchedules` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agentTakeoverRequests` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agentWorkload` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agents` MODIFY COLUMN `lastStatusChange` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `agents` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `aiNewsArticles` MODIFY COLUMN `url` varchar(768) NOT NULL;--> statement-breakpoint
ALTER TABLE `aiNewsArticles` MODIFY COLUMN `fetchedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `aiNewsArticles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `alertThresholds` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `blogPostTags` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `blogPosts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `blogTags` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `bulkTicketActions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `call_analytics` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `callDraftTickets` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `callLogs` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `callQualityScores` MODIFY COLUMN `scoredAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `call_recordings` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `call_routing` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `call_transcripts` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `cannedResponses` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `chatAnalytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `chatLeads` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `chatMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `chatSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `chatSuggestions` MODIFY COLUMN `suggestedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `chatSuggestions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `clientTimeline` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `commandCenter_alerts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `commandCenter_alerts_triggered` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `commandCenter_api_integrations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `commandCenter_audit_logs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `commandCenter_commands` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `commandCenter_saved_commands` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `commandCenter_widgets` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `contactSubmissions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `conversationSummaries` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `customRoles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `customerFeedback` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `customerInvites` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `customerPortalActivity` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `customerPortalSessions` MODIFY COLUMN `lastActivityAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `customerPortalSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `demoLeads` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailAnalysisHistory` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailDiagnosticsCache` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailDigestHistory` MODIFY COLUMN `sentAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailDigestHistory` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailDigestPreferences` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailGroupMembers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailMessages` MODIFY COLUMN `timestamp` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailRecipientGroups` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailReports` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `emailTemplates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `escalationPatterns` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `exitIntentPopups` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `formSubmissions` MODIFY COLUMN `submittedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `freeAuditSubmissions` MODIFY COLUMN `submittedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `healthCheckHistory` MODIFY COLUMN `checkedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `healthCheckHistory` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticleAnalytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticleComments` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticleFeedback` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticleRatings` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticleShares` MODIFY COLUMN `sharedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticleShares` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticleTags` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticleVersions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticleViews` MODIFY COLUMN `viewedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbArticles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbCommonIssues` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbGenerationMetrics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbGenerationQueue` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbGenerations` MODIFY COLUMN `generatedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbGenerations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `kbSearchQueries` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `knowledgeBase` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `leadGenAnalytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `magicLinkTokens` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `meetingBookings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `newsEngagementMetrics` MODIFY COLUMN `timestamp` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `newsletterCampaigns` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `newsletterSends` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `newsletterSubscribers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `notificationPreferences` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `notificationQueue` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `portalAccessRequests` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `pricingAnalytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `pricingTiers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `pushNotifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `pushSubscriptions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `quickAssistSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `realtimeChatMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `realtimeChatSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `responseRatings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `roiCalculations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `roiReports` MODIFY COLUMN `snapshotAt` datetime NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `roiReports` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `scriptExecutions` MODIFY COLUMN `executed_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `scriptFeedback` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `scripts` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `searchAnalytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `searchIndex` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `searchSuggestions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `securityAssessments` MODIFY COLUMN `findings` json;--> statement-breakpoint
ALTER TABLE `securityAssessments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `sentiment_routing_rules` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `serviceStatusChanges` MODIFY COLUMN `changedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` MODIFY COLUMN `subscribedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `settings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `slaConfigurations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `slaSnoozes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `slaTracking` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `smsCampaigns` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `smsContacts` MODIFY COLUMN `optedInAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `smsContacts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `smsMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `smsOptOuts` MODIFY COLUMN `processedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `socialConnections` MODIFY COLUMN `connectedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `socialConnections` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `socialPosts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `stripeCustomers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `stripe_invoices` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `stripe_payment_intents` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `stripeSubscriptions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `stripe_webhook_events` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `teamsClientChannels` MODIFY COLUMN `provisionedAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `teamsIntegration` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketActivity` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketAttachments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketFeedback` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` MODIFY COLUMN `suggestedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketMerges` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketNotes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketReplies` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketSurveys` MODIFY COLUMN `submittedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketSurveys` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `ticketTemplates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `uptimeAlerts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `uptimeStatistics` MODIFY COLUMN `calculatedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `upworkJobs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `upworkMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `upworkProposals` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `userActivity` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `userRoleAssignments` MODIFY COLUMN `assignedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `userSessions` MODIFY COLUMN `lastActivityAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `userSessions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `voicemailDedup` MODIFY COLUMN `timestamp` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `voicemailDedup` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `voicemailSourceTombstones` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `websiteTraffic` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `workflowExecutions` MODIFY COLUMN `startedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `workflowExecutions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `workflowTemplates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `xeroTokens` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `accountAuditLog` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `adminCredentials` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `adminMenuCustomization` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `adminNotifications` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agentAssignments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agent_dashboard_sessions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agentMetrics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agent_queue_assignments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agent_queues` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agentSchedules` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agentTakeoverRequests` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agentWorkload` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `agents` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `alertThresholds` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `blogPostTags` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `blogTags` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `bulkTicketActions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `call_analytics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `callDraftTickets` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `callLogs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `callQualityScores` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `call_recordings` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `call_routing` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `call_transcripts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `cannedResponses` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `chatAnalytics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `chatLeads` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `chatMessages` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `chatSessions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `chatSuggestions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `clientTimeline` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `clients` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `companies` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contactSubmissions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `conversationSummaries` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `customRoles` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `customerFeedback` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `customerInvites` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `customerPortalActivity` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `customerPortalSessions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `demoLeads` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `emailAnalysisHistory` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `emailDiagnosticsCache` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `emailDigestHistory` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `emailDigestPreferences` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `emailGroupMembers` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `emailMessages` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `emailRecipientGroups` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `emailReports` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `emailTemplates` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `escalationPatterns` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `exitIntentPopups` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `freeAuditSubmissions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `healthCheckHistory` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbArticleAnalytics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbArticleComments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbArticleFeedback` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbArticleRatings` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbArticleShares` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbArticleTags` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbArticleVersions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbArticleViews` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbArticles` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbCommonIssues` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbGenerationMetrics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbGenerationQueue` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbGenerations` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `kbSearchQueries` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `knowledgeBase` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `leadGenAnalytics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `magicLinkTokens` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `meetingBookings` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `newsletterCampaigns` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `newsletterSubscribers` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `notificationQueue` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `pricingAnalytics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `pricingTiers` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `pushNotifications` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `quickAssistSessions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `realtimeChatMessages` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `realtimeChatSessions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `responseRatings` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `roiCalculations` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `roiReports` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `scriptExecutions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `scriptFeedback` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `scripts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `searchAnalytics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `searchIndex` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `searchSuggestions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `securityAssessments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `sentiment_routing_rules` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `serviceStatusChanges` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `serviceStatusSubscriptions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `settings` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `slaConfigurations` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `slaSnoozes` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `slaTracking` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `smsCampaigns` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `smsContacts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `smsMessages` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `smsOptOuts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `socialConnections` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `socialPosts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `stripeCustomers` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `stripeSubscriptions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `teamsClientChannels` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `teamsIntegration` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticketActivity` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticketAttachments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticketFeedback` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticketMerges` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticketNotes` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticketReplies` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticketSurveys` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticketTemplates` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `tickets` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `uptimeAlerts` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `uptimeStatistics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `userActivity` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `userRoleAssignments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `userSessions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `users` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `voicemailDedup` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `voicemailSourceTombstones` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `websiteTraffic` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `xeroTokens` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `commandCenter_alerts_triggered` ADD CONSTRAINT `cc_alerts_trig_alertId_fk` FOREIGN KEY (`alertId`) REFERENCES `commandCenter_alerts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cc_alerts_triggered_alertId` ON `commandCenter_alerts_triggered` (`alertId`);--> statement-breakpoint
CREATE INDEX `cc_alerts_triggered_createdAt` ON `commandCenter_alerts_triggered` (`createdAt`);