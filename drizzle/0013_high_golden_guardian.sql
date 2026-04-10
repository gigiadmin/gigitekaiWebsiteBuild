CREATE TABLE `emailDigestHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`leadsCount` int NOT NULL DEFAULT 0,
	`ticketsCount` int NOT NULL DEFAULT 0,
	`approvalsCount` int NOT NULL DEFAULT 0,
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailDigestHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailDigestPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`frequency` enum('daily','weekly') NOT NULL DEFAULT 'daily',
	`sendTime` varchar(5) NOT NULL DEFAULT '06:00',
	`includeLeads` boolean NOT NULL DEFAULT true,
	`includeTickets` boolean NOT NULL DEFAULT true,
	`includeApprovals` boolean NOT NULL DEFAULT true,
	`lastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailDigestPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailDigestPreferences_userId_unique` UNIQUE(`userId`)
);
