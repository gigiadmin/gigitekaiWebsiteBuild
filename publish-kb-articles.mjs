import mysql from "mysql2/promise";

async function publishKBArticles() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("🚀 Publishing KB articles...\n");

    // Publish all articles
    const result = await connection.execute(
      "UPDATE kbArticles SET isPublished = true WHERE isPublished = false"
    );
    
    console.log(`✅ Published ${result[0].changedRows} articles`);

    // Get total count
    const [rows] = await connection.execute("SELECT COUNT(*) as total FROM kbArticles");
    console.log(`📊 Total KB articles: ${rows[0].total}`);

    console.log("\n✨ All KB articles are now published!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("💥 Fatal error:", error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

publishKBArticles();
