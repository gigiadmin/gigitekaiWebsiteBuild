CREATE TABLE `alertThresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(100) NOT NULL,
	`responseTimeThreshold` int NOT NULL DEFAULT 5000,
	`errorRateThreshold` int NOT NULL DEFAULT 10,
	`unprocessedTicketsThreshold` int DEFAULT 50,
	`agentAvailabilityThreshold` int DEFAULT 50,
	`slaComplianceThreshold` int DEFAULT 90,
	`enabled` boolean NOT NULL DEFAULT true,
	`notifyOnDegraded` boolean NOT NULL DEFAULT true,
	`notifyOnCritical` boolean NOT NULL DEFAULT true,
	`notifyOnRecovery` boolean NOT NULL DEFAULT true,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertThresholds_id` PRIMARY KEY(`id`),
	CONSTRAINT `alertThresholds_service_unique` UNIQUE(`service`)
);
--> statement-breakpoint
CREATE TABLE `healthCheckHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(100) NOT NULL,
	`status` enum('healthy','degraded','critical','offline') NOT NULL,
	`responseTime` int NOT NULL,
	`message` text,
	`metrics` json,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `healthCheckHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uptimeStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(100) NOT NULL,
	`period` enum('1h','24h','7d','30d') NOT NULL,
	`uptimePercentage` decimal(5,2) NOT NULL,
	`totalChecks` int NOT NULL,
	`healthyChecks` int NOT NULL,
	`degradedChecks` int NOT NULL,
	`criticalChecks` int NOT NULL,
	`offlineChecks` int NOT NULL,
	`avgResponseTime` int,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uptimeStatistics_id` PRIMARY KEY(`id`)
);
