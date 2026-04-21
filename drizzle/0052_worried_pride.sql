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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kbGenerationMetrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `kbGenerationMetrics_date_unique` UNIQUE(`date`)
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kbGenerationQueue_id` PRIMARY KEY(`id`)
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
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`rejectedBy` int,
	`rejectedAt` timestamp,
	`publishedArticleId` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kbGenerations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticketKbSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`articleId` int NOT NULL,
	`relevanceScore` int DEFAULT 0,
	`suggestedBy` enum('ai','agent') NOT NULL DEFAULT 'ai',
	`suggestedAt` timestamp NOT NULL DEFAULT (now()),
	`viewedAt` timestamp,
	`usedAt` timestamp,
	`helpful` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticketKbSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `kbGenerationQueue` ADD CONSTRAINT `kbGenerationQueue_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbGenerations` ADD CONSTRAINT `kbGenerations_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` ADD CONSTRAINT `ticketKbSuggestions_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticketKbSuggestions` ADD CONSTRAINT `ticketKbSuggestions_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;