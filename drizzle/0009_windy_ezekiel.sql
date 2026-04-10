CREATE TABLE `chatAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`messageId` int NOT NULL,
	`sentiment` enum('positive','neutral','negative','angry') NOT NULL DEFAULT 'neutral',
	`sentimentScore` varchar(10),
	`intent` enum('sales','support','billing','general','complaint') NOT NULL DEFAULT 'general',
	`intentConfidence` varchar(10),
	`routedTo` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversationSummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`summary` text NOT NULL,
	`keyPoints` text,
	`suggestedActions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversationSummaries_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversationSummaries_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `responseRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`messageId` int NOT NULL,
	`rating` enum('helpful','neutral','unhelpful') NOT NULL,
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `responseRatings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamsIntegration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`teamsConversationId` varchar(255) NOT NULL,
	`teamsUserId` varchar(255) NOT NULL,
	`status` enum('active','archived','synced') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamsIntegration_id` PRIMARY KEY(`id`)
);
