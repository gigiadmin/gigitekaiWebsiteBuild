CREATE TABLE `kbArticleFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`articleId` int NOT NULL,
	`rating` enum('helpful','unhelpful') NOT NULL,
	`feedbackMessage` text,
	`sessionId` varchar(64),
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kbArticleFeedback_id` PRIMARY KEY(`id`)
);
