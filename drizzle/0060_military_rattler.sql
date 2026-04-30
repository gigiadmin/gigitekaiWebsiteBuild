CREATE TABLE `agent_dashboard_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`live_transcript` text,
	`suggested_kb_articles` json,
	`current_sentiment` decimal(3,2),
	`sentiment_color` varchar(50),
	`suggested_responses` json,
	`is_active` boolean DEFAULT true,
	`session_started` timestamp DEFAULT (now()),
	`session_ended` timestamp,
	`last_transcript_update` timestamp,
	`last_sentiment_update` timestamp,
	`last_kb_update` timestamp,
	`last_response_update` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_dashboard_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_queue_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`queue_id` int NOT NULL,
	`skill_level` int DEFAULT 1,
	`assigned_at` timestamp DEFAULT (now()),
	`removed_at` timestamp,
	CONSTRAINT `agent_queue_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_queues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('general','senior','specialist','vip') DEFAULT 'general',
	`priority` int DEFAULT 0,
	`max_concurrent_calls` int DEFAULT 5,
	`average_wait_time` int,
	`calls_waiting` int DEFAULT 0,
	`agent_count` int DEFAULT 0,
	`skill_requirements` json,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_queues_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_queues_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `call_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`recording_id` int,
	`customer_id` int,
	`agent_id` int,
	`duration` int,
	`hold_time` int,
	`talk_time` int,
	`silence_time` int,
	`transfer_count` int DEFAULT 0,
	`initial_sentiment` decimal(3,2),
	`final_sentiment` decimal(3,2),
	`sentiment_trend` varchar(50),
	`customer_satisfaction` decimal(3,2),
	`nps_score` int,
	`effort_score` int,
	`is_resolved` boolean DEFAULT false,
	`resolution_time` int,
	`requires_follow_up` boolean DEFAULT false,
	`ai_handled_percentage` decimal(3,2),
	`ai_accuracy` decimal(3,2),
	`kb_articles_used` int DEFAULT 0,
	`estimated_cost` decimal(10,2),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`customer_id` int,
	`agent_id` int,
	`recording_url` text NOT NULL,
	`recording_key` varchar(255) NOT NULL,
	`duration` int,
	`file_size` int,
	`mime_type` varchar(100) DEFAULT 'audio/wav',
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`retention_days` int DEFAULT 90,
	`expires_at` timestamp,
	`is_transcribed` boolean DEFAULT false,
	`consent_given` boolean DEFAULT true,
	`compliance_notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_recordings_id` PRIMARY KEY(`id`),
	CONSTRAINT `call_recordings_call_id_unique` UNIQUE(`call_id`)
);
--> statement-breakpoint
CREATE TABLE `call_routing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`customer_id` int,
	`queue_id` int,
	`agent_id` int,
	`routing_reason` varchar(100),
	`sentiment_score` decimal(3,2),
	`complexity_score` decimal(3,2),
	`routing_decision` varchar(100),
	`routing_time` int,
	`routing_confidence` decimal(3,2),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_routing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_transcripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recording_id` int NOT NULL,
	`call_id` varchar(255) NOT NULL,
	`full_transcript` text NOT NULL,
	`segments` json,
	`language` varchar(10) DEFAULT 'en-US',
	`confidence` decimal(3,2),
	`keywords` json,
	`entities` json,
	`summary` text,
	`action_items` json,
	`searchable` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_transcripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentiment_routing_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sentiment_min` decimal(3,2),
	`sentiment_max` decimal(3,2),
	`target_queue_id` int,
	`target_agent_id` int,
	`escalate_to_senior` boolean DEFAULT false,
	`priority` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sentiment_routing_rules_id` PRIMARY KEY(`id`)
);
