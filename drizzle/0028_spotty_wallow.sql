CREATE TABLE `exitIntentPopups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(20),
	`companyName` varchar(255),
	`leadMagnetDownloaded` varchar(255),
	`downloadUrl` varchar(500),
	`pageUrl` varchar(500) NOT NULL,
	`emailSent` boolean DEFAULT false,
	`leadCaptured` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exitIntentPopups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadGenAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`assessmentLeads` int DEFAULT 0,
	`popupLeads` int DEFAULT 0,
	`formLeads` int DEFAULT 0,
	`totalLeads` int DEFAULT 0,
	`assessmentConversions` int DEFAULT 0,
	`popupConversions` int DEFAULT 0,
	`formConversions` int DEFAULT 0,
	`totalConversions` int DEFAULT 0,
	`conversionRate` decimal(5,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadGenAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `multiStepFormSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`employeeCount` varchar(50),
	`currentITSetup` varchar(500),
	`needsCybersecurity` boolean DEFAULT false,
	`needsCloud` boolean DEFAULT false,
	`needsHelpdesk` boolean DEFAULT false,
	`needsAI` boolean DEFAULT false,
	`otherNeeds` varchar(500),
	`formCompletedAt` timestamp,
	`leadQuality` varchar(20),
	`assignedTo` int,
	`status` varchar(20) DEFAULT 'new',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `multiStepFormSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(20),
	`emailSecurityScore` int NOT NULL,
	`endpointProtectionScore` int NOT NULL,
	`backupRecoveryScore` int NOT NULL,
	`identityManagementScore` int NOT NULL,
	`complianceScore` int NOT NULL,
	`overallScore` int NOT NULL,
	`riskLevel` varchar(20) NOT NULL,
	`pdfGenerated` boolean DEFAULT false,
	`pdfUrl` varchar(500),
	`leadCaptured` boolean DEFAULT true,
	`emailSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `securityAssessments_id` PRIMARY KEY(`id`)
);
