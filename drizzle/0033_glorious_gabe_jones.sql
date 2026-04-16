CREATE TABLE `socialConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('linkedin','twitter','facebook') NOT NULL,
	`accessToken` text NOT NULL,
	`accessTokenSecret` text,
	`refreshToken` text,
	`expiresAt` timestamp,
	`pageId` varchar(255),
	`personUrn` varchar(255),
	`screenName` varchar(255),
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialConnections_id` PRIMARY KEY(`id`),
	CONSTRAINT `socialConnections_platform_unique` UNIQUE(`platform`)
);
