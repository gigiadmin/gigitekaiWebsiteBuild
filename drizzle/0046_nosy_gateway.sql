CREATE TABLE `serviceStatusChanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(100) NOT NULL,
	`previousStatus` enum('healthy','degraded','critical','offline') NOT NULL,
	`newStatus` enum('healthy','degraded','critical','offline') NOT NULL,
	`message` text,
	`notificationsSent` int NOT NULL DEFAULT 0,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `serviceStatusChanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceStatusSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`service` varchar(100) NOT NULL,
	`notifyOnHealthy` boolean NOT NULL DEFAULT false,
	`notifyOnDegraded` boolean NOT NULL DEFAULT true,
	`notifyOnCritical` boolean NOT NULL DEFAULT true,
	`notifyOnOffline` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`unsubscribeToken` varchar(64),
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`lastNotificationSentAt` timestamp,
	`unsubscribedAt` timestamp,
	CONSTRAINT `serviceStatusSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `serviceStatusSubscriptions_unsubscribeToken_unique` UNIQUE(`unsubscribeToken`)
);
