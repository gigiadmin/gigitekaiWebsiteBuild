CREATE TABLE `kbSearchQueries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(500) NOT NULL,
	`resultsCount` int NOT NULL DEFAULT 0,
	`clickedArticleId` int,
	`source` varchar(50) NOT NULL DEFAULT 'kb_portal',
	`userId` int,
	`sessionId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kbSearchQueries_id` PRIMARY KEY(`id`)
);
