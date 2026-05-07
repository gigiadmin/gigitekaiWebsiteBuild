CREATE TABLE `smsCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`message` text NOT NULL,
	`status` enum('draft','scheduled','sending','sent','paused','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdBy` int,
	`totalRecipients` int NOT NULL DEFAULT 0,
	`totalSent` int NOT NULL DEFAULT 0,
	`totalDelivered` int NOT NULL DEFAULT 0,
	`totalFailed` int NOT NULL DEFAULT 0,
	`totalOptedOut` int NOT NULL DEFAULT 0,
	`fromNumber` varchar(20),
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smsCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`company` varchar(255),
	`source` varchar(50) NOT NULL DEFAULT 'manual',
	`optedIn` boolean NOT NULL DEFAULT true,
	`optedInAt` timestamp NOT NULL DEFAULT (now()),
	`optedOutAt` timestamp,
	`optOutReason` varchar(100),
	`tags` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smsContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`contactId` int NOT NULL,
	`toPhone` varchar(20) NOT NULL,
	`fromPhone` varchar(20) NOT NULL,
	`body` text NOT NULL,
	`status` enum('queued','sent','delivered','failed','undelivered') NOT NULL DEFAULT 'queued',
	`provider` enum('twilio','acs') NOT NULL DEFAULT 'twilio',
	`providerMessageId` varchar(100),
	`errorCode` varchar(50),
	`errorMessage` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smsMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsOptOuts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`contactId` int,
	`reason` varchar(100) NOT NULL DEFAULT 'STOP',
	`source` varchar(50) NOT NULL DEFAULT 'inbound',
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smsOptOuts_id` PRIMARY KEY(`id`)
);
