/**
 * LLM Response Caching Layer
 * Caches Claude responses for repeated intents to reduce API costs
 * Uses in-memory cache with TTL (time-to-live) and database persistence
 */

import { getDb } from "../db";
import { ariaLlmCache } from "../../drizzle/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import crypto from "crypto";

interface CacheEntry {
  key: string;
  response: string;
  intent: string;
  focus: string;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
}

// In-memory cache with TTL
const memoryCache = new Map<string, CacheEntry>();

// Cache TTL: 24 hours for general queries, 1 hour for time-sensitive data
const CACHE_TTL_GENERAL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_TTL_TIMESENSITIVE = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_REALTIME = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from question, intent, and focus
 */
function generateCacheKey(question: string, intent: string, focus: string): string {
  const normalized = `${question.toLowerCase().trim()}|${intent}|${focus}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Determine TTL based on intent (real-time data vs static info)
 */
function getTTL(intent: string, focus: string): number {
  // Real-time/frequently changing data
  if (
    intent === "system_status" ||
    intent === "uptime" ||
    intent === "ticket_query" ||
    intent === "contact_center" ||
    intent === "sla" ||
    focus === "tickets" ||
    focus === "contact_center" ||
    focus === "sla"
  ) {
    return CACHE_TTL_REALTIME; // 5 minutes
  }

  // Time-sensitive but less frequent
  if (
    intent === "agent_query" ||
    intent === "leads" ||
    focus === "agents" ||
    focus === "leads"
  ) {
    return CACHE_TTL_TIMESENSITIVE; // 1 hour
  }

  // Static/reference data (KB, general questions)
  return CACHE_TTL_GENERAL; // 24 hours
}

/**
 * Get cached response from memory or database
 */
export async function getCachedResponse(
  question: string,
  intent: string,
  focus: string
): Promise<string | null> {
  const cacheKey = generateCacheKey(question, intent, focus);

  // Check memory cache first (fastest)
  const memEntry = memoryCache.get(cacheKey);
  if (memEntry && memEntry.expiresAt > new Date()) {
    memEntry.hitCount++;
    console.log(`[LLM Cache] Memory hit (${memEntry.hitCount} hits): ${intent}/${focus}`);
    return memEntry.response;
  }

  // Check database cache
  try {
    const db = await getDb();
    if (!db) return null;

    const dbEntry = await db
      .select()
      .from(ariaLlmCache)
      .where(
        and(
          eq(ariaLlmCache.cacheKey, cacheKey),
          gt(ariaLlmCache.expiresAt, new Date())
        )
      )
      .limit(1);

    if (dbEntry.length > 0) {
      const entry = dbEntry[0];
      console.log(`[LLM Cache] Database hit: ${intent}/${focus}`);

      // Restore to memory cache
      const cacheEntry: CacheEntry = {
        key: cacheKey,
        response: entry.response,
        intent: entry.intent,
        focus: entry.focus,
        createdAt: new Date(entry.createdAt),
        expiresAt: new Date(entry.expiresAt),
        hitCount: entry.hitCount + 1,
      };
      memoryCache.set(cacheKey, cacheEntry);

      // Update hit count in DB
      await db
        .update(ariaLlmCache)
        .set({ hitCount: entry.hitCount + 1 })
        .where(eq(ariaLlmCache.cacheKey, cacheKey));

      return entry.response;
    }
  } catch (e) {
    console.warn("[LLM Cache] Database lookup failed:", e);
  }

  return null;
}

/**
 * Store response in cache (memory + database)
 */
export async function setCachedResponse(
  question: string,
  response: string,
  intent: string,
  focus: string
): Promise<void> {
  const cacheKey = generateCacheKey(question, intent, focus);
  const ttl = getTTL(intent, focus);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl);

  // Store in memory cache
  const cacheEntry: CacheEntry = {
    key: cacheKey,
    response,
    intent,
    focus,
    createdAt: now,
    expiresAt,
    hitCount: 1,
  };
  memoryCache.set(cacheKey, cacheEntry);

  // Store in database
  try {
    const db = await getDb();
    if (!db) return;

    // Check if entry already exists
    const existing = await db
      .select()
      .from(ariaLlmCache)
      .where(eq(ariaLlmCache.cacheKey, cacheKey))
      .limit(1);

    if (existing.length > 0) {
      // Update existing entry
      await db
        .update(ariaLlmCache)
        .set({
          response,
          expiresAt: new Date(expiresAt),
          hitCount: 1,
        })
        .where(eq(ariaLlmCache.cacheKey, cacheKey));
    } else {
      // Insert new entry
      await db.insert(ariaLlmCache).values({
        cacheKey,
        question: question.substring(0, 500),
        response,
        intent,
        focus,
        createdAt: now,
        expiresAt: expiresAt,
        hitCount: 1,
      });
    }

    console.log(`[LLM Cache] Cached response: ${intent}/${focus} (TTL: ${ttl / 1000 / 60}m)`);
  } catch (e) {
    console.warn("[LLM Cache] Failed to store in database:", e);
  }
}

/**
 * Clear expired cache entries from database (run periodically)
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    await db
      .delete(ariaLlmCache)
      .where(gt(ariaLlmCache.expiresAt, new Date()));

    console.log(`[LLM Cache] Cleared expired entries`);
    return 0;
  } catch (e) {
    console.warn("[LLM Cache] Failed to clear expired entries:", e);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  memorySize: number;
  databaseSize: number;
  totalHits: number;
}> {
  let databaseSize = 0;
  let totalHits = 0;

  try {
    const db = await getDb();
    if (db) {
      const stats = await db
        .select({
          count: sql`COUNT(*) as count`,
          totalHits: sql`SUM(hitCount) as totalHits`,
        })
        .from(ariaLlmCache)
        .where(gt(ariaLlmCache.expiresAt, new Date()));

      if (stats.length > 0) {
        databaseSize = stats[0].count as number;
        totalHits = (stats[0].totalHits as number) || 0;
      }
    }
  } catch (e) {
    console.warn("[LLM Cache] Failed to get stats:", e);
  }

  return {
    memorySize: memoryCache.size,
    databaseSize,
    totalHits,
  };
}

/**
 * Clear all cache (for debugging)
 */
export async function clearAllCache(): Promise<void> {
  memoryCache.clear();
  try {
    const db = await getDb();
    if (db) {
      await db.delete(ariaLlmCache);
      console.log("[LLM Cache] All cache cleared");
    }
  } catch (e) {
    console.warn("[LLM Cache] Failed to clear database cache:", e);
  }
}
