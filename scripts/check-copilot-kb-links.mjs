/** Validate all unique official reference URLs in the generated Copilot KB batch. */
import fs from "node:fs/promises";
import path from "node:path";

const articlesDir = process.argv[2] || "/home/ubuntu/gigitekai-kb-copilot/articles/raw";
const reportPath = process.argv[3] || "/home/ubuntu/gigitekai-kb-copilot/reference-link-report.json";
const filenames = (await fs.readdir(articlesDir)).filter(name => name.endsWith(".json")).sort();
const referenceMap = new Map();

for (const filename of filenames) {
  const article = JSON.parse(await fs.readFile(path.join(articlesDir, filename), "utf8"));
  for (const reference of article.references || []) {
    if (!referenceMap.has(reference.url)) referenceMap.set(reference.url, { title: reference.title, articleIds: [] });
    referenceMap.get(reference.url).articleIds.push(article.id);
  }
}

const entries = [...referenceMap.entries()];
const results = [];
let cursor = 0;

async function worker() {
  while (cursor < entries.length) {
    const [url, metadata] = entries[cursor++];
    let status = 0;
    let finalUrl = url;
    let error = "";
    try {
      const response = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "GigitekAI-KB-Link-Validator/1.0" } });
      status = response.status;
      finalUrl = response.url;
      await response.body?.cancel();
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
    results.push({ url, finalUrl, status, ok: status >= 200 && status < 400, error, ...metadata });
  }
}

await Promise.all(Array.from({ length: 12 }, () => worker()));
results.sort((a, b) => a.url.localeCompare(b.url));
const failed = results.filter(result => !result.ok);
const report = { checkedAt: new Date().toISOString(), articleCount: filenames.length, uniqueReferenceCount: results.length, passed: failed.length === 0, failed, results };
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, articleCount: filenames.length, uniqueReferenceCount: results.length, failed: failed.length, passed: report.passed }));
if (failed.length) process.exitCode = 1;
