DROP TABLE `ticketIdempotencyKeys`;--> statement-breakpoint
ALTER TABLE `tickets` DROP INDEX `tickets_idempotencyKey_unique`;--> statement-breakpoint
ALTER TABLE `tickets` DROP COLUMN `idempotencyKey`;