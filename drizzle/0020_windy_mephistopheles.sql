CREATE TABLE `clientOnboardingTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed','blocked') NOT NULL DEFAULT 'pending',
	`clientVisible` tinyint NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientOnboardingTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventName` varchar(120) NOT NULL,
	`pageUrl` varchar(500) NOT NULL,
	`elementId` varchar(180),
	`sessionId` varchar(120),
	`userId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversionEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `websiteAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`name` varchar(180) NOT NULL,
	`company` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`employees` int NOT NULL,
	`priority` varchar(120) NOT NULL,
	`overallScore` int NOT NULL,
	`maturityLevel` varchar(80) NOT NULL,
	`recommendations` json NOT NULL,
	`inputs` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `websiteAssessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `websiteAssessments_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
ALTER TABLE `clientOnboardingTasks` ADD CONSTRAINT `clientOnboardingTasks_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `clientOnboardingTasks_client_idx` ON `clientOnboardingTasks` (`clientId`);--> statement-breakpoint
CREATE INDEX `clientOnboardingTasks_status_idx` ON `clientOnboardingTasks` (`status`);--> statement-breakpoint
CREATE INDEX `conversionEvents_event_idx` ON `conversionEvents` (`eventName`);--> statement-breakpoint
CREATE INDEX `conversionEvents_created_idx` ON `conversionEvents` (`createdAt`);--> statement-breakpoint
CREATE INDEX `conversionEvents_session_idx` ON `conversionEvents` (`sessionId`);--> statement-breakpoint
CREATE INDEX `websiteAssessments_email_idx` ON `websiteAssessments` (`email`);--> statement-breakpoint
CREATE INDEX `websiteAssessments_created_idx` ON `websiteAssessments` (`createdAt`);