CREATE TABLE `newsletterSubscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`unsubscribeToken` varchar(64) NOT NULL,
	`source` varchar(500),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletterSubscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterSubscribers_email_unique` UNIQUE(`email`),
	CONSTRAINT `newsletterSubscribers_unsubscribeToken_unique` UNIQUE(`unsubscribeToken`)
);
