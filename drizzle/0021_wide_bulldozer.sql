CREATE TABLE `kbAuditRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodKey` varchar(7) NOT NULL,
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`source` enum('scheduled','manual') NOT NULL DEFAULT 'scheduled',
	`taskUid` varchar(65),
	`totalArticles` int NOT NULL DEFAULT 0,
	`publishedArticles` int NOT NULL DEFAULT 0,
	`copilotArticles` int NOT NULL DEFAULT 0,
	`unpublishedArticles` int NOT NULL DEFAULT 0,
	`ariaDisabledArticles` int NOT NULL DEFAULT 0,
	`staleArticles` int NOT NULL DEFAULT 0,
	`duplicateGroups` int NOT NULL DEFAULT 0,
	`checkedReferences` int NOT NULL DEFAULT 0,
	`brokenReferences` int NOT NULL DEFAULT 0,
	`blockedReferences` int NOT NULL DEFAULT 0,
	`findings` json,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kbAuditRuns_id` PRIMARY KEY(`id`),
	CONSTRAINT `kbAuditRuns_periodKey_unique` UNIQUE(`periodKey`)
);
--> statement-breakpoint
CREATE INDEX `kbAuditRuns_taskUid_idx` ON `kbAuditRuns` (`taskUid`);--> statement-breakpoint
CREATE INDEX `kbAuditRuns_createdAt_idx` ON `kbAuditRuns` (`createdAt`);