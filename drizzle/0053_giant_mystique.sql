CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255),
	`contactEmail` varchar(255),
	`contactPhone` varchar(50),
	`industry` varchar(100),
	`tier` enum('starter','professional','enterprise') DEFAULT 'starter',
	`teamsChannelId` varchar(255),
	`teamsChannelName` varchar(255),
	`teamsChannelWebhookUrl` varchar(1024),
	`teamsChannelCreatedAt` timestamp,
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamsClientChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`teamsTeamId` varchar(255) NOT NULL,
	`teamsChannelId` varchar(255) NOT NULL,
	`teamsChannelName` varchar(255) NOT NULL,
	`webhookUrl` varchar(1024),
	`provisionedBy` int,
	`provisionedAt` timestamp DEFAULT (now()),
	`isActive` boolean DEFAULT true,
	`lastNotificationAt` timestamp,
	`notificationCount` int DEFAULT 0,
	CONSTRAINT `teamsClientChannels_id` PRIMARY KEY(`id`)
);
