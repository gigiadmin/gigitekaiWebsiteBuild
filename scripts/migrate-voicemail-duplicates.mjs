#!/usr/bin/env node

/**
 * Voicemail Duplicate Migration Script
 * 
 * Purpose: Identify existing duplicate voicemails in the database and create
 * tombstones for them to prevent re-import during future poller runs.
 * 
 * Usage: node scripts/migrate-voicemail-duplicates.mjs [--dry-run] [--limit 100]
 * 
 * Options:
 *   --dry-run    Show what would be done without making changes
 *   --limit N    Process only N duplicate groups (default: unlimited)
 *   --verbose    Show detailed output
 */

import { drizzle } from "drizzle-orm/mysql2";
import {
  callLogs,
  callDraftTickets,
  voicemailSourceTombstones,
} from "../drizzle/schema.js";
import { eq, and, sql } from "drizzle-orm";
import mysql from "mysql2/promise";

// ─── Configuration ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isVerbose = args.includes("--verbose");
const limitMatch = args.find((arg) => arg.startsWith("--limit"));
const limit = limitMatch ? parseInt(limitMatch.split("=")[1] || "100") : null;

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("ERROR: DATABASE_URL environment variable not set");
  process.exit(1);
}

// ─── Logging Helpers ────────────────────────────────────────────────────────

const log = (msg) => console.log(`[Migration] ${msg}`);
const verbose = (msg) => isVerbose && console.log(`[Verbose] ${msg}`);
const error = (msg) => console.error(`[ERROR] ${msg}`);
const warn = (msg) => console.warn(`[WARN] ${msg}`);

// ─── Database Connection ────────────────────────────────────────────────────

async function getDb() {
  try {
    const connection = await mysql.createConnection(DB_URL);
    return drizzle(connection);
  } catch (err) {
    error(`Failed to connect to database: ${err.message}`);
    process.exit(1);
  }
}

// ─── Find Duplicate Voicemails ──────────────────────────────────────────────

async function findDuplicateGroups(db) {
  log("Searching for duplicate voicemails...");

  try {
    // Find groups of voicemails with same caller number + similar title/description
    const duplicates = await db
      .select({
        callerNumber: callLogs.callerNumber,
        aiTitle: callLogs.aiTitle,
        count: sql`COUNT(*) as count`,
        ids: sql`GROUP_CONCAT(${callLogs.id})`,
      })
      .from(callLogs)
      .where(
        and(
          sql`${callLogs.callerNumber} IS NOT NULL`,
          sql`${callLogs.aiTitle} IS NOT NULL`
        )
      )
      .groupBy(callLogs.callerNumber, callLogs.aiTitle)
      .having(sql`COUNT(*) > 1`);

    verbose(`Found ${duplicates.length} duplicate groups`);
    return duplicates;
  } catch (err) {
    error(`Failed to find duplicates: ${err.message}`);
    return [];
  }
}

// ─── Create Tombstones for Duplicates ────────────────────────────────────

async function createTombstonesForDuplicates(db, duplicates) {
  log(`Processing ${duplicates.length} duplicate groups...`);

  let processed = 0;
  let tombstonesCreated = 0;
  let skipped = 0;

  for (const group of duplicates) {
    if (limit && processed >= limit) {
      log(`Reached limit of ${limit} groups. Stopping.`);
      break;
    }

    const ids = group.ids.split(",").map((id) => parseInt(id));
    const keepId = ids[0]; // Keep first, mark others as duplicates
    const deleteIds = ids.slice(1);

    verbose(
      `Group: ${group.callerNumber} | "${group.aiTitle}" | IDs: ${ids.join(", ")}`
    );
    verbose(`  → Keep: ${keepId}, Mark as duplicate: ${deleteIds.join(", ")}`);

    try {
      // Check if any of these have already been tombstoned
      const existingTombstones = await db
        .select({ id: voicemailSourceTombstones.id })
        .from(voicemailSourceTombstones)
        .where(sql`${voicemailSourceTombstones.callLogId} IN (${deleteIds})`);

      if (existingTombstones.length > 0) {
        verbose(
          `  ⚠ ${existingTombstones.length} already tombstoned, skipping`
        );
        skipped++;
        processed++;
        continue;
      }

      // Create tombstones for duplicate IDs
      if (!isDryRun) {
        for (const deleteId of deleteIds) {
          try {
            await db.insert(voicemailSourceTombstones).values({
              callLogId: deleteId,
              groupId: `group-${keepId}`,
              threadId: `thread-${group.callerNumber}-${group.aiTitle}`,
              dismissedAt: new Date(),
              dismissedBy: "migration-script",
            });
            tombstonesCreated++;
          } catch (err) {
            warn(
              `Failed to create tombstone for ${deleteId}: ${err.message}`
            );
          }
        }
      } else {
        tombstonesCreated += deleteIds.length;
      }

      verbose(`  ✓ Created ${deleteIds.length} tombstone(s)`);
      processed++;
    } catch (err) {
      error(
        `Failed to process group ${group.callerNumber}: ${err.message}`
      );
      processed++;
    }
  }

  return { processed, tombstonesCreated, skipped };
}

// ─── Verify Results ─────────────────────────────────────────────────────────

async function verifyMigration(db, duplicates) {
  log("Verifying migration...");

  try {
    // Count total tombstones created
    const tombstoneCount = await db
      .select({ count: sql`COUNT(*) as count` })
      .from(voicemailSourceTombstones)
      .where(
        sql`${voicemailSourceTombstones.dismissedBy} = 'migration-script'`
      );

    const count = tombstoneCount[0]?.count || 0;
    log(`Total tombstones created by migration: ${count}`);

    // Sample a few tombstones
    const samples = await db
      .select()
      .from(voicemailSourceTombstones)
      .where(
        sql`${voicemailSourceTombstones.dismissedBy} = 'migration-script'`
      )
      .limit(5);

    if (samples.length > 0) {
      verbose("Sample tombstones:");
      samples.forEach((t) => {
        verbose(
          `  - CallLogID: ${t.callLogId}, Group: ${t.groupId}, Dismissed: ${t.dismissedAt}`
        );
      });
    }

    return count;
  } catch (err) {
    error(`Failed to verify migration: ${err.message}`);
    return 0;
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     Voicemail Duplicate Migration Script                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  if (isDryRun) {
    warn("DRY RUN MODE - No changes will be made to the database");
  }

  const db = await getDb();
  log("Connected to database");

  // Find duplicates
  const duplicates = await findDuplicateGroups(db);

  if (duplicates.length === 0) {
    log("No duplicate voicemails found. Migration complete!");
    process.exit(0);
  }

  // Process duplicates
  const results = await createTombstonesForDuplicates(db, duplicates);

  // Verify
  const verified = await verifyMigration(db, duplicates);

  // Summary
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    Migration Summary                       ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  log(`Duplicate groups found: ${duplicates.length}`);
  log(`Groups processed: ${results.processed}`);
  log(`Tombstones created: ${results.tombstonesCreated}`);
  log(`Groups skipped: ${results.skipped}`);
  log(`Verified tombstones in DB: ${verified}`);

  if (isDryRun) {
    log("\nDRY RUN: No changes were made. Run without --dry-run to execute.");
  } else {
    log("\nMigration complete! Duplicate voicemails are now tombstoned.");
  }

  console.log("\n");
  process.exit(0);
}

// Run migration
main().catch((err) => {
  error(`Migration failed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
