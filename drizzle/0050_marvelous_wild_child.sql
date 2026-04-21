ALTER TABLE `contactSubmissions` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `contactSubmissions` ADD `fileKey` varchar(255);--> statement-breakpoint
ALTER TABLE `contactSubmissions` ADD `fileName` varchar(255);--> statement-breakpoint
ALTER TABLE `contactSubmissions` ADD `fileSize` int;--> statement-breakpoint
ALTER TABLE `contactSubmissions` ADD `fileMimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `contactSubmissions` ADD `fileUrl` text;