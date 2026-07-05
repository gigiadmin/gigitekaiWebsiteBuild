/**
 * Build a correctly-escaped CSV (Title,Content,Category,Tags) from batch3/*.md.
 *
 * The original KB data loss came from a truncated CSV — unescaped commas,
 * quotes, and newlines inside the Content cell. This script does RFC-4180
 * escaping programmatically so the Content column (multi-line markdown) can
 * never break the row structure.
 *
 * Usage:
 *   node scripts/build-kb-csv.mjs                 # writes batch3/kb-batch3.csv
 *   node scripts/build-kb-csv.mjs out.csv         # custom output path
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BATCH_DIR = path.resolve(__dirname, "..", "batch3");
const OUT = path.resolve(process.argv[2] || path.join(BATCH_DIR, "kb-batch3.csv"));

/** RFC-4180: wrap in double quotes, escape embedded quotes by doubling. */
function csvField(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function parse(content, file) {
  const title = (content.match(/^#\s+(.+)$/m)?.[1] || file.replace(/\.md$/, "")).trim();
  const code = (content.match(/\*\*Article Code:\*\*\s*(.+)$/m)?.[1] || "").trim();
  const category = (content.match(/\*\*Category:\*\*\s*(.+)$/m)?.[1] || "General").trim();
  const tags = (content.match(/\*\*Tags:\*\*\s*(.+)$/m)?.[1] || "").replace(/[[\]]/g, "").trim();
  return { title: code ? `${code}: ${title}` : title, content, category, tags };
}

const files = fs.readdirSync(BATCH_DIR).filter((f) => f.endsWith(".md")).sort();
const rows = files.map((f) => parse(fs.readFileSync(path.join(BATCH_DIR, f), "utf-8"), f));

const header = ["Title", "Content", "Category", "Tags"].join(",");
const body = rows
  .map((r) => [csvField(r.title), csvField(r.content), csvField(r.category), csvField(r.tags)].join(","))
  .join("\r\n");

fs.writeFileSync(OUT, header + "\r\n" + body + "\r\n", "utf-8");
console.log(`✅ Wrote ${rows.length} row(s) to ${OUT}`);
rows.forEach((r) => console.log(`   • ${r.title}  [${r.category}] (${r.content.length} chars)`));
