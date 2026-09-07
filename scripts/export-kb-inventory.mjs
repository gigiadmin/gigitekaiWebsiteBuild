/**
 * Export published KB metadata for duplicate detection and release validation.
 * Writes no credentials and excludes full article bodies by default.
 */
import { config } from "dotenv";
import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";

config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is required");

function parseDbUrl(value) {
  const url = new URL(value);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: false },
  };
}

const outputPath = process.argv[2] || "/home/ubuntu/gigitekai-kb-copilot/existing-kb-inventory.json";
await fs.mkdir(path.dirname(outputPath), { recursive: true });

const connection = await mysql.createConnection(parseDbUrl(dbUrl));
try {
  const [rows] = await connection.execute(`
    SELECT id, title, category, tags, articleCode, isPublished, syncSource,
           CHAR_LENGTH(content) AS contentLength
    FROM kbArticles
    ORDER BY id ASC
  `);

  const payload = {
    exportedAt: new Date().toISOString(),
    total: rows.length,
    articles: rows,
  };
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify({ outputPath, total: rows.length }));
} finally {
  await connection.end();
}
