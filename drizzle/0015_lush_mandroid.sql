CREATE TABLE `portalAccessRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(255),
	`phone` varchar(50),
	`reason` text,
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`userId` int,
	`reviewedBy` varchar(320),
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `portalAccessRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `portalAccessRequests_email` ON `portalAccessRequests` (`email`);--> statement-breakpoint
CREATE INDEX `portalAccessRequests_status` ON `portalAccessRequests` (`status`);