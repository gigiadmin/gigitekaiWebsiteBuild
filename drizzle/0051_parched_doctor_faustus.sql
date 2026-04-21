ALTER TABLE `multiStepFormSubmissions` ADD `fileKey` varchar(255);--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` ADD `fileName` varchar(255);--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` ADD `fileSize` int;--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` ADD `fileMimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `multiStepFormSubmissions` ADD `fileUrl` text;