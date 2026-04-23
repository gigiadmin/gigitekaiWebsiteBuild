ALTER TABLE `kbArticles` ADD `sourceUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `externalUid` varchar(500);--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `syncSource` varchar(100);--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `lastSyncedAt` timestamp;