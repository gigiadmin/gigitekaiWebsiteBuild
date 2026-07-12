CREATE TABLE `workflowExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` varchar(100) NOT NULL,
	`workflowName` varchar(255) NOT NULL,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`initiatedBy` int NOT NULL,
	`parameters` json NOT NULL,
	`steps` json,
	`result` json,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`completedAt` timestamp,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflowExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`steps` json NOT NULL,
	`parameters` json NOT NULL,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflowTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `workflowExecutions` ADD CONSTRAINT `workflowExecutions_initiatedBy_users_id_fk` FOREIGN KEY (`initiatedBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflowTemplates` ADD CONSTRAINT `workflowTemplates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `workflowExecutions_workflowId` ON `workflowExecutions` (`workflowId`);--> statement-breakpoint
CREATE INDEX `workflowExecutions_status` ON `workflowExecutions` (`status`);--> statement-breakpoint
CREATE INDEX `workflowExecutions_createdAt` ON `workflowExecutions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `workflowTemplates_category` ON `workflowTemplates` (`category`);--> statement-breakpoint
CREATE INDEX `workflowTemplates_isActive` ON `workflowTemplates` (`isActive`);