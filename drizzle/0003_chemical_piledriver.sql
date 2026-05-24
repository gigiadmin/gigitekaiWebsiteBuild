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
	`scoredAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `callQualityScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `callQualityScores_callLogId_unique` UNIQUE(`callLogId`)
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
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`contactedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `freeAuditSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `subcategory` varchar(150);--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `audience` enum('end-user','technician','admin') DEFAULT 'technician';--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `difficulty` enum('beginner','intermediate','advanced') DEFAULT 'intermediate';--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `estimatedResolutionTime` varchar(50);--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `ariaEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `articleCode` varchar(20);