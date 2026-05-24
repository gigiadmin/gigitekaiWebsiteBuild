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
