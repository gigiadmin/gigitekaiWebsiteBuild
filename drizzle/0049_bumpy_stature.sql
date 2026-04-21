CREATE TABLE `blogPostTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blogPostTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blogTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blogTags_id` PRIMARY KEY(`id`),
	CONSTRAINT `blogTags_name_unique` UNIQUE(`name`),
	CONSTRAINT `blogTags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `blogPostTags` ADD CONSTRAINT `blogPostTags_postId_blogPosts_id_fk` FOREIGN KEY (`postId`) REFERENCES `blogPosts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blogPostTags` ADD CONSTRAINT `blogPostTags_tagId_blogTags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `blogTags`(`id`) ON DELETE cascade ON UPDATE no action;