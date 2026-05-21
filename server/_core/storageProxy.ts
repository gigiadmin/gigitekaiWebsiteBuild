import type { Express } from "express";
import { ENV } from "./env";

// In-memory cache for small non-video assets
const assetCache = new Map<string, { data: Buffer; contentType: string; expiresAt: number }>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 100;
const MAX_ASSET_SIZE = 2 * 1024 * 1024; // 2MB max per cached asset

// Presigned URL cache — avoids hitting Forge API on every request
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const URL_CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes

function evictExpiredEntries() {
  const now = Date.now();
  for (const [k, entry] of Array.from(assetCache.entries())) {
    if (entry.expiresAt <= now) assetCache.delete(k);
  }
}

async function getPresignedUrl(key: string): Promise<string> {
  const cached = urlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const forgeUrl = new URL(
    "v1/storage/presign/get",
    ENV.forgeApiUrl!.replace(/\/+$/, "") + "/",
  );
  forgeUrl.searchParams.set("path", key);
  const resp = await fetch(forgeUrl, {
    headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
  });
  if (!resp.ok) throw new Error(`Forge API error: ${resp.status}`);
  const { url } = (await resp.json()) as { url: string };
  if (!url) throw new Error("Empty presigned URL from Forge");
  urlCache.set(key, { url, expiresAt: Date.now() + URL_CACHE_TTL_MS });
  return url;
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as any)[0] as string;
    if (!key) { res.status(400).send("Missing storage key"); return; }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) { res.status(500).send("Storage proxy not configured"); return; }

    const rangeHeader = req.headers.range;
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(key);

    // ── Non-video assets: serve from cache or fetch full bytes ──
    if (!isVideo) {
      const cached = assetCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        res.set("Cache-Control", "public, max-age=604800, immutable");
        res.set("Content-Type", cached.contentType);
        res.set("Accept-Ranges", "bytes");
        res.set("Content-Length", String(cached.data.length));
        res.set("X-Cache", "HIT");
        res.send(cached.data);
        return;
      }
      try {
        const url = await getPresignedUrl(key);
        const assetResp = await fetch(url);
        if (!assetResp.ok) { res.status(502).send("Storage fetch error"); return; }
        const contentType = assetResp.headers.get("content-type") || "application/octet-stream";
        const data = Buffer.from(await assetResp.arrayBuffer());
        if (data.length <= MAX_ASSET_SIZE) {
          evictExpiredEntries();
          if (assetCache.size >= MAX_CACHE_SIZE) {
            const firstKey = assetCache.keys().next().value;
            if (firstKey) assetCache.delete(firstKey);
          }
          assetCache.set(key, { data, contentType, expiresAt: Date.now() + CACHE_TTL_MS });
        }
        res.set("Cache-Control", "public, max-age=604800, immutable");
        res.set("Content-Type", contentType);
        res.set("Accept-Ranges", "bytes");
        res.set("Content-Length", String(data.length));
        res.send(data);
      } catch (err) {
        console.error("[StorageProxy] non-video error:", err);
        res.status(502).send("Storage proxy error");
      }
      return;
    }

    // ── Video files: stream with proper range support ──
    // NEVER load full video into memory — always proxy range requests to S3
    try {
      const presignedUrl = await getPresignedUrl(key);

      // Build headers to forward to S3
      const forwardHeaders: Record<string, string> = {};
      if (rangeHeader) forwardHeaders["Range"] = rangeHeader;

      const s3Resp = await fetch(presignedUrl, { headers: forwardHeaders });

      if (!s3Resp.ok && s3Resp.status !== 206) {
        console.error(`[StorageProxy] S3 video error: ${s3Resp.status}`);
        res.status(502).send("Video fetch error");
        return;
      }

      const contentType = s3Resp.headers.get("content-type") || "video/mp4";
      const contentLength = s3Resp.headers.get("content-length");
      const contentRange = s3Resp.headers.get("content-range");
      const acceptRanges = s3Resp.headers.get("accept-ranges") || "bytes";

      // If client sent a Range header and S3 returned 200 (not 206), we need to slice manually
      if (rangeHeader && s3Resp.status === 200) {
        // S3 returned full content — parse range and slice
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        const chunkSize = end - start + 1;

        const fullData = Buffer.from(await s3Resp.arrayBuffer());
        res.status(206);
        res.set("Content-Type", contentType);
        res.set("Accept-Ranges", "bytes");
        res.set("Content-Range", `bytes ${start}-${end}/${fullData.length}`);
        res.set("Content-Length", String(chunkSize));
        res.set("Cache-Control", "public, max-age=604800, immutable");
        res.send(fullData.subarray(start, end + 1));
        return;
      }

      // S3 returned 206 or no range was requested — stream directly
      const statusCode = s3Resp.status === 206 ? 206 : 200;
      res.status(statusCode);
      res.set("Content-Type", contentType);
      res.set("Accept-Ranges", acceptRanges);
      res.set("Cache-Control", "public, max-age=604800, immutable");
      if (contentLength) res.set("Content-Length", contentLength);
      if (contentRange) res.set("Content-Range", contentRange);

      // Stream the response body to the client
      if (s3Resp.body) {
        const { Readable } = await import("stream");
        const nodeStream = Readable.fromWeb(s3Resp.body as any);
        nodeStream.pipe(res);
        nodeStream.on("error", (err) => {
          console.error("[StorageProxy] stream error:", err);
          if (!res.headersSent) res.status(502).send("Stream error");
        });
      } else {
        const data = Buffer.from(await s3Resp.arrayBuffer());
        res.send(data);
      }
    } catch (err) {
      console.error("[StorageProxy] video error:", err);
      if (!res.headersSent) res.status(502).send("Storage proxy error");
    }
  });
}
