CREATE TABLE `customerInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviteToken` varchar(128) NOT NULL,
	`invitedEmail` varchar(320) NOT NULL,
	`invitedName` varchar(255),
	`invitedCompany` varchar(255),
	`invitedBy` int NOT NULL,
	`status` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
	`acceptedBy` int,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `customerInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerInvites_inviteToken_unique` UNIQUE(`inviteToken`)
);
