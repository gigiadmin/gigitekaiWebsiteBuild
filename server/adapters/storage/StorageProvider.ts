import type { Readable } from "stream";

export interface PutObjectInput {
  key: string;
  body: Buffer | Readable | Uint8Array | string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface PutObjectResult {
  key: string;
  url?: string;
}

export interface HeadObjectResult {
  size: number;
  contentType?: string;
  etag?: string;
  metadata?: Record<string, string>;
}

export interface StorageProvider {
  putObject(input: PutObjectInput): Promise<PutObjectResult>;
  getSignedReadUrl(key: string, expiresInSeconds: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  headObject(key: string): Promise<HeadObjectResult | null>;
  getPublicReadUrl?(key: string): Promise<string>;
  listObjects(opts?: { prefix?: string; maxKeys?: number }): Promise<{ key: string; size: number; lastModified?: Date }[]>;
}

export function normalizeStorageKey(key: string): string {
  return key.replace(/^\/+/, "");
}
