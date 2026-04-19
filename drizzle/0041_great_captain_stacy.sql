CREATE TABLE `kbArticleAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`ticketsResolved` int NOT NULL DEFAULT 0,
	`avgHelpfulnessRating` decimal(3,2),
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kbArticleAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kbArticleShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`sharedBy` int NOT NULL,
	`sharedWith` varchar(255),
	`sharedVia` enum('email','link','ticket') NOT NULL DEFAULT 'email',
	`ticketId` int,
	`message` text,
	`sharedAt` timestamp NOT NULL DEFAULT (now()),
	`viewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kbArticleShares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kbArticleViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`viewedBy` int,
	`viewedFrom` enum('kb_portal','ticket_detail','search_widget','share_link') NOT NULL DEFAULT 'kb_portal',
	`ticketId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`timeSpent` int,
	`helpful` boolean,
	CONSTRAINT `kbArticleViews_id` PRIMARY KEY(`id`)
);
