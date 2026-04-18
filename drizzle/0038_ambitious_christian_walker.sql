CREATE TABLE `agentWorkload` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`assignedTickets` int NOT NULL DEFAULT 0,
	`completedTickets` int NOT NULL DEFAULT 0,
	`avgResolutionTime` decimal(8,2),
	`slaBreaches` int NOT NULL DEFAULT 0,
	`customerSatisfaction` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentWorkload_id` PRIMARY KEY(`id`)
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulkTicketActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slaConfigurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`priority` varchar(20) NOT NULL,
	`responseTimeMinutes` int NOT NULL,
	`resolutionTimeMinutes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slaConfigurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slaTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`responseDeadline` timestamp NOT NULL,
	`resolutionDeadline` timestamp NOT NULL,
	`responseBreached` boolean NOT NULL DEFAULT false,
	`resolutionBreached` boolean NOT NULL DEFAULT false,
	`firstResponseAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slaTracking_id` PRIMARY KEY(`id`),
	CONSTRAINT `slaTracking_ticketId_unique` UNIQUE(`ticketId`)
);
--> statement-breakpoint
CREATE TABLE `ticketMerges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryTicketId` int NOT NULL,
	`mergedTicketId` int NOT NULL,
	`mergedBy` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticketMerges_id` PRIMARY KEY(`id`)
);
