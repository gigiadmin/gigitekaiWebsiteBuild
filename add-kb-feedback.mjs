import mysql from "mysql2/promise";

async function addKBFeedbackTables() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("🚀 Adding KB feedback tables...\n");

    // Create kbArticleRatings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kbArticleRatings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        articleId INT NOT NULL,
        userId INT,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_article (articleId, userId),
        FOREIGN KEY (articleId) REFERENCES kbArticles(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Created kbArticleRatings table");

    // Create kbArticleComments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS kbArticleComments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        articleId INT NOT NULL,
        userId INT,
        userName VARCHAR(255),
        userEmail VARCHAR(320),
        comment TEXT NOT NULL,
        helpful BOOLEAN DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (articleId) REFERENCES kbArticles(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Created kbArticleComments table");

    // Add columns to kbArticles for tracking
    await connection.execute(`
      ALTER TABLE kbArticles 
      ADD COLUMN IF NOT EXISTS viewCount INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS averageRating DECIMAL(3,2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS ratingCount INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS commentCount INT DEFAULT 0
    `);
    console.log("✅ Added tracking columns to kbArticles");

    console.log("\n📊 KB feedback tables created successfully!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("💥 Fatal error:", error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

addKBFeedbackTables();
