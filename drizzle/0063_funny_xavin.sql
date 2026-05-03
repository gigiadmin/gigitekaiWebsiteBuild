CREATE TABLE `kbArticleTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`tag` varchar(100) NOT NULL,
	`source` varchar(50) NOT NULL DEFAULT 'manual',
	`confidence` decimal(3,2) DEFAULT '1.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kbArticleTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kbArticleVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`tags` varchar(500),
	`editedBy` int,
	`changeDescription` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kbArticleVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `kbArticleTags` ADD CONSTRAINT `kbArticleTags_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kbArticleVersions` ADD CONSTRAINT `kbArticleVersions_articleId_kbArticles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `kbArticles`(`id`) ON DELETE cascade ON UPDATE no action;