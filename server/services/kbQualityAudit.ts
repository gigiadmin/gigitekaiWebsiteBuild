import { and, desc, eq } from "drizzle-orm";
import { kbArticles, kbAuditRuns } from "../../drizzle/schema";
import { getDb } from "../db";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";

const COPILOT_BATCH_SOURCE = "gigitekai-copilot-2026-09";
const STALE_AFTER_DAYS = 365;
const MAX_REFERENCE_CHECKS = 500;
const LINK_CONCURRENCY = 20;
const LINK_TIMEOUT_MS = 4_000;

const ignoredTitleWords = new Set([
  "a", "an", "and", "for", "from", "in", "of", "on", "the", "to", "using", "with",
]);

function normalizeTitleToken(word: string) {
  if (word === "troubleshooting") return "troubleshoot";
  if (word.endsWith("ies") && word.length > 5) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ing") && word.length > 7) return word.slice(0, -3);
  if (word.endsWith("s") && word.length > 5 && !["access", "business", "microsoft", "status"].includes(word)) return word.slice(0, -1);
  return word;
}

export type LinkFinding = {
  url: string;
  status: number | null;
  state: "ok" | "broken" | "blocked" | "unreachable";
};

export type DuplicateFinding = {
  firstId: number;
  firstTitle: string;
  secondId: number;
  secondTitle: string;
  similarity: number;
};

export type StaleFinding = {
  id: number;
  title: string;
  updatedAt: string;
  ageDays: number;
};

export type KbAuditFindings = {
  stale: StaleFinding[];
  duplicates: DuplicateFinding[];
  links: LinkFinding[];
  omittedReferenceCount: number;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export function normalizeKbTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/microsoft 365/g, "m365")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 1 && !ignoredTitleWords.has(word))
    .map(normalizeTitleToken)
    .join(" ")
    .trim();
}

function tokenSet(value: string) {
  return new Set(normalizeKbTitle(value).split(" ").filter(Boolean));
}

export function kbTitleSimilarity(first: string, second: string) {
  const a = tokenSet(first);
  const b = tokenSet(second);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter(token => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

export function findDuplicateKbTitles(articles: Array<{ id: number; title: string }>) {
  const findings: DuplicateFinding[] = [];
  for (let firstIndex = 0; firstIndex < articles.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < articles.length; secondIndex += 1) {
      const first = articles[firstIndex];
      const second = articles[secondIndex];
      const firstNormalized = normalizeKbTitle(first.title);
      const secondNormalized = normalizeKbTitle(second.title);
      const similarity = firstNormalized === secondNormalized ? 1 : kbTitleSimilarity(first.title, second.title);
      if (similarity >= 0.86 && Math.min(tokenSet(first.title).size, tokenSet(second.title).size) >= 4) {
        findings.push({
          firstId: first.id,
          firstTitle: first.title,
          secondId: second.id,
          secondTitle: second.title,
          similarity: Number(similarity.toFixed(3)),
        });
      }
    }
  }
  return findings.slice(0, 100);
}

export function extractKbReferenceUrls(articles: Array<{ content: string; sourceUrl?: string | null }>) {
  const urls = new Set<string>();
  const urlPattern = /https?:\/\/[^\s)\]}>"']+/g;
  for (const article of articles) {
    if (article.sourceUrl?.startsWith("http")) urls.add(article.sourceUrl);
    for (const match of article.content.match(urlPattern) ?? []) {
      urls.add(match.replace(/[.,;:!?]+$/, ""));
    }
  }
  return [...urls].sort();
}

async function checkOneReference(url: string): Promise<LinkFinding> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
      headers: { "User-Agent": "GigitekAI-KB-Audit/1.0" },
    });
    const status = response.status;
    if (status === 404 || status === 410) return { url, status, state: "broken" };
    if ([401, 403, 405, 429].includes(status)) return { url, status, state: "blocked" };
    if (status >= 500) return { url, status, state: "unreachable" };
    return { url, status, state: "ok" };
  } catch {
    return { url, status: null, state: "unreachable" };
  }
}

export async function checkKbReferenceUrls(urls: string[]) {
  const selected = urls.slice(0, MAX_REFERENCE_CHECKS);
  const results: LinkFinding[] = [];
  for (let index = 0; index < selected.length; index += LINK_CONCURRENCY) {
    const batch = selected.slice(index, index + LINK_CONCURRENCY);
    results.push(...await Promise.all(batch.map(checkOneReference)));
  }
  return { results, omittedReferenceCount: Math.max(0, urls.length - selected.length) };
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export async function runMonthlyKbQualityAudit(options?: { taskUid?: string; source?: "scheduled" | "manual"; now?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Knowledge Base database is unavailable");
  const now = options?.now ?? new Date();
  const periodKey = monthKey(now);
  const [existing] = await db.select().from(kbAuditRuns).where(eq(kbAuditRuns.periodKey, periodKey)).limit(1);
  if (existing?.status === "completed") {
    return { skipped: true, reason: "period-already-completed", audit: existing };
  }

  let auditId = existing?.id;
  if (auditId) {
    await db.update(kbAuditRuns).set({
      status: "running",
      source: options?.source ?? "scheduled",
      taskUid: options?.taskUid,
      errorMessage: null,
      startedAt: now.toISOString().slice(0, 19).replace("T", " "),
    }).where(eq(kbAuditRuns.id, auditId));
  } else {
    const [insertResult] = await db.insert(kbAuditRuns).values({
      periodKey,
      source: options?.source ?? "scheduled",
      taskUid: options?.taskUid,
      status: "running",
    });
    auditId = Number((insertResult as { insertId?: number }).insertId);
  }

  try {
    const articles = await db.select().from(kbArticles).orderBy(desc(kbArticles.updatedAt));
    const published = articles.filter(article => article.isPublished === 1);
    const cutoff = now.getTime() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
    const stale = published
      .filter(article => new Date(article.updatedAt).getTime() < cutoff)
      .map(article => ({
        id: article.id,
        title: article.title,
        updatedAt: String(article.updatedAt),
        ageDays: Math.floor((now.getTime() - new Date(article.updatedAt).getTime()) / (24 * 60 * 60 * 1000)),
      }))
      .slice(0, 200);
    const duplicates = findDuplicateKbTitles(published.map(article => ({ id: article.id, title: article.title })));
    const referenceUrls = extractKbReferenceUrls(published);
    const referenceCheck = await checkKbReferenceUrls(referenceUrls);
    const broken = referenceCheck.results.filter(result => result.state === "broken");
    const blocked = referenceCheck.results.filter(result => result.state === "blocked" || result.state === "unreachable");
    const findings: KbAuditFindings = {
      stale,
      duplicates,
      links: referenceCheck.results.filter(result => result.state !== "ok"),
      omittedReferenceCount: referenceCheck.omittedReferenceCount,
    };
    const completedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    await db.update(kbAuditRuns).set({
      status: "completed",
      totalArticles: articles.length,
      publishedArticles: published.length,
      copilotArticles: published.filter(article => article.syncSource === COPILOT_BATCH_SOURCE).length,
      unpublishedArticles: articles.length - published.length,
      ariaDisabledArticles: published.filter(article => article.ariaEnabled !== 1).length,
      staleArticles: stale.length,
      duplicateGroups: duplicates.length,
      checkedReferences: referenceCheck.results.length,
      brokenReferences: broken.length,
      blockedReferences: blocked.length,
      findings,
      completedAt,
    }).where(eq(kbAuditRuns.id, auditId));

    const statusLabel = broken.length || duplicates.length ? "Attention required" : "Healthy";
    const subject = `GigitekAI monthly KB audit — ${periodKey} — ${statusLabel}`;
    const html = `
      <h2>${escapeHtml(subject)}</h2>
      <p>The monthly Knowledge Base quality audit completed without changing or deleting any article.</p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse">
        <tr><td>Published articles</td><td>${published.length}</td></tr>
        <tr><td>Validated Copilot articles</td><td>${published.filter(article => article.syncSource === COPILOT_BATCH_SOURCE).length}</td></tr>
        <tr><td>References checked</td><td>${referenceCheck.results.length}</td></tr>
        <tr><td>Broken references</td><td>${broken.length}</td></tr>
        <tr><td>Blocked or unreachable references</td><td>${blocked.length}</td></tr>
        <tr><td>Articles older than ${STALE_AFTER_DAYS} days</td><td>${stale.length}</td></tr>
        <tr><td>Potential duplicate pairs</td><td>${duplicates.length}</td></tr>
      </table>
      <p>Review details in the GigitekAI admin portal under Knowledge Base Audit.</p>`;
    await sendEmail({ to: "support@gigitekai.com", subject, html }).catch(error => {
      console.warn("[KB Audit] Support email failed", error);
    });
    await notifyOwner({ title: subject, content: `Published ${published.length}; broken links ${broken.length}; stale ${stale.length}; duplicate pairs ${duplicates.length}.` }).catch(() => undefined);

    const [audit] = await db.select().from(kbAuditRuns).where(eq(kbAuditRuns.id, auditId)).limit(1);
    return { skipped: false, audit };
  } catch (error) {
    if (auditId) {
      await db.update(kbAuditRuns).set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown Knowledge Base audit error",
        completedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      }).where(eq(kbAuditRuns.id, auditId));
    }
    throw error;
  }
}

export async function getKbAuditHistory(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kbAuditRuns).orderBy(desc(kbAuditRuns.createdAt)).limit(limit);
}

export async function getLatestKbAudit() {
  const history = await getKbAuditHistory(1);
  return history[0] ?? null;
}
