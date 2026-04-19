CREATE TABLE `ticketSurveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`submittedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticketSurveys_id` PRIMARY KEY(`id`),
	CONSTRAINT `ticketSurveys_ticketId_unique` UNIQUE(`ticketId`)
);
