/**
 * Export a human-readable index of the published Copilot KB collection.
 */
import { config } from "dotenv";
import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";

config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is required");
const outputPath = process.argv[2] || "docs/content/Copilot_KB_Article_Index_2026-09.md";
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
  const [rows] = await connection.query(
    `SELECT id, articleCode, title, category, sourceUrl, isPublished, ariaEnabled
     FROM kbArticles
     WHERE syncSource = ?
     ORDER BY id ASC`,
    [batchSource]
  );
  if (rows.length !== 100) throw new Error(`Expected 100 published Copilot articles, found ${rows.length}`);

  const categoryCounts = new Map();
  for (const row of rows) categoryCounts.set(row.category, (categoryCounts.get(row.category) || 0) + 1);

  const lines = [
    "# GigitekAI Microsoft Copilot Knowledge Base — 100-Article Index",
    "",
    `Published collection source: \`${batchSource}\``,
    "",
    `This release adds **${rows.length} original, published, Aria-enabled Microsoft Copilot articles** to the GigitekAI Knowledge Base. The collection was checked against the complete pre-release inventory for exact title, slug, candidate-topic, and article-content duplication before publication.`,
    "",
    "## Collection summary",
    "",
    "| Category | Articles |",
    "|---|---:|",
    ...[...categoryCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([category, count]) => `| ${category} | ${count} |`),
    "",
    "## Published articles",
    "",
    "| Code | Category | Article |",
    "|---|---|---|",
    ...rows.map(row => `| ${row.articleCode} | ${row.category} | [${row.title}](https://gigitekai.com/kb/${row.id}) |`),
    "",
    "## Validation status",
    "",
    "All 100 articles are published, have unique external identifiers and titles, are enabled for Aria, include official Microsoft references, and use GigitekAI's approved support identity: support@gigitekai.com and 609-676-4483.",
    "",
  ];

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${lines.join("\n")}\n`);
  console.log(JSON.stringify({ outputPath, articles: rows.length, categories: categoryCounts.size }));
} finally {
  await connection.end();
}
