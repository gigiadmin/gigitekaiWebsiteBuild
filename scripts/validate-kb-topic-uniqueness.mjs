/**
 * Validate proposed KB topics against the complete existing KB inventory.
 */
import fs from "node:fs/promises";

const inventoryPath = process.argv[2] || "/home/ubuntu/gigitekai-kb-copilot/existing-kb-inventory.json";
const topicsPath = process.argv[3] || "content/kb/copilot-100-topics.json";
const reportPath = process.argv[4] || "/home/ubuntu/gigitekai-kb-copilot/topic-uniqueness-report.json";

const STOP = new Set(["a", "an", "and", "for", "from", "in", "into", "of", "on", "or", "the", "to", "use", "using", "with", "your"]);

function normalize(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugify(value = "") {
  return normalize(value).replace(/\s+/g, "-");
}

function tokenSet(value = "") {
  return new Set(normalize(value).split(/\s+/).filter(token => token.length > 1 && !STOP.has(token)));
}

function jaccard(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  const intersection = [...a].filter(token => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8"));
const topics = JSON.parse(await fs.readFile(topicsPath, "utf8"));
const existing = inventory.articles || [];

const exactTitleMatches = [];
const exactSlugMatches = [];
const semanticWarnings = [];
const candidateDuplicates = [];

for (let index = 0; index < topics.length; index += 1) {
  const topic = topics[index];
  for (let other = index + 1; other < topics.length; other += 1) {
    const score = jaccard(topic.title, topics[other].title);
    if (normalize(topic.title) === normalize(topics[other].title) || score >= 0.78) {
      candidateDuplicates.push({ left: topic.title, right: topics[other].title, score: Number(score.toFixed(3)) });
    }
  }

  for (const article of existing) {
    if (normalize(topic.title) === normalize(article.title)) {
      exactTitleMatches.push({ proposed: topic.title, existingId: article.id, existing: article.title });
    }
    if (slugify(topic.title) === slugify(article.title)) {
      exactSlugMatches.push({ proposed: topic.title, existingId: article.id, existing: article.title });
    }
    const score = jaccard(topic.title, article.title);
    if (score >= 0.72) {
      semanticWarnings.push({ proposed: topic.title, existingId: article.id, existing: article.title, score: Number(score.toFixed(3)) });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  existingCount: existing.length,
  proposedCount: topics.length,
  exactTitleMatches,
  exactSlugMatches,
  candidateDuplicates,
  semanticWarnings: semanticWarnings.sort((a, b) => b.score - a.score),
  passed: topics.length === 100 && exactTitleMatches.length === 0 && exactSlugMatches.length === 0 && candidateDuplicates.length === 0,
};

await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  reportPath,
  proposedCount: report.proposedCount,
  exactTitleMatches: exactTitleMatches.length,
  exactSlugMatches: exactSlugMatches.length,
  candidateDuplicates: candidateDuplicates.length,
  semanticWarnings: semanticWarnings.length,
  passed: report.passed,
}));

if (!report.passed) process.exitCode = 1;
