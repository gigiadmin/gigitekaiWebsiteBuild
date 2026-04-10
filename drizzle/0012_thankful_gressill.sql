CREATE TABLE `ticketFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` enum('1','2','3','4','5') NOT NULL,
	`comment` text,
	`wouldRecommend` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticketFeedback_id` PRIMARY KEY(`id`)
);
