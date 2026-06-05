CREATE TABLE `webDiscoverySubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`role` varchar(100) NOT NULL,
	`organizationName` varchar(255) NOT NULL,
	`organizationMission` text,
	`currentWebsiteIssues` text,
	`currentWebsiteStrengths` text,
	`inspiringWebsites` text,
	`topThreeGoals` text,
	`primaryAudience` text,
	`primaryCTA` text,
	`mainSections` text,
	`contentReady` varchar(50),
	`multiLanguage` varchar(50),
	`membersPortal` varchar(50),
	`onlinePayments` varchar(50),
	`regularUpdates` varchar(50),
	`emailIntegration` varchar(50),
	`domainHosting` varchar(50),
	`brandGuidelines` varchar(50),
	`brandDescriptors` text,
	`deadline` varchar(100),
	`budget` varchar(100),
	`maintenanceOwner` varchar(255),
	`status` enum('new','contacted','converted','spam') NOT NULL DEFAULT 'new',
	`submittedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`contactedAt` timestamp,
	`notes` text,
	CONSTRAINT `webDiscoverySubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `webDiscoverySubmissions_email_idx` ON `webDiscoverySubmissions` (`email`);--> statement-breakpoint
CREATE INDEX `webDiscoverySubmissions_status_idx` ON `webDiscoverySubmissions` (`status`);--> statement-breakpoint
CREATE INDEX `webDiscoverySubmissions_submitted_idx` ON `webDiscoverySubmissions` (`submittedAt`);