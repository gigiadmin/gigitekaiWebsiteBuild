// Video streaming proxy — serves video files through /api/video/ path
// This bypasses Cloudflare's edge interception of /manus-storage/ routes
import type { Express } from "express";
import { storageGet } from "../storage";

// Presigned URL cache — avoids hitting the storage provider on every request
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const URL_CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes

async function getPresignedUrl(key: string): Promise<string> {
  const cached = urlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { url } = await storageGet(key);
  if (!url) throw new Error("Empty presigned URL from storage provider");
  urlCache.set(key, { url, expiresAt: Date.now() + URL_CACHE_TTL_MS });
  return url;
}

// Allowed video keys (whitelist to prevent arbitrary file access)
const ALLOWED_VIDEO_KEYS = [
  "gigitekai-hero-desktop-fast_2e21158c.mp4",
  "gigitekai-hero-mobile-fast_90faa7ac.mp4",
];

export function registerVideoProxy(app: Express) {
  app.get("/api/video/:filename", async (req, res) => {
    const { filename } = req.params;

    // Security: only allow whitelisted video files
    if (!ALLOWED_VIDEO_KEYS.includes(filename)) {
      res.status(404).send("Video not found");
      return;
    }

    const rangeHeader = req.headers.range;

    try {
      const presignedUrl = await getPresignedUrl(filename);

      // Build headers to forward to storage
      const forwardHeaders: Record<string, string> = {
        "User-Agent": "GigitekAI-VideoProxy/1.0",
      };
      if (rangeHeader) forwardHeaders["Range"] = rangeHeader;

      const s3Resp = await fetch(presignedUrl, { headers: forwardHeaders });

      if (!s3Resp.ok && s3Resp.status !== 206) {
        console.error(`[VideoProxy] storage error: ${s3Resp.status} for ${filename}`);
        res.status(502).send("Video fetch error");
        return;
      }

      const contentType = s3Resp.headers.get("content-type") || "video/mp4";
      const contentLength = s3Resp.headers.get("content-length");
      const contentRange = s3Resp.headers.get("content-range");
      const acceptRanges = s3Resp.headers.get("accept-ranges") || "bytes";

      // If client sent a Range header and storage returned 200 (not 206), slice manually
      if (rangeHeader && s3Resp.status === 200) {
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

      // Storage returned 206 or no range was requested — stream directly
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
          console.error("[VideoProxy] stream error:", err);
          if (!res.headersSent) res.status(502).send("Stream error");
        });
      } else {
        const data = Buffer.from(await s3Resp.arrayBuffer());
        res.send(data);
      }
    } catch (err) {
      console.error("[VideoProxy] error:", err);
      if (!res.headersSent) res.status(502).send("Video proxy error");
    }
  });
}
