#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

const createTablesSql = `
CREATE TABLE IF NOT EXISTS aiNewsArticles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  summary LONGTEXT NOT NULL,
  content LONGTEXT,
  category VARCHAR(100) NOT NULL,
  source VARCHAR(255) NOT NULL,
  url VARCHAR(1000) NOT NULL UNIQUE,
  imageUrl VARCHAR(1000),
  publishedAt TIMESTAMP NOT NULL,
  fetchedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  keyTakeaways JSON,
  gigitekAiAngle LONGTEXT,
  readMoreText VARCHAR(255),
  includedInNewsletter TINYINT DEFAULT 0 NOT NULL,
  includedInBlog TINYINT DEFAULT 0 NOT NULL,
  sentAt TIMESTAMP,
  clickCount INT DEFAULT 0 NOT NULL,
  shareCount INT DEFAULT 0 NOT NULL,
  viewCount INT DEFAULT 0 NOT NULL,
  isManuallyAdded TINYINT DEFAULT 0 NOT NULL,
  isArchived TINYINT DEFAULT 0 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX aiNewsArticles_category_idx (category),
  INDEX aiNewsArticles_source_idx (source),
  INDEX aiNewsArticles_url_unique (url),
  INDEX aiNewsArticles_publishedAt_idx (publishedAt),
  INDEX aiNewsArticles_includedInNewsletter_idx (includedInNewsletter),
  INDEX aiNewsArticles_fetchedAt_idx (fetchedAt)
);

CREATE TABLE IF NOT EXISTS newsletterSends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content LONGTEXT NOT NULL,
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  recipientCount INT DEFAULT 0 NOT NULL,
  openCount INT DEFAULT 0 NOT NULL,
  clickCount INT DEFAULT 0 NOT NULL,
  unsubscribeCount INT DEFAULT 0 NOT NULL,
  bounceCount INT DEFAULT 0 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX newsletterSends_sentAt_idx (sentAt)
);

CREATE TABLE IF NOT EXISTS newsEngagementMetrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  articleId INT NOT NULL,
  viewCount INT DEFAULT 0 NOT NULL,
  clickCount INT DEFAULT 0 NOT NULL,
  shareCount INT DEFAULT 0 NOT NULL,
  readTime DECIMAL(5,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (articleId) REFERENCES aiNewsArticles(id) ON DELETE CASCADE,
  INDEX newsEngagementMetrics_articleId_idx (articleId)
);
`;

try {
  console.log('Creating AI News tables...');
  const statements = createTablesSql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      await connection.execute(statement);
      console.log('✓ Executed:', statement.substring(0, 50) + '...');
    }
  }
  
  console.log('✅ All tables created successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error creating tables:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
