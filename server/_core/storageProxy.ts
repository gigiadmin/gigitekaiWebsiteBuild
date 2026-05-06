import type { Express } from "express";
import { ENV } from "./env";

// In-memory cache for storage assets (key -> { buffer, contentType, expires })
// This eliminates the 307 redirect chain and the no-store cache on CloudFront signed URLs.
// Assets are cached for 23 hours (just under the 24h signed URL expiry).
const ASSET_CACHE_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours
const ASSET_CACHE_MAX_ENTRIES = 100; // prevent unbounded memory growth
const assetCache = new Map<string, { buffer: Buffer; contentType: string; expiresAt: number }>();

function pruneAssetCache() {
  const now = Date.now();
  Array.from(assetCache.entries()).forEach(([k, v]) => {
    if (v.expiresAt < now) assetCache.delete(k);
  });
  // If still too large, evict oldest entries
  if (assetCache.size > ASSET_CACHE_MAX_ENTRIES) {
    const keys = Array.from(assetCache.keys());
    for (let i = 0; i < keys.length - ASSET_CACHE_MAX_ENTRIES; i++) {
      assetCache.delete(keys[i]);
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
      res.set("Cache-Control", "public, max-age=86400, immutable");
      res.set("Content-Type", cached.contentType);
      res.set("X-Cache", "HIT");
      return res.send(cached.buffer);
    }

    try {
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

      // Fetch the actual asset bytes and cache them
      const assetResp = await fetch(url);
      if (!assetResp.ok) {
        // Fall back to redirect if fetch fails
        res.set("Cache-Control", "public, max-age=86400");
        return res.redirect(307, url);
      }

      const buffer = Buffer.from(await assetResp.arrayBuffer());
      const contentType = assetResp.headers.get("content-type") || "application/octet-stream";

      // Cache in memory (only cache assets under 5MB)
      if (buffer.length < 5 * 1024 * 1024) {
        pruneAssetCache();
        assetCache.set(key, { buffer, contentType, expiresAt: Date.now() + ASSET_CACHE_TTL_MS });
      }

      // Serve with long-lived cache headers so browsers cache the asset
      res.set("Cache-Control", "public, max-age=86400, immutable");
      res.set("Content-Type", contentType);
      res.set("X-Cache", "MISS");
      return res.send(buffer);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
