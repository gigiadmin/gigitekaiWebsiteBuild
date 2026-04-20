CREATE TABLE `quickAssistSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionCode` varchar(10) NOT NULL,
	`ticketId` int,
	`customerId` int,
	`initiatedBy` int NOT NULL,
	`description` text,
	`status` enum('active','ended','expired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`endedAt` timestamp,
	CONSTRAINT `quickAssistSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `quickAssistSessions_sessionCode_unique` UNIQUE(`sessionCode`)
);
