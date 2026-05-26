CREATE TABLE `voicemailDedup` (
`id` int AUTO_INCREMENT NOT NULL,
`callerPhone` varchar(50) NOT NULL,
`transcriptHash` varchar(100) NOT NULL,
`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`expiresAt` timestamp NOT NULL,
`source` enum('email','webhook','group') NOT NULL DEFAULT 'email',
`externalId` varchar(255),
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT `voicemailDedup_id` PRIMARY KEY (`id`),
INDEX `voicemailDedup_phone_hash` (`callerPhone`,`transcriptHash`),
INDEX `voicemailDedup_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
