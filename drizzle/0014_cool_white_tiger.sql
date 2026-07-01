CREATE TABLE `aiNewsArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`summary` text NOT NULL,
	`content` text,
	`category` varchar(100) NOT NULL,
	`source` varchar(255) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`imageUrl` varchar(1000),
	`publishedAt` timestamp NOT NULL,
	`fetchedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`keyTakeaways` json,
	`gigitekAiAngle` text,
	`readMoreText` varchar(255),
	`includedInNewsletter` tinyint NOT NULL DEFAULT 0,
	`includedInBlog` tinyint NOT NULL DEFAULT 0,
	`sentAt` timestamp,
	`clickCount` int NOT NULL DEFAULT 0,
	`shareCount` int NOT NULL DEFAULT 0,
	`viewCount` int NOT NULL DEFAULT 0,
	`isManuallyAdded` tinyint NOT NULL DEFAULT 0,
	`isArchived` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiNewsArticles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsEngagementMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`subscriberId` int NOT NULL,
	`action` enum('opened','clicked','shared','saved','reported') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `newsEngagementMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterSends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`articleIds` json NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	`sentCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`openCount` int NOT NULL DEFAULT 0,
	`clickCount` int NOT NULL DEFAULT 0,
	`unsubscribeCount` int NOT NULL DEFAULT 0,
	`status` enum('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
	`scheduledFor` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterSends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `newsEngagementMetrics` ADD CONSTRAINT `newsEngagementMetrics_articleId_aiNewsArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `aiNewsArticles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newsEngagementMetrics` ADD CONSTRAINT `newsEngagementMetrics_subscriberId_newsletterSubscribers_id_fk` FOREIGN KEY (`subscriberId`) REFERENCES `newsletterSubscribers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `aiNewsArticles_category_idx` ON `aiNewsArticles` (`category`);--> statement-breakpoint
CREATE INDEX `aiNewsArticles_source_idx` ON `aiNewsArticles` (`source`);--> statement-breakpoint
CREATE INDEX `aiNewsArticles_url_unique` ON `aiNewsArticles` (`url`);--> statement-breakpoint
CREATE INDEX `aiNewsArticles_publishedAt_idx` ON `aiNewsArticles` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `aiNewsArticles_includedInNewsletter_idx` ON `aiNewsArticles` (`includedInNewsletter`);--> statement-breakpoint
CREATE INDEX `aiNewsArticles_fetchedAt_idx` ON `aiNewsArticles` (`fetchedAt`);--> statement-breakpoint
CREATE INDEX `newsEngagementMetrics_articleId_idx` ON `newsEngagementMetrics` (`articleId`);--> statement-breakpoint
CREATE INDEX `newsEngagementMetrics_subscriberId_idx` ON `newsEngagementMetrics` (`subscriberId`);--> statement-breakpoint
CREATE INDEX `newsEngagementMetrics_action_idx` ON `newsEngagementMetrics` (`action`);--> statement-breakpoint
CREATE INDEX `newsletterSends_status_idx` ON `newsletterSends` (`status`);--> statement-breakpoint
CREATE INDEX `newsletterSends_sentAt_idx` ON `newsletterSends` (`sentAt`);