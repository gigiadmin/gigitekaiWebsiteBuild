/**
 * Collect map-generated Copilot KB article JSON files into one validated local directory.
 */
import fs from "node:fs/promises";
import path from "node:path";

const manifestPath = process.argv[2] || "/home/ubuntu/generate_copilot_kb_articles.json";
const outputDir = process.argv[3] || "/home/ubuntu/gigitekai-kb-copilot/articles/raw";
const expectedCount = Number(process.argv[4] || 100);
const concurrency = 8;

await fs.mkdir(outputDir, { recursive: true });
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const rows = manifest.results || [];

if (rows.length !== expectedCount) throw new Error(`Expected ${expectedCount} generated results, found ${rows.length}`);

let cursor = 0;
const collected = [];

async function worker() {
  while (cursor < rows.length) {
    const index = cursor++;
    const row = rows[index];
    const id = Number(row?.output?.article_id ?? row?.input);
    const url = row?.output?.article_file;
    if (!Number.isInteger(id) || !url) throw new Error(`Missing article ID or URL at manifest row ${index}`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Article ${id} download failed: HTTP ${response.status}`);
    const text = await response.text();
    const article = JSON.parse(text);
    const filePath = path.join(outputDir, `article-${String(id).padStart(3, "0")}.json`);
    await fs.writeFile(filePath, `${JSON.stringify(article, null, 2)}\n`);
    collected.push({ id, filePath, bytes: Buffer.byteLength(text) });
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
collected.sort((a, b) => a.id - b.id);
const reportPath = path.join(path.dirname(outputDir), "collection-report.json");
await fs.writeFile(reportPath, `${JSON.stringify({ collectedAt: new Date().toISOString(), count: collected.length, articles: collected }, null, 2)}\n`);
console.log(JSON.stringify({ outputDir, reportPath, count: collected.length }));
