CREATE TABLE `formSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(255),
	`category` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`source` varchar(100) NOT NULL,
	`status` enum('new','contacted','converted','spam') NOT NULL DEFAULT 'new',
	`submittedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`contactedAt` timestamp,
	`notes` text,
	CONSTRAINT `formSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `formSubmissions_email_idx` ON `formSubmissions` (`email`);--> statement-breakpoint
CREATE INDEX `formSubmissions_category_idx` ON `formSubmissions` (`category`);--> statement-breakpoint
CREATE INDEX `formSubmissions_status_idx` ON `formSubmissions` (`status`);--> statement-breakpoint
CREATE INDEX `formSubmissions_submitted_idx` ON `formSubmissions` (`submittedAt`);