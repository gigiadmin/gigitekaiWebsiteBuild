/**
 * Import KB articles from the batch3/ folder into the kbArticles table.
 *
 * Usage:
 *   node scripts/import-batch3.mjs            # dry run — parses & prints, no DB writes
 *   node scripts/import-batch3.mjs --commit   # actually inserts into the DB
 *
 * Reads DATABASE_URL from the environment. Parses each .md file's header block
 * (Title, Category, Article Code, Tags) and inserts the full markdown as content.
 * Idempotent: skips a file if an article whose title starts with the same
 * Article Code already exists.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BATCH_DIR = path.resolve(__dirname, "..", "batch3");
const COMMIT = process.argv.includes("--commit");

function parseArticle(content, file) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const codeMatch = content.match(/\*\*Article Code:\*\*\s*(.+)$/m);
  const categoryMatch = content.match(/\*\*Category:\*\*\s*(.+)$/m);
  const tagsMatch = content.match(/\*\*Tags:\*\*\s*(.+)$/m);

  const code = (codeMatch?.[1] || file.split("-").slice(0, 2).join("-")).trim();
  const title = (titleMatch?.[1] || file.replace(/\.md$/, "")).trim();
  const category = (categoryMatch?.[1] || "General").trim();
  const tags = (tagsMatch?.[1] || "").replace(/[[\]]/g, "").trim();

  return { code, title, category, tags, content };
}

async function main() {
  if (!fs.existsSync(BATCH_DIR)) {
    console.error(`❌ batch3/ folder not found at ${BATCH_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(BATCH_DIR).filter((f) => f.endsWith(".md")).sort();
  console.log(`📁 Found ${files.length} article file(s) in batch3/`);
  console.log(COMMIT ? "🟢 COMMIT mode — will write to DB\n" : "🟡 DRY RUN — no DB writes (pass --commit to insert)\n");

  if (!COMMIT) {
    for (const file of files) {
      const a = parseArticle(fs.readFileSync(path.join(BATCH_DIR, file), "utf-8"), file);
      console.log(`• ${a.code.padEnd(9)} ${a.title}  [${a.category}] (${a.content.length} chars)`);
    }
    console.log(`\nParsed ${files.length} file(s). Re-run with --commit to import.`);
    return;
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  let imported = 0, skipped = 0;
  try {
    for (const file of files) {
      const a = parseArticle(fs.readFileSync(path.join(BATCH_DIR, file), "utf-8"), file);
      const [rows] = await connection.execute(
        "SELECT id FROM kbArticles WHERE title LIKE ? LIMIT 1",
        [`${a.code}%`]
      );
      if (rows.length) {
        console.log(`⏭️  ${a.code} already exists — skipping`);
        skipped++;
        continue;
      }
      await connection.execute(
        `INSERT INTO kbArticles (title, content, category, tags, isPublished, syncSource, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'manual', NOW(), NOW())`,
        [`${a.code}: ${a.title}`.slice(0, 500), a.content, a.category.slice(0, 100), a.tags.slice(0, 500), true]
      );
      console.log(`✅ ${a.code}  ${a.title}`);
      imported++;
    }
    console.log(`\n📊 Imported ${imported}, skipped ${skipped}, total ${files.length}`);
  } finally {
    await connection.end();
  }
}

main().catch((e) => {
  console.error("💥", e);
  process.exit(1);
});
