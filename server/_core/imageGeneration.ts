/**
 * Image generation helper (legacy Manus Forge replacement stub).
 *
 * The original implementation routed image generation requests through the
 * Manus platform's ImageService. As part of the off-Manus migration, image
 * generation should be replaced with a direct provider integration such as:
 *   - OpenAI DALL·E 3
 *   - Azure OpenAI DALL·E 3
 *   - Stability AI / Ideogram / Midjourney API
 *
 * For now, calling this function throws a clear error explaining that the
 * Manus image service is no longer available and a provider must be wired
 * directly.
 */

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  _options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  throw new Error(
    "Manus Forge ImageService is no longer available. " +
      "Replace with a direct image generation provider (e.g., OpenAI DALL·E 3, Azure OpenAI, or Stability AI)."
  );
}
