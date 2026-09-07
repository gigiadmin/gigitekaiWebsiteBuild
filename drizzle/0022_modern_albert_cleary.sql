CREATE TABLE `kbArticleRedirects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`archivedArticleId` int NOT NULL,
	`canonicalArticleId` int NOT NULL,
	`disposition` enum('duplicate','merged') NOT NULL,
	`reason` text NOT NULL,
	`candidateNumbers` json,
	`sourceSnapshot` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kbArticleRedirects_id` PRIMARY KEY(`id`),
	CONSTRAINT `kbArticleRedirects_archived_unique` UNIQUE(`archivedArticleId`)
);
--> statement-breakpoint
CREATE INDEX `kbArticleRedirects_canonical_idx` ON `kbArticleRedirects` (`canonicalArticleId`);