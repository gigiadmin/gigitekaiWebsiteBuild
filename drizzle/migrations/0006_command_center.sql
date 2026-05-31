-- Command Center Tables Migration

CREATE TABLE `commandCenter_widgets` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`userId` int NOT NULL,
	`widgetType` enum('uptime','agents','email','tickets','alerts','api_status') NOT NULL,
	`title` varchar(255) NOT NULL,
	`position` int DEFAULT 0 NOT NULL,
	`isVisible` tinyint DEFAULT 1 NOT NULL,
	`refreshInterval` int DEFAULT 30000 NOT NULL,
	`config` json,
	`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	INDEX `commandCenter_widgets_userId` (`userId`),
	INDEX `commandCenter_widgets_widgetType` (`widgetType`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `commandCenter_commands` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`userId` int NOT NULL,
	`rawInput` varchar(1000) NOT NULL,
	`intent` varchar(100) NOT NULL,
	`entities` json,
	`apiCalls` json,
	`result` json,
	`executionTime` int,
	`status` enum('success','partial','failed') DEFAULT 'success' NOT NULL,
	`errorMessage` varchar(500),
	`isSaved` tinyint DEFAULT 0 NOT NULL,
	`commandName` varchar(255),
	`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	INDEX `commandCenter_commands_userId` (`userId`),
	INDEX `commandCenter_commands_createdAt` (`createdAt`),
	INDEX `commandCenter_commands_intent` (`intent`),
	INDEX `commandCenter_commands_isSaved` (`isSaved`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `commandCenter_alerts` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`condition` varchar(500) NOT NULL,
	`threshold` decimal(10,2),
	`isActive` tinyint DEFAULT 1 NOT NULL,
	`notificationChannels` json,
	`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	INDEX `commandCenter_alerts_userId` (`userId`),
	INDEX `commandCenter_alerts_isActive` (`isActive`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `commandCenter_alerts_triggered` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`alertId` int NOT NULL,
	`value` decimal(10,2),
	`message` varchar(500),
	`notificationsSent` json,
	`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	INDEX `commandCenter_alerts_triggered_alertId` (`alertId`),
	INDEX `commandCenter_alerts_triggered_createdAt` (`createdAt`),
	FOREIGN KEY (`alertId`) REFERENCES `commandCenter_alerts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `commandCenter_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`resource` varchar(255),
	`details` json,
	`result` varchar(50) NOT NULL,
	`errorMessage` varchar(500),
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	INDEX `commandCenter_audit_logs_userId` (`userId`),
	INDEX `commandCenter_audit_logs_createdAt` (`createdAt`),
	INDEX `commandCenter_audit_logs_action` (`action`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `commandCenter_api_integrations` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`userId` int NOT NULL,
	`apiName` varchar(100) NOT NULL,
	`apiKey` varchar(500) NOT NULL,
	`apiSecret` varchar(500),
	`baseUrl` varchar(255),
	`isActive` tinyint DEFAULT 1 NOT NULL,
	`lastSyncedAt` timestamp,
	`syncStatus` enum('success','failed','pending') DEFAULT 'pending' NOT NULL,
	`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	INDEX `commandCenter_api_integrations_userId` (`userId`),
	INDEX `commandCenter_api_integrations_apiName` (`apiName`),
	INDEX `commandCenter_api_integrations_unique` (`userId`, `apiName`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `commandCenter_saved_commands` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`commandTemplate` varchar(1000) NOT NULL,
	`defaultEntities` json,
	`category` varchar(100),
	`isPublic` tinyint DEFAULT 0 NOT NULL,
	`usageCount` int DEFAULT 0 NOT NULL,
	`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	INDEX `commandCenter_saved_commands_userId` (`userId`),
	INDEX `commandCenter_saved_commands_category` (`category`),
	INDEX `commandCenter_saved_commands_isPublic` (`isPublic`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fix column name in multiStepFormSubmissions
ALTER TABLE `multiStepFormSubmissions` CHANGE COLUMN `currentItSetup` `currentITSetup` varchar(500);
