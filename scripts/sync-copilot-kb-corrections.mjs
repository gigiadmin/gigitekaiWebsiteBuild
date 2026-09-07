/** Synchronize validated post-publication corrections for selected Copilot KB articles. */
import { config } from "dotenv";
import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";

config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is required");
const articleIds = [22, 26, 38];
const articlesDir = "/home/ubuntu/gigitekai-kb-copilot/articles/raw";
const batchSource = "gigitekai-copilot-2026-09";

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

const connection = await mysql.createConnection(parseDbUrl(dbUrl));
try {
  await connection.beginTransaction();
  try {
    for (const id of articleIds) {
      const article = JSON.parse(await fs.readFile(path.join(articlesDir, `article-${String(id).padStart(3, "0")}.json`), "utf8"));
      const externalUid = `${batchSource}-${String(id).padStart(3, "0")}`;
      const sourceUrl = article.references?.[0]?.url || null;
      const [result] = await connection.execute(
        `UPDATE kbArticles
         SET content = ?, tags = ?, sourceUrl = ?, updatedAt = NOW()
         WHERE externalUid = ? AND syncSource = ?`,
        [article.content, article.tags, sourceUrl, externalUid, batchSource]
      );
      if (result.affectedRows !== 1) throw new Error(`Expected one row for ${externalUid}, updated ${result.affectedRows}`);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }

  const [rows] = await connection.query(
    `SELECT externalUid, id, title, sourceUrl FROM kbArticles WHERE syncSource = ? AND externalUid IN (?, ?, ?) ORDER BY externalUid`,
    [batchSource, ...articleIds.map(id => `${batchSource}-${String(id).padStart(3, "0")}`)]
  );
  console.log(JSON.stringify({ synchronized: rows.length, records: rows }));
} finally {
  await connection.end();
}
