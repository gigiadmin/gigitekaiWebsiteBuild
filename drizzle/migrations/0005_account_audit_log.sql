CREATE TABLE `accountAuditLog` (
`id` int AUTO_INCREMENT NOT NULL,
`accountId` int NOT NULL,
`action` enum('created','updated','deleted','restored','role_changed','resend_invitation','login','logout') NOT NULL,
`performedBy` int NOT NULL,
`performedByEmail` varchar(320) NOT NULL,
`changes` text,
`reason` text,
`ipAddress` varchar(45),
`userAgent` varchar(500),
`createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
CONSTRAINT `accountAuditLog_ibfk_1` FOREIGN KEY (`accountId`) REFERENCES `customerInvites`(`id`) ON DELETE cascade,
INDEX `accountAuditLog_accountId_idx` (`accountId`),
INDEX `accountAuditLog_performedBy_idx` (`performedBy`),
INDEX `accountAuditLog_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB;
