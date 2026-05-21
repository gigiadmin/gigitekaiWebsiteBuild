CREATE TABLE `xeroTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(255) NOT NULL,
	`tenantName` varchar(255),
	`accessToken` text NOT NULL,
	`refreshToken` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`scopes` text,
	`connectedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `xeroTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `xeroTokens_tenantId_unique` UNIQUE(`tenantId`)
);
