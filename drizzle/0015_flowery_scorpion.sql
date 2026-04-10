CREATE TABLE `agentAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`ticketId` int,
	`chatSessionId` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`status` enum('assigned','in-progress','completed','escalated') NOT NULL DEFAULT 'assigned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentAssignments_id` PRIMARY KEY(`id`)
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`isWorkingDay` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentSchedules_id` PRIMARY KEY(`id`)
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
	`lastStatusChange` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_userId_unique` UNIQUE(`userId`)
);
