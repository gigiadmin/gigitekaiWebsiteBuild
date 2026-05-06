import type { Express } from "express";
import { ENV } from "./env";

/**
 * In-memory cache for storage assets.
 *
 * Problem: The old proxy did a 307 redirect to a CloudFront signed URL.
 * CloudFront signed URLs have Cache-Control: no-store, so browsers re-fetch
 * the hero image, logo, and video poster on EVERY page load. This wastes
 * bandwidth and inflates LCP/FCP times significantly.
 *
 * Solution: Fetch the asset bytes server-side and serve them directly with
 * proper Cache-Control: public, max-age=86400, immutable headers. Cache the
 * bytes in memory for 23 hours (just under the 24h signed URL expiry) so
 * subsequent requests are served instantly from RAM.
 */
const ASSET_CACHE_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours
const ASSET_CACHE_MAX_ENTRIES = 50; // prevent unbounded memory growth (50 × ~100KB avg = ~5MB)

interface CachedAsset {
  buffer: Buffer;
  contentType: string;
  expiresAt: number;
}

const assetCache = new Map<string, CachedAsset>();

function pruneAssetCache() {
  const now = Date.now();
  Array.from(assetCache.keys()).forEach((k) => {
    const v = assetCache.get(k);
    if (v && v.expiresAt < now) assetCache.delete(k);
  });
  // If still too large, evict oldest entries (Map preserves insertion order)
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

    // ── Check in-memory cache first ──────────────────────────────────────────
    const cached = assetCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      res.set("Cache-Control", "public, max-age=86400, immutable");
      res.set("Content-Type", cached.contentType);
      res.set("X-Cache", "HIT");
      return res.send(cached.buffer);
    }

    try {
      // ── Get a fresh signed URL from Forge ───────────────────────────────────
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

      // ── Fetch the actual asset bytes ─────────────────────────────────────────
      const assetResp = await fetch(url);
      if (!assetResp.ok) {
        // Fall back to redirect if byte fetch fails (e.g. very large video files)
        res.set("Cache-Control", "public, max-age=3600");
        return res.redirect(307, url);
      }

      const buffer = Buffer.from(await assetResp.arrayBuffer());
      const contentType =
        assetResp.headers.get("content-type") || "application/octet-stream";

      // ── Cache in memory (only assets under 5MB to avoid OOM) ────────────────
      if (buffer.length < 5 * 1024 * 1024) {
        pruneAssetCache();
        assetCache.set(key, {
          buffer,
          contentType,
          expiresAt: Date.now() + ASSET_CACHE_TTL_MS,
        });
      }

      // ── Serve with long-lived cache headers ──────────────────────────────────
      // Browsers will cache the asset for 1 day. On repeat visits the hero image,
      // logo, and video poster load instantly from browser cache.
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
