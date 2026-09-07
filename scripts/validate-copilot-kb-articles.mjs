/**
 * Validate generated Copilot KB articles before any database publication.
 */
import fs from "node:fs/promises";
import path from "node:path";

const topicsPath = process.argv[2] || "content/kb/copilot-100-topics.json";
const existingPath = process.argv[3] || "/home/ubuntu/gigitekai-kb-copilot/existing-kb-inventory.json";
const articlesDir = process.argv[4] || "/home/ubuntu/gigitekai-kb-copilot/articles/raw";
const reportPath = process.argv[5] || "/home/ubuntu/gigitekai-kb-copilot/article-quality-report.json";

const topics = JSON.parse(await fs.readFile(topicsPath, "utf8"));
const existing = JSON.parse(await fs.readFile(existingPath, "utf8")).articles || [];
const filenames = (await fs.readdir(articlesDir)).filter(name => name.endsWith(".json")).sort();
const allowedHosts = new Set(["learn.microsoft.com", "support.microsoft.com", "adoption.microsoft.com", "www.microsoft.com", "microsoft.com", "docs.github.com", "github.com"]);
const requiredHeadings = [
  "## Applies to",
  "## Before you begin",
  "## Resolution or implementation steps",
  "## Validate the result",
  "## Common issues and fixes",
  "## Security and governance notes",
  "## When to escalate",
  "## References",
];

function normalize(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function wordCount(markdown = "") {
  return markdown
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[`#*_>|\[\]()-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function titleTokens(value = "") {
  const stop = new Set(["a", "an", "and", "for", "from", "in", "into", "of", "on", "or", "the", "to", "use", "using", "with", "your"]);
  return new Set(normalize(value).split(/\s+/).filter(token => token.length > 1 && !stop.has(token)));
}

function jaccard(left, right) {
  const a = titleTokens(left);
  const b = titleTokens(right);
  const intersection = [...a].filter(token => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function shingles(value = "", size = 8) {
  const words = normalize(value).split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let index = 0; index <= words.length - size; index += 1) set.add(words.slice(index, index + size).join(" "));
  return set;
}

function shingleSimilarity(left, right) {
  const a = shingles(left);
  const b = shingles(right);
  const intersection = [...a].filter(item => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

const articles = [];
const failures = [];
const warnings = [];

for (const filename of filenames) {
  const filePath = path.join(articlesDir, filename);
  const article = JSON.parse(await fs.readFile(filePath, "utf8"));
  const id = Number(article.id);
  const topic = topics.find(item => item.id === id);
  const reasons = [];
  const articleWarnings = [];
  const content = String(article.content || "");
  const words = wordCount(content);
  const references = Array.isArray(article.references) ? article.references : [];

  if (!topic) reasons.push("Unknown article id");
  if (topic && article.title !== topic.title) reasons.push("Title differs from approved architecture");
  if (topic && article.category !== topic.category) reasons.push("Category differs from approved architecture");
  if (topic && article.audience !== topic.audience) reasons.push("Audience differs from approved architecture");
  if (topic && article.intent !== topic.intent) reasons.push("Intent differs from approved architecture");
  if (words < 650 || words > 1400) reasons.push(`Word count ${words} outside accepted 650-1400 range`);
  if (!article.summary || String(article.summary).length > 240) reasons.push("Summary missing or longer than 240 characters");
  if (!article.tags || !String(article.tags).toLowerCase().includes("microsoft-copilot")) reasons.push("Required microsoft-copilot tag missing");
  if (!content.startsWith(`# ${article.title}`)) reasons.push("Article does not start with its exact H1 title");
  for (const heading of requiredHeadings) if (!content.includes(heading)) reasons.push(`Missing heading: ${heading}`);
  if (!content.includes("support@gigitekai.com") || !content.includes("609-676-4483")) reasons.push("Approved escalation contact missing");
  if (references.length < 2 || references.length > 5) reasons.push(`Reference count ${references.length} outside 2-5`);
  for (const reference of references) {
    try {
      const url = new URL(reference.url);
      if (!allowedHosts.has(url.hostname.toLowerCase())) reasons.push(`Non-approved reference host: ${url.hostname}`);
      if (!content.includes(reference.url)) articleWarnings.push(`Reference URL not rendered in content: ${reference.url}`);
    } catch {
      reasons.push(`Invalid reference URL: ${reference.url}`);
    }
  }
  const citedNumbers = [...content.matchAll(/\[(\d+)\]/g)].map(match => Number(match[1]));
  for (let number = 1; number <= references.length; number += 1) {
    if (!citedNumbers.includes(number)) reasons.push(`Citation [${number}] not used`);
  }
  for (const current of existing) {
    const score = jaccard(article.title, current.title);
    if (normalize(article.title) === normalize(current.title)) reasons.push(`Exact existing-title duplicate: ${current.id}`);
    else if (score >= 0.72) articleWarnings.push(`Potential existing-title overlap ${score.toFixed(3)} with ${current.id}: ${current.title}`);
  }

  const result = { id, filePath, title: article.title, category: article.category, wordCount: words, referenceCount: references.length, reasons, warnings: articleWarnings };
  articles.push({ ...article, __filePath: filePath, __wordCount: words });
  if (reasons.length) failures.push(result);
  if (articleWarnings.length) warnings.push(result);
}

const pairwiseContentWarnings = [];
for (let left = 0; left < articles.length; left += 1) {
  for (let right = left + 1; right < articles.length; right += 1) {
    const score = shingleSimilarity(articles[left].content, articles[right].content);
    if (score >= 0.28) {
      pairwiseContentWarnings.push({ leftId: articles[left].id, rightId: articles[right].id, similarity: Number(score.toFixed(3)) });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  expected: 100,
  filesFound: filenames.length,
  uniqueIds: new Set(articles.map(item => item.id)).size,
  totalWords: articles.reduce((sum, item) => sum + item.__wordCount, 0),
  failures,
  warnings,
  pairwiseContentWarnings,
  passed: filenames.length === 100 && new Set(articles.map(item => item.id)).size === 100 && failures.length === 0 && pairwiseContentWarnings.length === 0,
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  reportPath,
  filesFound: report.filesFound,
  uniqueIds: report.uniqueIds,
  totalWords: report.totalWords,
  failures: failures.length,
  warnings: warnings.length,
  pairwiseContentWarnings: pairwiseContentWarnings.length,
  passed: report.passed,
}));
if (!report.passed) process.exitCode = 1;
