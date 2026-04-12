CREATE TABLE `adminNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`href` varchar(500),
	`priority` varchar(20) NOT NULL DEFAULT 'normal',
	`isRead` boolean NOT NULL DEFAULT false,
	`ticketId` int,
	`sessionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminNotifications_id` PRIMARY KEY(`id`)
);
