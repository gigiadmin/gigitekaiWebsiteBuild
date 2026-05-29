/**
 * MS Learn Sync Router
 * Fetches Microsoft Learn training catalog and populates Aria's KB
 * with M365, Azure, Security, Teams, and Copilot learning modules.
 *
 * API: https://learn.microsoft.com/api/catalog/
 * No authentication required — public catalog.
 */

import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { kbArticles } from "../../drizzle/schema";
import { eq, and, isNotNull } from "drizzle-orm";

// MS Learn product filters relevant to GigitekAI's MSP practice
const MS_LEARN_PRODUCTS = [
  "m365",
  "office-teams",
  "office-365",
  "azure",
  "azure-active-directory",
  "entra",
  "intune",
  "microsoft-defender",
  "microsoft-sentinel",
  "power-automate",
  "power-platform",
  "sharepoint",
  "onedrive",
  "exchange",
  "copilot-m365",
  "copilot-for-microsoft-365",
  "copilot-studio",
  "windows",
];

// Categories that are NOT relevant to Tier 1/2 helpdesk — blocked from syncing
const BLOCKED_MS_LEARN_CATEGORIES = new Set([
  "azure-identity",
  "security",
  "power-platform",
  "ai-copilot",
]);

// Category mapping from MS Learn products/subjects to GigitekAI KB categories
function mapToCategory(products: string[], subjects: string[], roles: string[]): string {
  const all = [...products, ...subjects, ...roles].map(s => s.toLowerCase());

  if (all.some(s => s.includes("security") || s.includes("defender") || s.includes("sentinel") || s.includes("zero-trust"))) return "security";
  if (all.some(s => s.includes("copilot") || s.includes("ai") || s.includes("machine-learning"))) return "ai-copilot";
  if (all.some(s => s.includes("teams"))) return "microsoft-teams";
  if (all.some(s => s.includes("intune") || s.includes("endpoint") || s.includes("device"))) return "endpoint-management";
  if (all.some(s => s.includes("azure") || s.includes("entra") || s.includes("active-directory"))) return "azure-identity";
  if (all.some(s => s.includes("sharepoint") || s.includes("onedrive"))) return "sharepoint-onedrive";
  if (all.some(s => s.includes("exchange") || s.includes("outlook") || s.includes("email"))) return "email-exchange";
  if (all.some(s => s.includes("power-automate") || s.includes("power-platform") || s.includes("power-apps"))) return "power-platform";
  if (all.some(s => s.includes("m365") || s.includes("office"))) return "microsoft-365";
  if (all.some(s => s.includes("administrator") || s.includes("architect"))) return "it-administration";
  return "microsoft-365";
}

// Build KB article content from MS Learn module data
function buildArticleContent(module: MSLearnModule): string {
  const lines: string[] = [];

  lines.push(`# ${module.title}`);
  lines.push("");
  lines.push(module.summary);
  lines.push("");

  if (module.levels?.length) {
    lines.push(`**Level:** ${module.levels.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")}`);
  }
  if (module.roles?.length) {
    lines.push(`**Roles:** ${module.roles.map(r => r.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())).join(", ")}`);
  }
  if (module.duration_in_minutes) {
    lines.push(`**Duration:** ${module.duration_in_minutes} minutes`);
  }
  if (module.products?.length) {
    lines.push(`**Products:** ${module.products.map(p => p.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())).join(", ")}`);
  }

  lines.push("");
  lines.push(`**Learn More:** [Open in Microsoft Learn](${module.url})`);
  lines.push("");
  lines.push("---");
  lines.push("*This article was automatically synced from Microsoft Learn. Content is updated nightly.*");

  return lines.join("\n");
}

interface MSLearnModule {
  uid: string;
  title: string;
  summary: string;
  url: string;
  levels: string[];
  roles: string[];
  products: string[];
  subjects: string[];
  duration_in_minutes: number;
  popularity: number;
  last_modified: string;
}

export interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

/**
 * Fetch and sync MS Learn modules into the KB.
 * Filters to M365/Azure/Security/Copilot relevant modules only.
 */
export async function runMsLearnSync(options: { maxModules?: number } = {}): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = { total: 0, created: 0, updated: 0, skipped: 0, errors: 0, durationMs: 0 };

  try {
    // Fetch the full catalog — API ignores pageSize and returns all modules
    const response = await fetch(
      `https://learn.microsoft.com/api/catalog/?locale=en-us&type=modules&products=m365`,
      {
        headers: { "Accept": "application/json", "User-Agent": "GigitekAI-KBSync/1.0" },
        signal: AbortSignal.timeout(60000), // 60 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`MS Learn API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as { modules?: MSLearnModule[] };
    const allModules = data.modules ?? [];

    // Filter to GigitekAI-relevant products only
    const relevantModules = allModules.filter(m =>
      m.products?.some(p => MS_LEARN_PRODUCTS.includes(p))
    );

    // Apply optional limit (for testing)
    const modulesToProcess = options.maxModules
      ? relevantModules.slice(0, options.maxModules)
      : relevantModules;

    result.total = modulesToProcess.length;

    const db = await getDb();
    if (!db) {
      throw new Error("Database connection unavailable");
    }

    for (const module of modulesToProcess) {
      try {
        const category = mapToCategory(module.products ?? [], module.subjects ?? [], module.roles ?? []);

        // Skip categories that are not relevant to Tier 1/2 helpdesk support
        if (BLOCKED_MS_LEARN_CATEGORIES.has(category)) {
          result.total = Math.max(0, result.total - 1);
          continue;
        }
        const tags = [
          ...(module.products ?? []).slice(0, 5),
          ...(module.roles ?? []).slice(0, 3),
          ...(module.levels ?? []),
        ].join(",");

        const content = buildArticleContent(module);
        const now = new Date();

        // Check if article already exists (by externalUid)
        const existing = await db
          .select({ id: kbArticles.id, lastSyncedAt: kbArticles.lastSyncedAt })
          .from(kbArticles)
          .where(
            and(
              eq(kbArticles.externalUid, module.uid),
              eq(kbArticles.syncSource, "ms-learn")
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing article
          await db
            .update(kbArticles)
            .set({
              title: module.title,
              content,
              category,
              tags,
              sourceUrl: module.url,
              lastSyncedAt: now.toISOString(),
              updatedAt: now.toISOString(),
            })
            .where(eq(kbArticles.id, existing[0].id));
          result.updated++;
        } else {
          // Create new article
          await db.insert(kbArticles).values({
            title: module.title,
            content,
            category,
            tags,
            isPublished: 1,
            sourceUrl: module.url,
            externalUid: module.uid,
            syncSource: "ms-learn",
            lastSyncedAt: now.toISOString(),
          });
          result.created++;
        }
      } catch (err) {
        console.error(`[MS Learn Sync] Error processing module ${module.uid}:`, err);
        result.errors++;
      }
    }
  } catch (err) {
    console.error("[MS Learn Sync] Fatal error:", err);
    throw err;
  }

  result.durationMs = Date.now() - startTime;
  console.log(`[MS Learn Sync] Complete: ${JSON.stringify(result)}`);
  return result;
}

export const msLearnSyncRouter = router({
  /**
   * Admin-only: Trigger a manual MS Learn sync immediately
   */
  triggerSync: adminProcedure
    .input(z.object({
      maxModules: z.number().min(1).max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await runMsLearnSync({ maxModules: input.maxModules });
      return result;
    }),

  /**
   * Admin-only: Get sync status — how many MS Learn articles are in the KB
   */
  getSyncStatus: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { totalArticles: 0, byCategory: {}, lastSyncedAt: null };

      const articles = await db
        .select({
          id: kbArticles.id,
          title: kbArticles.title,
          category: kbArticles.category,
          lastSyncedAt: kbArticles.lastSyncedAt,
        })
        .from(kbArticles)
        .where(
          and(
            eq(kbArticles.syncSource, "ms-learn"),
            isNotNull(kbArticles.externalUid)
          )
        );

      const byCategory: Record<string, number> = {};
      for (const a of articles) {
        byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
      }

      const lastSync = articles
        .filter(a => a.lastSyncedAt)
        .sort((a: { lastSyncedAt: string | null }, b: { lastSyncedAt: string | null }) =>
          (new Date(b.lastSyncedAt ?? 0).getTime()) - (new Date(a.lastSyncedAt ?? 0).getTime())
        )[0]?.lastSyncedAt ?? null;

      return {
        totalArticles: articles.length,
        byCategory,
        lastSyncedAt: lastSync,
      };
    }),

  /**
   * Public: Get MS Learn articles for a given category (used by Aria)
   */
  getByCategory: publicProcedure
    .input(z.object({ category: z.string(), limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select({
          id: kbArticles.id,
          title: kbArticles.title,
          category: kbArticles.category,
          tags: kbArticles.tags,
          sourceUrl: kbArticles.sourceUrl,
        })
        .from(kbArticles)
        .where(
          and(
            eq(kbArticles.syncSource, "ms-learn"),
            eq(kbArticles.category, input.category),
            eq(kbArticles.isPublished, 1)
          )
        )
        .limit(input.limit);
    }),
});
