ALTER TABLE `chatLeads` MODIFY COLUMN `interest` varchar(255);--> statement-breakpoint
ALTER TABLE `chatLeads` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `chatLeads` ADD `consentEmail` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `chatLeads` ADD `consentPhone` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `chatLeads` ADD `consentText` boolean DEFAULT false NOT NULL;