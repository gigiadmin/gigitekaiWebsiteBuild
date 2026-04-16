CREATE TABLE `cannedResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'general',
	`usageCount` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cannedResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kbArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) NOT NULL DEFAULT 'general',
	`tags` varchar(500),
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kbArticles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`platform` enum('linkedin','twitter','facebook') NOT NULL,
	`postId` varchar(500),
	`content` text NOT NULL,
	`url` varchar(1000),
	`status` enum('published','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`publishedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tickets` ADD `aiCategory` varchar(100);--> statement-breakpoint
ALTER TABLE `tickets` ADD `aiPriority` varchar(20);--> statement-breakpoint
ALTER TABLE `tickets` ADD `aiConfidence` decimal(4,2);--> statement-breakpoint
ALTER TABLE `tickets` ADD `aiReasoning` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `source` varchar(50) DEFAULT 'web' NOT NULL;