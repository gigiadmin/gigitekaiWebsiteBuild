CREATE TABLE `aria_tts_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cache_key` varchar(64) NOT NULL,
	`text` varchar(500) NOT NULL,
	`audio_data` text NOT NULL,
	`rate` varchar(20) NOT NULL DEFAULT '0%',
	`pitch` varchar(20) NOT NULL DEFAULT '0%',
	`hit_count` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aria_tts_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `aria_tts_cache_cache_key_unique` UNIQUE(`cache_key`)
);
