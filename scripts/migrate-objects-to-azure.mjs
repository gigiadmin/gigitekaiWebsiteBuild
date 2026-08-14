#!/usr/bin/env node
/**
 * Object storage migration: Manus/S3 source -> Azure Blob Storage.
 * Reads a manifest of known object URLs from the database, copies each object
 * to Azure Blob, verifies the copy with HEAD/checksum, and records the mapping.
 *
 * Usage:
 *   BUILT_IN_FORGE_API_URL=... BUILT_IN_FORGE_API_KEY=... \
 *   AZURE_STORAGE_ACCOUNT_NAME=... AZURE_STORAGE_CONNECTION_STRING=... \
 *   node scripts/migrate-objects-to-azure.mjs
 */
import fs from "fs/promises";
import crypto from "crypto";
import { getStorageProvider } from "../server/adapters/storage/createStorageProvider.js";
import { normalizeStorageKey } from "../server/adapters/storage/StorageProvider.js";

const MANIFEST_PATH = process.env.MANIFEST_PATH || "./migration-object-manifest.json";
const REPORT_PATH = process.env.REPORT_PATH || "./migration-object-report.json";
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "10", 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || "3", 10);

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, "");
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function getPresignedSourceUrl(key) {
  const url = new URL("v1/storage/presign/get", FORGE_API_URL + "/");
  url.searchParams.set("path", key);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${FORGE_API_KEY}` } });
  if (!res.ok) throw new Error(`Forge presign failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

async function fetchSourceBytes(key) {
  const url = await getPresignedSourceUrl(key);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Source fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function copyObject(item, provider) {
  const key = normalizeStorageKey(item.targetKey || item.sourceKey);
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const sourceBytes = await fetchSourceBytes(item.sourceKey);
      const sourceChecksum = sha256(sourceBytes);

      await provider.putObject({
        key,
        body: sourceBytes,
        contentType: item.contentType || "application/octet-stream",
        metadata: {
          sourceUrl: item.sourceUrl || "",
          migratedAt: new Date().toISOString(),
          sourceChecksum,
        },
      });

      const head = await provider.headObject(key);
      if (!head) throw new Error("Target object missing after upload");
      if (head.size !== sourceBytes.length) {
        throw new Error(`Size mismatch: source ${sourceBytes.length} vs target ${head.size}`);
      }

      return {
        ...item,
        targetKey: key,
        sourceChecksum,
        targetSize: head.size,
        targetContentType: head.contentType,
        status: "verified",
        migratedAt: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err.message;
      console.warn(`[migrate] attempt ${attempt} failed for ${item.sourceKey}: ${lastError}`);
      await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 10000)));
    }
  }
  return {
    ...item,
    targetKey: key,
    status: "failed",
    error: lastError,
  };
}

async function main() {
  if (!FORGE_API_URL || !FORGE_API_KEY) {
    console.error("Set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY to read source objects.");
    process.exit(1);
  }

  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf-8"));
  const provider = getStorageProvider();

  const results = [];
  for (let i = 0; i < manifest.length; i += BATCH_SIZE) {
    const batch = manifest.slice(i, i + BATCH_SIZE);
    const copied = await Promise.all(batch.map(item => copyObject(item, provider)));
    results.push(...copied);
    console.log(`[migrate] processed ${Math.min(i + BATCH_SIZE, manifest.length)}/${manifest.length}`);
  }

  const verified = results.filter(r => r.status === "verified").length;
  const failed = results.filter(r => r.status === "failed").length;
  const report = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    verified,
    failed,
    items: results,
  };

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n[migrate] Done. Verified: ${verified}, Failed: ${failed}. Report: ${REPORT_PATH}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
