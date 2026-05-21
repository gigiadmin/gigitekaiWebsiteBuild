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

// For large files (videos), we store a presigned URL cache instead of the full bytes
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const URL_CACHE_TTL_MS = 55 * 60 * 1000; // 55 minutes (presigned URLs typically last 1 hour)

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

    const rangeHeader = req.headers.range;
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(key);

    // Check in-memory cache first (for small non-video assets)
    if (!rangeHeader || !isVideo) {
      const cached = assetCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        // Even for cached assets, support range requests
        if (rangeHeader) {
          const total = cached.data.length;
          const parts = rangeHeader.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
          const chunkSize = end - start + 1;

          res.status(206);
          res.set("Content-Range", `bytes ${start}-${end}/${total}`);
          res.set("Accept-Ranges", "bytes");
          res.set("Content-Length", String(chunkSize));
          res.set("Content-Type", cached.contentType);
          res.set("Cache-Control", "public, max-age=604800, immutable");
          res.set("X-Cache", "HIT");
          res.send(cached.data.subarray(start, end + 1));
          return;
        }

        res.set("Cache-Control", "public, max-age=604800, immutable");
        res.set("Content-Type", cached.contentType);
        res.set("Accept-Ranges", "bytes");
        res.set("Content-Length", String(cached.data.length));
        res.set("X-Cache", "HIT");
        res.send(cached.data);
        return;
      }
    }

    try {
      // For videos with range requests, redirect to S3 presigned URL
      // iOS Safari and mobile browsers need proper range support which S3 provides natively
      if (isVideo && rangeHeader) {
        let presignedUrl: string;

        // Check URL cache
        const cachedUrl = urlCache.get(key);
        if (cachedUrl && cachedUrl.expiresAt > Date.now()) {
          presignedUrl = cachedUrl.url;
        } else {
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
          presignedUrl = url;
          urlCache.set(key, { url: presignedUrl, expiresAt: Date.now() + URL_CACHE_TTL_MS });
        }

        // Proxy the range request to S3 (which supports range natively)
        const s3Resp = await fetch(presignedUrl, {
          headers: { Range: rangeHeader },
        });

        if (s3Resp.status === 206 || s3Resp.status === 200) {
          const status = s3Resp.status;
          res.status(status);
          // Forward relevant headers from S3
          const contentRange = s3Resp.headers.get("content-range");
          const contentLength = s3Resp.headers.get("content-length");
          const contentType = s3Resp.headers.get("content-type") || "video/mp4";

          if (contentRange) res.set("Content-Range", contentRange);
          if (contentLength) res.set("Content-Length", contentLength);
          res.set("Content-Type", contentType);
          res.set("Accept-Ranges", "bytes");
          res.set("Cache-Control", "public, max-age=604800, immutable");

          const arrayBuffer = await s3Resp.arrayBuffer();
          res.send(Buffer.from(arrayBuffer));
        } else {
          console.error(`[StorageProxy] S3 range fetch error: ${s3Resp.status}`);
          res.status(502).send("Storage range request failed");
        }
        return;
      }

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

      // Cache in memory if asset is small enough (not videos)
      if (data.length <= MAX_ASSET_SIZE && !isVideo) {
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
      // Always include Accept-Ranges to signal range request support
      res.set("Cache-Control", "public, max-age=604800, immutable");
      res.set("Content-Type", contentType);
      res.set("Accept-Ranges", "bytes");
      res.set("Content-Length", String(data.length));
      res.set("X-Cache", "MISS");

      // Handle initial range request for non-cached video (first load)
      if (rangeHeader && isVideo) {
        const total = data.length;
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.set("Content-Range", `bytes ${start}-${end}/${total}`);
        res.set("Content-Length", String(chunkSize));
        res.send(data.subarray(start, end + 1));
      } else {
        res.send(data);
      }
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
