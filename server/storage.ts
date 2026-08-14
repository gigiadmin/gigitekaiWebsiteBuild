// Independent storage adapter for GigitekAI.
// Replaces the previous Manus platform storage proxy.
// Uses Azure Blob Storage by default; falls back to a legacy Manus proxy
// during the cutover window only if BUILT_IN_FORGE_API_URL is set.

import { getStorageProvider } from "./adapters/storage/createStorageProvider";
import { normalizeStorageKey } from "./adapters/storage/StorageProvider";

// Legacy Manus proxy fallback (enabled only when BUILT_IN_FORGE_API_URL is set)
const legacyForgeApiUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, "");
const legacyForgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
const legacyEnabled = Boolean(legacyForgeApiUrl && legacyForgeApiKey);

function buildLegacyAuthHeaders(): HeadersInit {
  return { Authorization: `Bearer ${legacyForgeApiKey}` };
}

function buildLegacyUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("path", normalizeStorageKey(relKey));
  return url;
}

async function buildLegacyDownloadUrl(baseUrl: string, relKey: string): Promise<string> {
  const url = new URL("v1/storage/downloadUrl", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("path", normalizeStorageKey(relKey));
  const response = await fetch(url, {
    method: "GET",
    headers: buildLegacyAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Legacy storage downloadUrl failed: ${response.status}`);
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeStorageKey(relKey);

  try {
    const provider = getStorageProvider();
    await provider.putObject({ key, body: data, contentType });
    const url = await provider.getSignedReadUrl(key, 3600);
    return { key, url };
  } catch (err) {
    if (legacyEnabled) {
      console.warn("[storage] Azure Blob put failed; falling back to legacy proxy", err);
      return legacyStoragePut(key, data, contentType);
    }
    throw err;
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeStorageKey(relKey);

  try {
    const provider = getStorageProvider();
    const url = await provider.getSignedReadUrl(key, 3600);
    return { key, url };
  } catch (err) {
    if (legacyEnabled) {
      console.warn("[storage] Azure Blob get failed; falling back to legacy proxy", err);
      const url = await buildLegacyDownloadUrl(legacyForgeApiUrl!, key);
      return { key, url };
    }
    throw err;
  }
}

async function legacyStoragePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const uploadUrl = buildLegacyUploadUrl(legacyForgeApiUrl!, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildLegacyAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Legacy storage upload failed (${response.status}): ${message}`);
  }
  const result = (await response.json()) as { url: string };
  return { key, url: result.url };
}
