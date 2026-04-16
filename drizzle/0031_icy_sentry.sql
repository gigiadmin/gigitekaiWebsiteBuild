CREATE TABLE `slaSnoozes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`snoozedUntil` timestamp NOT NULL,
	`snoozedBy` int NOT NULL,
	`reason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slaSnoozes_id` PRIMARY KEY(`id`)
);
