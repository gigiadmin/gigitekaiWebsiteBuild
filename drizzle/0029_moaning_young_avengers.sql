CREATE TABLE `meetingBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`company` varchar(255),
	`meetingDate` varchar(10) NOT NULL,
	`meetingTime` varchar(5) NOT NULL,
	`notes` text,
	`status` enum('confirmed','cancelled','rescheduled') NOT NULL DEFAULT 'confirmed',
	`cancelToken` varchar(64),
	`m365EventId` varchar(500),
	`cancelledAt` timestamp,
	`rescheduledTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetingBookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `meetingBookings_cancelToken_unique` UNIQUE(`cancelToken`)
);
