/** Verify every published Copilot KB article through the live public API and route. */
import { config } from "dotenv";
import mysql from "mysql2/promise";
import fs from "node:fs/promises";

config();

const baseUrl = process.argv[2] || "https://gigitekai.com";
const reportPath = process.argv[3] || "/home/ubuntu/gigitekai-kb-copilot/live-verification-report.json";
const dbUrl = process.env.DATABASE_URL;
const batchSource = "gigitekai-copilot-2026-09";
if (!dbUrl) throw new Error("DATABASE_URL is required");

function parseDbUrl(value) {
  const url = new URL(value);
  return { host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.replace(/^\//, ""), ssl: { rejectUnauthorized: false } };
}

async function fetchJson(url) {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000), headers: { "user-agent": "GigitekAI-KB-Release-Validator/1.0" } });
  const body = await response.json();
  const data = body?.result?.data?.json ?? body?.result?.data ?? body?.[0]?.result?.data?.json ?? body?.[0]?.result?.data;
  return { response, data };
}

const connection = await mysql.createConnection(parseDbUrl(dbUrl));
let articles;
try {
  const [rows] = await connection.query(`SELECT id, title, externalUid FROM kbArticles WHERE syncSource = ? AND isPublished = 1 ORDER BY id`, [batchSource]);
  articles = rows;
} finally {
  await connection.end();
}
if (articles.length !== 100) throw new Error(`Expected 100 published rows, found ${articles.length}`);

const listInput = encodeURIComponent(JSON.stringify({ json: {} }));
const { response: listResponse, data: listData } = await fetchJson(`${baseUrl}/api/trpc/kb.list?input=${listInput}`);
const publicBatch = Array.isArray(listData) ? listData.filter(article => article.syncSource === batchSource) : [];

const results = [];
let cursor = 0;
async function worker() {
  while (cursor < articles.length) {
    const article = articles[cursor++];
    const routeResponse = await fetch(`${baseUrl}/kb/${article.id}`, { redirect: "follow", signal: AbortSignal.timeout(30000) });
    await routeResponse.body?.cancel();
    const searchQuery = article.title.split(/\s+/).slice(0, 8).join(" ");
    const searchInput = encodeURIComponent(JSON.stringify({ json: { query: searchQuery, limit: 50 } }));
    let searchVisible = false;
    let searchStatus = 0;
    try {
      const { response, data } = await fetchJson(`${baseUrl}/api/trpc/kb.search?input=${searchInput}`);
      searchStatus = response.status;
      searchVisible = Array.isArray(data) && data.some(item => Number(item.id) === Number(article.id));
    } catch {
      searchVisible = false;
    }
    results.push({ id: Number(article.id), title: article.title, routeStatus: routeResponse.status, routeOk: routeResponse.status === 200, searchStatus, searchVisible });
  }
}

await Promise.all(Array.from({ length: 10 }, () => worker()));
results.sort((a, b) => a.id - b.id);
const failedRoutes = results.filter(result => !result.routeOk);
const failedSearch = results.filter(result => !result.searchVisible);
const report = {
  verifiedAt: new Date().toISOString(),
  baseUrl,
  databasePublishedCount: articles.length,
  publicListStatus: listResponse.status,
  publicListBatchCount: publicBatch.length,
  routeSuccessCount: results.length - failedRoutes.length,
  searchSuccessCount: results.length - failedSearch.length,
  passed: listResponse.status === 200 && publicBatch.length === 100 && failedRoutes.length === 0 && failedSearch.length === 0,
  failedRoutes,
  failedSearch,
  results,
};
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, databasePublishedCount: report.databasePublishedCount, publicListBatchCount: report.publicListBatchCount, routeSuccessCount: report.routeSuccessCount, searchSuccessCount: report.searchSuccessCount, passed: report.passed }));
if (!report.passed) process.exitCode = 1;
