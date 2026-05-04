CREATE TABLE `magicLinkTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `magicLinkTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `magicLinkTokens_token_unique` UNIQUE(`token`)
);
