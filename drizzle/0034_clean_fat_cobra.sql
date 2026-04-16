ALTER TABLE `socialPosts` MODIFY COLUMN `status` enum('published','failed','pending','scheduled','draft') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `socialPosts` ADD `scheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `socialPosts` ADD `platforms` text;--> statement-breakpoint
ALTER TABLE `socialPosts` ADD `link` varchar(1000);--> statement-breakpoint
ALTER TABLE `socialPosts` ADD `engagementLikes` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `socialPosts` ADD `engagementComments` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `socialPosts` ADD `engagementShares` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `socialPosts` ADD `engagementLastFetched` timestamp;