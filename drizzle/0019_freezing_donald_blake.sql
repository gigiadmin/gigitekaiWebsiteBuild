CREATE TABLE `intakeTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorName` varchar(255) NOT NULL,
	`creatorEmail` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`description` text,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`intakeData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `intakeTickets_id` PRIMARY KEY(`id`)
);
