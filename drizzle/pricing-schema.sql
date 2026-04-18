-- Pricing Tiers Table
CREATE TABLE IF NOT EXISTS `pricingTiers` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL UNIQUE,
  `description` text,
  `monthlyPrice` decimal(10, 2) NOT NULL,
  `annualPrice` decimal(10, 2) NOT NULL,
  `isPopular` boolean DEFAULT false,
  `features` json NOT NULL DEFAULT '[]',
  `maxUsers` int,
  `maxTickets` int,
  `maxStorage` int,
  `supportLevel` varchar(50),
  `slaResponse` varchar(50),
  `slaResolution` varchar(50),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ROI Calculation History
CREATE TABLE IF NOT EXISTS `roiCalculations` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int,
  `tierName` varchar(255),
  `currentEmployees` int,
  `ticketsPerMonth` int,
  `avgResolutionTime` decimal(5, 2),
  `costPerHour` decimal(10, 2),
  `estimatedSavings` decimal(12, 2),
  `paybackPeriod` decimal(5, 2),
  `roiPercentage` decimal(10, 2),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Pricing Page Analytics
CREATE TABLE IF NOT EXISTS `pricingAnalytics` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `pageView` int DEFAULT 0,
  `tierClicked` varchar(255),
  `calculatorUsed` int DEFAULT 0,
  `contactFormSubmitted` int DEFAULT 0,
  `date` date NOT NULL UNIQUE,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP
);
