import fs from "node:fs/promises";
import path from "node:path";
import { desc } from "drizzle-orm";
import { getDb } from "../server/db.ts";
import { kbArticles, kbAuditRuns } from "../drizzle/schema.ts";

const outputDir = "/home/ubuntu/gigitekai-kb-remediation";
await fs.mkdir(outputDir, { recursive: true });

const db = await getDb();
if (!db) throw new Error("Knowledge Base database is unavailable");

const [latest] = await db.select().from(kbAuditRuns).orderBy(desc(kbAuditRuns.createdAt)).limit(1);
if (!latest) throw new Error("No Knowledge Base audit run exists");

const findings = latest.findings ?? { links: [], duplicates: [], stale: [], omittedReferenceCount: 0 };
const articles = await db.select({
  id: kbArticles.id,
  title: kbArticles.title,
  category: kbArticles.category,
  content: kbArticles.content,
  sourceUrl: kbArticles.sourceUrl,
  externalUid: kbArticles.externalUid,
  syncSource: kbArticles.syncSource,
  articleCode: kbArticles.articleCode,
  isPublished: kbArticles.isPublished,
  ariaEnabled: kbArticles.ariaEnabled,
  viewCount: kbArticles.viewCount,
  averageRating: kbArticles.averageRating,
  ratingCount: kbArticles.ratingCount,
  commentCount: kbArticles.commentCount,
  createdAt: kbArticles.createdAt,
  updatedAt: kbArticles.updatedAt,
}).from(kbArticles);

const brokenLinks = (findings.links ?? []).filter(link => link.state === "broken");
const brokenReferenceInputs = brokenLinks.map(link => ({
  ...link,
  affectedArticles: articles
    .filter(article => article.sourceUrl === link.url || article.content.includes(link.url))
    .map(article => {
      const matchIndex = article.content.indexOf(link.url);
      return {
        id: article.id,
        articleCode: article.articleCode,
        title: article.title,
        category: article.category,
        sourceUrlMatches: article.sourceUrl === link.url,
        contentOccurrences: article.content.split(link.url).length - 1,
        context: matchIndex >= 0
          ? article.content.slice(Math.max(0, matchIndex - 240), Math.min(article.content.length, matchIndex + link.url.length + 240))
          : "",
        updatedAt: article.updatedAt,
      };
    }),
}));

const byId = new Map(articles.map(article => [article.id, article]));
const duplicateCandidateInputs = (findings.duplicates ?? []).map((candidate, index) => {
  const first = byId.get(candidate.firstId);
  const second = byId.get(candidate.secondId);
  return {
    candidateNumber: index + 1,
    similarity: candidate.similarity,
    first: first ? {
      id: first.id,
      articleCode: first.articleCode,
      title: first.title,
      category: first.category,
      content: first.content,
      contentLength: first.content.length,
      sourceUrl: first.sourceUrl,
      externalUid: first.externalUid,
      syncSource: first.syncSource,
      isPublished: first.isPublished,
      ariaEnabled: first.ariaEnabled,
      viewCount: first.viewCount,
      averageRating: first.averageRating,
      ratingCount: first.ratingCount,
      commentCount: first.commentCount,
      createdAt: first.createdAt,
      updatedAt: first.updatedAt,
    } : null,
    second: second ? {
      id: second.id,
      articleCode: second.articleCode,
      title: second.title,
      category: second.category,
      content: second.content,
      contentLength: second.content.length,
      sourceUrl: second.sourceUrl,
      externalUid: second.externalUid,
      syncSource: second.syncSource,
      isPublished: second.isPublished,
      ariaEnabled: second.ariaEnabled,
      viewCount: second.viewCount,
      averageRating: second.averageRating,
      ratingCount: second.ratingCount,
      commentCount: second.commentCount,
      createdAt: second.createdAt,
      updatedAt: second.updatedAt,
    } : null,
  };
});

await Promise.all([
  fs.writeFile(path.join(outputDir, "latest-audit-findings.json"), JSON.stringify({
    audit: {
      id: latest.id,
      periodKey: latest.periodKey,
      status: latest.status,
      totalArticles: latest.totalArticles,
      brokenReferences: latest.brokenReferences,
      duplicateGroups: latest.duplicateGroups,
    },
    findings,
  }, null, 2)),
  fs.writeFile(path.join(outputDir, "broken-reference-inputs.json"), JSON.stringify(brokenReferenceInputs, null, 2)),
  fs.writeFile(path.join(outputDir, "duplicate-candidate-inputs.json"), JSON.stringify(duplicateCandidateInputs, null, 2)),
]);

console.log(JSON.stringify({
  auditId: latest.id,
  brokenReferenceCount: brokenReferenceInputs.length,
  brokenReferenceArticleImpacts: brokenReferenceInputs.reduce((sum, item) => sum + item.affectedArticles.length, 0),
  duplicateCandidateCount: duplicateCandidateInputs.length,
  missingDuplicateArticles: duplicateCandidateInputs.filter(item => !item.first || !item.second).length,
  outputDir,
}, null, 2));
