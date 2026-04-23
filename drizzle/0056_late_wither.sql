CREATE TABLE `escalationPatterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`originalMessage` text NOT NULL,
	`detectedIntent` varchar(100) DEFAULT 'general',
	`intentConfidence` varchar(20) DEFAULT '0.5',
	`sentiment` varchar(50) DEFAULT 'neutral',
	`sentimentScore` varchar(20) DEFAULT '0.5',
	`escalationReason` varchar(255) DEFAULT 'user_requested',
	`kbArticleSuggested` boolean DEFAULT false,
	`kbArticleId` int,
	`ticketId` int,
	`resolvedByAgent` boolean DEFAULT false,
	`resolutionNotes` text,
	`createdAt` timestamp DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `escalationPatterns_id` PRIMARY KEY(`id`)
);
