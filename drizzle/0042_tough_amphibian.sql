CREATE TABLE `chatSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatSessionId` int NOT NULL,
	`articleId` int NOT NULL,
	`suggestedBy` enum('ai','agent') NOT NULL DEFAULT 'ai',
	`suggestedAt` timestamp NOT NULL DEFAULT (now()),
	`clickedAt` timestamp,
	`helpful` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerPortalActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`action` enum('view_ticket','view_kb','submit_survey','add_comment','login','logout') NOT NULL,
	`resourceType` varchar(50),
	`resourceId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerPortalActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerPortalSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerPortalSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerPortalSessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`smsNotifications` boolean NOT NULL DEFAULT false,
	`inAppNotifications` boolean NOT NULL DEFAULT true,
	`emailFrequency` enum('immediate','daily','weekly') NOT NULL DEFAULT 'immediate',
	`smsPhoneNumber` varchar(20),
	`notifyOnTicketCreated` boolean NOT NULL DEFAULT true,
	`notifyOnTicketUpdated` boolean NOT NULL DEFAULT true,
	`notifyOnTicketResolved` boolean NOT NULL DEFAULT true,
	`notifyOnSurveyRequest` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notificationQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('email','sms','in_app') NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`relatedTicketId` int,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`status` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`failureReason` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationQueue_id` PRIMARY KEY(`id`)
);
