CREATE TABLE `upworkJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`upworkJobId` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`budget` decimal(10,2),
	`duration` varchar(50),
	`clientRating` decimal(3,1),
	`clientReviews` int,
	`isRelevant` tinyint NOT NULL DEFAULT 0,
	`relevanceScore` int,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upworkJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `upworkJobs_upworkJobId_unique` UNIQUE(`upworkJobId`)
);
--> statement-breakpoint
CREATE TABLE `upworkMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`upworkProposalId` varchar(255) NOT NULL,
	`sender` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`messageType` enum('text','system') NOT NULL DEFAULT 'text',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `upworkMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upworkProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`upworkProposalId` varchar(255) NOT NULL,
	`upworkJobId` varchar(255) NOT NULL,
	`jobTitle` varchar(500) NOT NULL,
	`bidAmount` decimal(10,2) NOT NULL,
	`coverLetter` text NOT NULL,
	`status` enum('pending','accepted','rejected','withdrawn') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upworkProposals_id` PRIMARY KEY(`id`),
	CONSTRAINT `upworkProposals_upworkProposalId_unique` UNIQUE(`upworkProposalId`)
);
--> statement-breakpoint
CREATE INDEX `upworkJobs_upworkJobId_idx` ON `upworkJobs` (`upworkJobId`);--> statement-breakpoint
CREATE INDEX `upworkJobs_isRelevant_idx` ON `upworkJobs` (`isRelevant`);--> statement-breakpoint
CREATE INDEX `upworkJobs_created_idx` ON `upworkJobs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `upworkMessages_proposalId_idx` ON `upworkMessages` (`upworkProposalId`);--> statement-breakpoint
CREATE INDEX `upworkMessages_created_idx` ON `upworkMessages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `upworkProposals_upworkProposalId_idx` ON `upworkProposals` (`upworkProposalId`);--> statement-breakpoint
CREATE INDEX `upworkProposals_upworkJobId_idx` ON `upworkProposals` (`upworkJobId`);--> statement-breakpoint
CREATE INDEX `upworkProposals_status_idx` ON `upworkProposals` (`status`);--> statement-breakpoint
CREATE INDEX `upworkProposals_created_idx` ON `upworkProposals` (`createdAt`);