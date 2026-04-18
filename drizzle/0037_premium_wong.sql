CREATE TABLE `pricingAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`pageViews` int NOT NULL DEFAULT 0,
	`tierViews` text,
	`calculatorUsed` int NOT NULL DEFAULT 0,
	`contactFormSubmitted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pricingAnalytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricingAnalytics_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `pricingTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`monthlyPrice` decimal(10,2) NOT NULL,
	`annualPrice` decimal(10,2) NOT NULL,
	`isPopular` boolean NOT NULL DEFAULT false,
	`features` text NOT NULL,
	`maxUsers` int,
	`maxTickets` int,
	`maxStorage` int,
	`supportLevel` varchar(50),
	`slaResponse` varchar(50),
	`slaResolution` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricingTiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricingTiers_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `roiCalculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`tierName` varchar(255),
	`currentEmployees` int NOT NULL,
	`ticketsPerMonth` int NOT NULL,
	`avgResolutionTime` decimal(5,2) NOT NULL,
	`costPerHour` decimal(10,2) NOT NULL,
	`estimatedSavings` decimal(12,2) NOT NULL,
	`paybackPeriod` decimal(5,2),
	`roiPercentage` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roiCalculations_id` PRIMARY KEY(`id`)
);
