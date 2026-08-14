#!/usr/bin/env node
/**
 * Generate an object manifest from the source database.
 * Scans tables known to store uploaded/object URLs and produces a JSON manifest
 * for scripts/migrate-objects-to-azure.mjs.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/generate-object-manifest.mjs
 */
import { createConnection } from "mysql2/promise";
import fs from "fs/promises";

const dbUrl = new URL(process.env.DATABASE_URL || "mysql://localhost/gigitekai");

const tablesAndColumns = [
  { table: "chatMessages", column: "attachmentUrl" },
  { table: "tickets", column: "attachmentUrl" },
  { table: "callLogs", column: "recordingUrl" },
  { table: "emailMessages", column: "attachmentUrl" },
  { table: "blogPosts", column: "coverImageUrl" },
  { table: "kbArticles", column: "coverImageUrl" },
  { table: "settings", column: "value" },
];

async function main() {
  const connection = await createConnection({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || "3306", 10),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace(/^\//, ""),
    ssl: process.env.DATABASE_SSL === "true" ? {} : undefined,
  });

  const seen = new Set();
  const manifest = [];

  for (const { table, column } of tablesAndColumns) {
    try {
      const [rows] = await connection.query(`SELECT id, ${column} AS url FROM ${table} WHERE ${column} IS NOT NULL AND ${column} != ''`);
      for (const row of rows) {
        const url = row.url;
        if (!url || typeof url !== "string") continue;
        // Extract object keys from known URL patterns
        const matches = url.match(/(?:\/manus-storage\/|\.r2\.\w+\.cloudflarestorage\.com\/|s3\.amazonaws\.com\/[^/]+\/)([^?\s"]+)/g);
        if (!matches) continue;
        for (const match of matches) {
          const key = match.replace(/^.*\/(?:manus-storage\/|.*\.r2\.\w+\.cloudflarestorage\.com\/|.*s3\.amazonaws\.com\/[^/]+\/)/, "");
          if (!key || seen.has(key)) continue;
          seen.add(key);
          manifest.push({
            sourceKey: key,
            sourceUrl: url,
            sourceTable: table,
            sourceRecordId: String(row.id),
            targetKey: key,
            contentType: inferContentType(key),
            status: "pending",
          });
        }
      }
    } catch (err) {
      console.warn(`[manifest] skipping ${table}.${column}: ${err.message}`);
    }
  }

  await connection.end();
  const outPath = process.env.MANIFEST_PATH || "./migration-object-manifest.json";
  await fs.writeFile(outPath, JSON.stringify(manifest, null, 2));
  console.log(`[manifest] Wrote ${manifest.length} unique objects to ${outPath}`);
}

function inferContentType(key) {
  const ext = key.split(".").pop()?.toLowerCase();
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
  };
  return map[ext] || "application/octet-stream";
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
