ALTER TABLE `newsletterCampaigns` ADD `scheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `newsletterCampaigns` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;