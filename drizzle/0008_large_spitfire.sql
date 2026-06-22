CREATE TABLE `voicemailSourceTombstones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(50) NOT NULL DEFAULT 'm365-group',
	`groupId` varchar(255) NOT NULL,
	`threadId` varchar(255) NOT NULL,
	`postId` varchar(255),
	`callLogId` int,
	`draftTicketId` int,
	`action` enum('deleted','rejected','dismissed') NOT NULL,
	`reason` text,
	`createdBy` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE INDEX `voicemailSourceTombstones_groupId_threadId` ON `voicemailSourceTombstones` (`groupId`,`threadId`);--> statement-breakpoint
CREATE INDEX `voicemailSourceTombstones_callLogId` ON `voicemailSourceTombstones` (`callLogId`);