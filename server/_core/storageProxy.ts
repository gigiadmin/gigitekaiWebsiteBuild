import type { Express } from "express";
import { ENV } from "./env";

// In-memory cache for storage assets to avoid repeated S3 fetches
// Key: storage path, Value: { data: Buffer, contentType: string, expiresAt: number }
const assetCache = new Map<string, { data: Buffer; contentType: string; expiresAt: number }>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — reduces cold-start LCP penalty
const MAX_CACHE_SIZE = 100; // increased to cache more assets
const MAX_ASSET_SIZE = 5 * 1024 * 1024; // 5MB max per asset to cache

function evictExpiredEntries() {
  const now = Date.now();
  for (const [k, entry] of Array.from(assetCache.entries())) {
    if (entry.expiresAt <= now) {
      assetCache.delete(k);
    }
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as any)[0] as string;
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    // Check in-memory cache first
    const cached = assetCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      res.set("Cache-Control", "public, max-age=604800, immutable"); // 7 days
      res.set("Content-Type", cached.contentType);
      res.set("X-Cache", "HIT");
      res.send(cached.data);
      return;
    }

    try {
      // Get presigned URL from Forge API
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      // Fetch the actual asset bytes from S3
      const assetResp = await fetch(url);
      if (!assetResp.ok) {
        console.error(`[StorageProxy] S3 fetch error: ${assetResp.status}`);
        // Fall back to redirect if byte-serving fails
        res.set("Cache-Control", "public, max-age=86400");
        res.redirect(307, url);
        return;
      }

      const contentType = assetResp.headers.get("content-type") || "application/octet-stream";
      const arrayBuffer = await assetResp.arrayBuffer();
      const data = Buffer.from(arrayBuffer);

      // Cache in memory if asset is small enough
      if (data.length <= MAX_ASSET_SIZE) {
        evictExpiredEntries();
        // Evict oldest entry if cache is full
        if (assetCache.size >= MAX_CACHE_SIZE) {
          const firstKey = assetCache.keys().next().value;
          if (firstKey) assetCache.delete(firstKey);
        }
        assetCache.set(key, {
          data,
          contentType,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      }

      // Serve bytes directly with long-lived cache headers
      res.set("Cache-Control", "public, max-age=604800, immutable"); // 7 days
      res.set("Content-Type", contentType);
      res.set("X-Cache", "MISS");
      res.send(data);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
