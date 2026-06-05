ALTER TABLE `formSubmissions` ADD `phone` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `formSubmissions` ADD `updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;