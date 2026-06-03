DROP INDEX `voicemailDedup_phone_hash` ON `voicemailDedup`;--> statement-breakpoint
ALTER TABLE `voicemailDedup` ADD CONSTRAINT `voicemailDedup_phone_hash_unique` UNIQUE(`callerPhone`,`transcriptHash`,`source`);
