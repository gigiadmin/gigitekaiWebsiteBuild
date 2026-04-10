CREATE TABLE `agentTakeoverRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`visitorName` varchar(255),
	`visitorEmail` varchar(320),
	`visitorPhone` varchar(50),
	`reason` text,
	`status` enum('pending','accepted','declined','timeout') NOT NULL DEFAULT 'pending',
	`assignedAdminId` int,
	`ticketId` int,
	`conversationContext` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`closedAt` timestamp,
	CONSTRAINT `agentTakeoverRequests_id` PRIMARY KEY(`id`)
);
