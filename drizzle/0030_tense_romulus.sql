CREATE TABLE `ticketActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`actorId` int NOT NULL,
	`actorName` varchar(255) NOT NULL,
	`action` varchar(100) NOT NULL,
	`fromValue` varchar(255),
	`toValue` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticketActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticketNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticketNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `status` enum('open','in_progress','on_hold','resolved','closed') NOT NULL DEFAULT 'open';--> statement-breakpoint
ALTER TABLE `tickets` ADD `assignedTo` int;