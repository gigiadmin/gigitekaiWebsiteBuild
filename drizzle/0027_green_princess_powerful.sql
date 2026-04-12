CREATE TABLE `customerFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`categories` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activityType` varchar(50) NOT NULL,
	`description` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `websiteTraffic` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`pageUrl` varchar(500) NOT NULL,
	`pageTitle` varchar(500),
	`visitors` int NOT NULL DEFAULT 0,
	`pageViews` int NOT NULL DEFAULT 0,
	`bounceRate` decimal(5,2) DEFAULT '0',
	`avgTimeOnPage` int DEFAULT 0,
	`referrer` varchar(500),
	`country` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `websiteTraffic_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customerFeedback` ADD CONSTRAINT `customerFeedback_ticketId_tickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customerFeedback` ADD CONSTRAINT `customerFeedback_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userActivity` ADD CONSTRAINT `userActivity_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;