/**
 * Publish the validated Copilot KB batch through the existing kbArticles model.
 * Dry-run by default. Pass --publish to commit one all-or-nothing transaction.
 */
import { config } from "dotenv";
import mysql from "mysql2/promise";
import fs from "node:fs/promises";
import path from "node:path";

config();

const publish = process.argv.includes("--publish");
const articlesDir = "/home/ubuntu/gigitekai-kb-copilot/articles/raw";
const reportPath = "/home/ubuntu/gigitekai-kb-copilot/article-quality-report-final.json";
const batchSource = "gigitekai-copilot-2026-09";

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

function mapAudience(value = "") {
  const audience = value.toLowerCase();
  if (audience.includes("administrator") || audience.includes("architect") || audience.includes("developer") || audience.includes("owner")) return "admin";
  if (audience.includes("helpdesk") || audience.includes("support") || audience.includes("technician")) return "technician";
  return "end-user";
}

function mapDifficulty(category = "") {
  if (/Security|Administration|Operations|Agents and Extensibility/.test(category)) return "advanced";
  if (/Studio Build|Troubleshooting/.test(category)) return "intermediate";
  return "beginner";
}

const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
if (!report.passed || report.filesFound !== 100 || report.uniqueIds !== 100) {
  throw new Error("Quality report has not passed for exactly 100 unique articles");
}

const filenames = (await fs.readdir(articlesDir)).filter(name => name.endsWith(".json")).sort();
if (filenames.length !== 100) throw new Error(`Expected 100 article files, found ${filenames.length}`);

const articles = [];
for (const filename of filenames) {
  const article = JSON.parse(await fs.readFile(path.join(articlesDir, filename), "utf8"));
  const references = Array.isArray(article.references) ? article.references : [];
  const id = Number(article.id);
  articles.push({
    id,
    title: article.title,
    content: article.content,
    category: article.category,
    tags: Array.isArray(article.tags) ? article.tags.join(",").toLowerCase() : String(article.tags || "").toLowerCase(),
    sourceUrl: references[0]?.url || null,
    externalUid: `${batchSource}-${String(id).padStart(3, "0")}`,
    audience: mapAudience(article.audience),
    difficulty: mapDifficulty(article.category),
    articleCode: `COP-${String(id).padStart(3, "0")}`,
  });
}

const connection = await mysql.createConnection(parseDbUrl(dbUrl));
try {
  const [existingRows] = await connection.query(
    `SELECT id, title, externalUid FROM kbArticles WHERE syncSource = ? OR externalUid LIKE ? OR title IN (?)`,
    [batchSource, `${batchSource}-%`, articles.map(article => article.title)]
  );
  const existingTitles = new Set(existingRows.map(row => String(row.title).toLowerCase()));
  const existingUids = new Set(existingRows.map(row => row.externalUid).filter(Boolean));
  const conflicts = articles.filter(article => existingTitles.has(article.title.toLowerCase()) || existingUids.has(article.externalUid));

  const summary = {
    mode: publish ? "publish" : "dry-run",
    batchSource,
    qualityPassed: report.passed,
    candidateCount: articles.length,
    existingConflictCount: conflicts.length,
    existingConflicts: conflicts.map(article => ({ id: article.id, title: article.title, externalUid: article.externalUid })),
  };

  if (conflicts.length) {
    console.log(JSON.stringify(summary));
    throw new Error("Publication stopped because duplicate titles or external UIDs already exist");
  }

  if (!publish) {
    console.log(JSON.stringify({ ...summary, readyToPublish: true }));
    process.exit(0);
  }

  await connection.beginTransaction();
  try {
    for (const article of articles) {
      await connection.execute(
        `INSERT INTO kbArticles
          (title, content, category, tags, isPublished, sourceUrl, externalUid, syncSource, lastSyncedAt, subcategory, audience, difficulty, estimatedResolutionTime, ariaEnabled, articleCode)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, NOW(), 'Microsoft Copilot', ?, ?, '10-20 minutes', 1, ?)`,
        [article.title, article.content, article.category, article.tags, article.sourceUrl, article.externalUid, batchSource, article.audience, article.difficulty, article.articleCode]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }

  const [[verification]] = await connection.query(
    `SELECT COUNT(*) AS inserted, COUNT(DISTINCT title) AS uniqueTitles, COUNT(DISTINCT externalUid) AS uniqueExternalUids
     FROM kbArticles WHERE syncSource = ? AND isPublished = 1`,
    [batchSource]
  );
  console.log(JSON.stringify({ ...summary, inserted: Number(verification.inserted), uniqueTitles: Number(verification.uniqueTitles), uniqueExternalUids: Number(verification.uniqueExternalUids) }));
} finally {
  await connection.end();
}
