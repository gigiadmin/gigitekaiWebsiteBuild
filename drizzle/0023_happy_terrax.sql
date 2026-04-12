CREATE TABLE `emailMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`direction` varchar(20) NOT NULL,
	`from` varchar(255) NOT NULL,
	`to` varchar(1000) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`templateId` int,
	`linkedTicketId` int,
	`linkedSessionId` int,
	`status` varchar(20) NOT NULL DEFAULT 'sent',
	`messageId` varchar(255),
	`sentBy` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(50) NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
