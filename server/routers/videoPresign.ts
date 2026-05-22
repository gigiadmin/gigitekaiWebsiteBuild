/**
 * Video Presign Router
 * Returns presigned CloudFront URLs for hero videos to bypass CSP redirect issues.
 * The browser will load the video directly from CloudFront instead of going through
 * the /manus-storage/ proxy which returns a 307 redirect that gets blocked by CSP.
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { ENV } from "../_core/env";

// Cache presigned URLs for 50 minutes (they expire after 60 min)
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const URL_CACHE_TTL_MS = 50 * 60 * 1000;

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

export const videoPresignRouter = router({
  getHeroVideoUrl: publicProcedure
    .input(z.object({ variant: z.enum(["desktop", "mobile"]) }))
    .query(async ({ input }) => {
      const videoKeys: Record<string, string> = {
        desktop: "gigitekai-hero-desktop-fast_2e21158c.mp4",
        mobile: "gigitekai-hero-mobile-fast_90faa7ac.mp4",
      };
      const key = videoKeys[input.variant];
      const url = await getPresignedUrl(key);
      return { url };
    }),
});
