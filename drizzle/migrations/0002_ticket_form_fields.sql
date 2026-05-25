-- Add new fields to tickets table for ticket form support
ALTER TABLE tickets ADD COLUMN requesterName varchar(255) NULL;
ALTER TABLE tickets ADD COLUMN requesterEmail varchar(320) NULL;
ALTER TABLE tickets ADD COLUMN tags varchar(255) NULL COMMENT 'comma-separated tags';
ALTER TABLE tickets ADD COLUMN includeChatTranscript tinyint NOT NULL DEFAULT 1;
ALTER TABLE tickets ADD COLUMN chatSessionId varchar(100) NULL COMMENT 'link to chat session';
ALTER TABLE tickets ADD COLUMN chatTranscript longtext NULL COMMENT 'full chat history if included';
