CREATE TABLE `briefing_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('acquisition','funding') NOT NULL,
	`amount` decimal(15,2),
	`amountDisplay` varchar(100),
	`category` varchar(100) NOT NULL,
	`focus` text,
	`description` text,
	`mspImpact` text,
	`logoUrl` varchar(1024),
	`website` varchar(512),
	`fundingDate` date,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `briefing_companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `briefing_metadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`edition` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`publishDate` date NOT NULL,
	`summary` text,
	`totalFunding` decimal(15,2),
	`majorDeals` int,
	`startupsTracked` int,
	`modelReleases` int,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `briefing_metadata_id` PRIMARY KEY(`id`),
	CONSTRAINT `briefing_metadata_edition_unique` UNIQUE(`edition`)
);
--> statement-breakpoint
CREATE TABLE `briefing_model_releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`releaseDate` date NOT NULL,
	`description` text,
	`keyFeatures` json,
	`mspImpact` text,
	`logoUrl` varchar(1024),
	`website` varchar(512),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `briefing_model_releases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `briefing_startups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`focus` varchar(255) NOT NULL,
	`description` text,
	`features` json,
	`mspRelevance` text,
	`funding` varchar(100),
	`fundingDate` date,
	`website` varchar(512),
	`logoUrl` varchar(1024),
	`tags` json,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `briefing_startups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `briefing_strategic_implications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`priority` enum('high','medium','low') DEFAULT 'medium',
	`category` varchar(100) NOT NULL,
	`description` text,
	`whyItMatters` text,
	`actionItems` json,
	`icon` varchar(50),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `briefing_strategic_implications_id` PRIMARY KEY(`id`)
);
