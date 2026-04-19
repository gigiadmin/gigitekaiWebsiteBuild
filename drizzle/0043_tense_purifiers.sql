CREATE TABLE `adminMenuCustomization` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`menuOrder` json NOT NULL,
	`collapsedSections` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminMenuCustomization_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`permissions` json NOT NULL,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customRoles_id` PRIMARY KEY(`id`),
	CONSTRAINT `customRoles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `userRoleAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userRoleAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adminMenuCustomization` ADD CONSTRAINT `adminMenuCustomization_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userRoleAssignments` ADD CONSTRAINT `userRoleAssignments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userRoleAssignments` ADD CONSTRAINT `userRoleAssignments_roleId_customRoles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `customRoles`(`id`) ON DELETE cascade ON UPDATE no action;