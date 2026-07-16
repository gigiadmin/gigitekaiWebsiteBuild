/**
 * TTS Audio Caching Layer
 * Caches Azure Speech audio to reduce API calls and costs
 * Uses in-memory cache with database persistence
 */

import { getDb } from "../db";
import { ariaTtsCache } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

interface CacheEntry {
  key: string;
  text: string;
  audioBuffer: Buffer;
  rate: string;
  pitch: string;
  createdAt: Date;
  hitCount: number;
}

// In-memory cache for fast lookups
const memoryCache = new Map<string, CacheEntry>();

// Max cache size: 500MB in memory, 2GB in database
const MAX_MEMORY_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DB_CACHE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

let currentMemoryCacheSize = 0;

/**
 * Generate cache key from text and prosody settings
 */
function generateCacheKey(text: string, rate: string, pitch: string): string {
  const normalized = `${text.trim()}|${rate}|${pitch}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Get cached audio from memory or database
 */
export async function getCachedAudio(
  text: string,
  rate: string = "0%",
  pitch: string = "0%"
): Promise<Buffer | null> {
  const cacheKey = generateCacheKey(text, rate, pitch);

  // Check memory cache first (fastest)
  const memEntry = memoryCache.get(cacheKey);
  if (memEntry) {
    memEntry.hitCount++;
    console.log(`[TTS Cache] Memory hit: ${text.substring(0, 50)}... (${memEntry.hitCount} hits)`);
    return memEntry.audioBuffer;
  }

  // Check database cache
  try {
    const db = await getDb();
    if (!db) return null;

    const dbEntry = await db
      .select()
      .from(ariaTtsCache)
      .where(eq(ariaTtsCache.cacheKey, cacheKey))
      .limit(1);

    if (dbEntry.length > 0) {
      const entry = dbEntry[0];
      console.log(`[TTS Cache] Database hit: ${text.substring(0, 50)}...`);

      // Restore to memory cache if space available
      const audioBuffer = Buffer.from(entry.audioData, "base64");
      if (currentMemoryCacheSize + audioBuffer.length < MAX_MEMORY_CACHE_SIZE) {
        const cacheEntry: CacheEntry = {
          key: cacheKey,
          text,
          audioBuffer,
          rate,
          pitch,
          createdAt: new Date(entry.createdAt),
          hitCount: entry.hitCount + 1,
        };
        memoryCache.set(cacheKey, cacheEntry);
        currentMemoryCacheSize += audioBuffer.length;
      }

      // Update hit count in DB
      await db
        .update(ariaTtsCache)
        .set({ hitCount: entry.hitCount + 1 })
        .where(eq(ariaTtsCache.cacheKey, cacheKey));

      return audioBuffer;
    }
  } catch (e) {
    console.warn("[TTS Cache] Database lookup failed:", e);
  }

  return null;
}

/**
 * Store audio in cache (memory + database)
 */
export async function setCachedAudio(
  text: string,
  audioBuffer: Buffer,
  rate: string = "0%",
  pitch: string = "0%"
): Promise<void> {
  const cacheKey = generateCacheKey(text, rate, pitch);
  const now = new Date();

  // Store in memory cache if space available
  if (currentMemoryCacheSize + audioBuffer.length < MAX_MEMORY_CACHE_SIZE) {
    const cacheEntry: CacheEntry = {
      key: cacheKey,
      text,
      audioBuffer,
      rate,
      pitch,
      createdAt: now,
      hitCount: 1,
    };
    memoryCache.set(cacheKey, cacheEntry);
    currentMemoryCacheSize += audioBuffer.length;
  }

  // Store in database
  try {
    const db = await getDb();
    if (!db) return;

    // Check if entry already exists
    const existing = await db
      .select()
      .from(ariaTtsCache)
      .where(eq(ariaTtsCache.cacheKey, cacheKey))
      .limit(1);

    const audioData = audioBuffer.toString("base64");

    if (existing.length > 0) {
      // Update existing entry
      await db
        .update(ariaTtsCache)
        .set({
          audioData,
          hitCount: 1,
        })
        .where(eq(ariaTtsCache.cacheKey, cacheKey));
    } else {
      // Insert new entry
      await db.insert(ariaTtsCache).values({
        cacheKey,
        text: text.substring(0, 500),
        audioData,
        rate,
        pitch,
        createdAt: now,
        hitCount: 1,
      });
    }

    console.log(`[TTS Cache] Cached audio: ${text.substring(0, 50)}... (${(audioBuffer.length / 1024).toFixed(1)}KB)`);
  } catch (e) {
    console.warn("[TTS Cache] Failed to store in database:", e);
  }
}

/**
 * Clear memory cache if it exceeds max size
 */
export async function pruneMemoryCache(): Promise<void> {
  if (currentMemoryCacheSize < MAX_MEMORY_CACHE_SIZE * 0.9) return; // 90% threshold

  console.log(`[TTS Cache] Memory cache exceeded 90% threshold (${(currentMemoryCacheSize / 1024 / 1024).toFixed(1)}MB). Pruning...`);

  // Sort by hit count (keep frequently used)
  const entries = Array.from(memoryCache.entries())
    .sort((a, b) => b[1].hitCount - a[1].hitCount);

  // Keep top 70% of entries by hit count
  const keepCount = Math.ceil(entries.length * 0.7);
  const toRemove = entries.slice(keepCount);

  for (const [key, entry] of toRemove) {
    memoryCache.delete(key);
    currentMemoryCacheSize -= entry.audioBuffer.length;
  }

  console.log(`[TTS Cache] Pruned ${toRemove.length} entries. New size: ${(currentMemoryCacheSize / 1024 / 1024).toFixed(1)}MB`);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  memorySizeMB: number;
  memoryEntries: number;
  databaseSizeMB: number;
  databaseEntries: number;
}> {
  let databaseSizeMB = 0;
  let databaseEntries = 0;

  try {
    const db = await getDb();
    if (db) {
      const stats = await db
        .select()
        .from(ariaTtsCache);

      databaseEntries = stats.length;
      databaseSizeMB = stats.reduce((sum, entry) => {
        return sum + (Buffer.from(entry.audioData, "base64").length / 1024 / 1024);
      }, 0);
    }
  } catch (e) {
    console.warn("[TTS Cache] Failed to get stats:", e);
  }

  return {
    memorySizeMB: currentMemoryCacheSize / 1024 / 1024,
    memoryEntries: memoryCache.size,
    databaseSizeMB,
    databaseEntries,
  };
}

/**
 * Clear all cache (for debugging)
 */
export async function clearAllCache(): Promise<void> {
  memoryCache.clear();
  currentMemoryCacheSize = 0;
  try {
    const db = await getDb();
    if (db) {
      await db.delete(ariaTtsCache);
      console.log("[TTS Cache] All cache cleared");
    }
  } catch (e) {
    console.warn("[TTS Cache] Failed to clear database cache:", e);
  }
}
