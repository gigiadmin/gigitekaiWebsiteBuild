#!/usr/bin/env node

/**
 * Voicemail Duplicate Migration Script - Phase 6
 * 
 * Purpose: Identify existing duplicate voicemail tickets and create tombstones
 * to prevent them from being re-imported.
 * 
 * Usage: node scripts/migrate-voicemail-duplicates.mjs [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run   : Show what would be done without making changes
 *   --verbose   : Print detailed information about each duplicate group
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDryRun = process.argv.includes('--dry-run');
const isVerbose = process.argv.includes('--verbose');

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);
const verbose = (msg) => isVerbose && log(`  ℹ️  ${msg}`);
const success = (msg) => log(`✅ ${msg}`);
const error = (msg) => log(`❌ ${msg}`);
const warn = (msg) => log(`⚠️  ${msg}`);

async function main() {
  log('='.repeat(70));
  log('VOICEMAIL DUPLICATE MIGRATION - Phase 6');
  log('='.repeat(70));
  
  if (isDryRun) {
    warn('DRY RUN MODE - No changes will be made');
  }

  let connection;

  try {
    // Connect to database
    log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gigitekai',
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });
    success('Database connection established');

    // Step 1: Find duplicate voicemail tickets
    log('\nStep 1: Identifying duplicate voicemail tickets...');
    
    const [duplicates] = await connection.query(`
      SELECT 
        title,
        description,
        COUNT(*) as count,
        GROUP_CONCAT(id ORDER BY created_at) as ids,
        GROUP_CONCAT(externalId ORDER BY created_at) as externalIds,
        MIN(created_at) as oldest_created_at,
        MAX(created_at) as newest_created_at
      FROM callDraftTickets
      WHERE title LIKE '%Voicemail%'
        AND reviewStatus = 'pending'
      GROUP BY title, description
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (duplicates.length === 0) {
      success('No duplicate voicemail tickets found');
      return;
    }

    log(`Found ${duplicates.length} groups of duplicate voicemails`);
    verbose(`Total duplicate groups: ${duplicates.length}`);

    // Step 2: Calculate statistics
    let totalDuplicates = 0;
    let totalToDelete = 0;
    const duplicateStats = [];

    for (const dup of duplicates) {
      const count = parseInt(dup.count);
      totalDuplicates += count;
      totalToDelete += count - 1; // Keep one, delete the rest
      
      duplicateStats.push({
        title: dup.title,
        count,
        ids: dup.ids.split(',').map(Number),
        externalIds: dup.externalIds ? dup.externalIds.split(',') : [],
        oldestCreatedAt: dup.oldest_created_at,
        newestCreatedAt: dup.newest_created_at,
      });

      if (isVerbose) {
        verbose(`Group: "${dup.title}"`);
        verbose(`  Count: ${count} duplicates`);
        verbose(`  IDs: ${dup.ids}`);
        verbose(`  Created: ${dup.oldest_created_at} to ${dup.newest_created_at}`);
      }
    }

    log(`\nStatistics:`);
    log(`  Total duplicate tickets: ${totalDuplicates}`);
    log(`  Total to delete: ${totalToDelete}`);
    log(`  Total to keep: ${duplicates.length}`);

    // Step 3: Create tombstones for deleted tickets
    log('\nStep 2: Creating tombstones for deleted duplicates...');
    
    let tombstonesCreated = 0;
    const tombstoneInserts = [];

    for (const stat of duplicateStats) {
      const keepId = stat.ids[0]; // Keep the oldest
      const deleteIds = stat.ids.slice(1); // Delete the rest

      for (let i = 1; i < stat.ids.length; i++) {
        const externalId = stat.externalIds[i] || `voicemail_${stat.ids[i]}`;
        tombstoneInserts.push({
          externalId,
          ticketId: stat.ids[i],
          keptTicketId: keepId,
          reason: 'duplicate_detected_migration',
        });
        tombstonesCreated++;
      }
    }

    verbose(`Prepared ${tombstonesCreated} tombstone records`);

    // Step 4: Execute migration (if not dry-run)
    if (!isDryRun) {
      log('\nStep 3: Executing migration...');

      // Insert tombstones
      for (const tombstone of tombstoneInserts) {
        await connection.query(
          `INSERT INTO voicemailSourceTombstones (externalId, dismissedAt, reason)
           VALUES (?, NOW(), ?)`,
          [tombstone.externalId, tombstone.reason]
        );
      }
      success(`Created ${tombstonesCreated} tombstone records`);

      // Delete duplicate tickets
      let totalDeleted = 0;
      for (const stat of duplicateStats) {
        const keepId = stat.ids[0];
        const deleteIds = stat.ids.slice(1);

        const [result] = await connection.query(
          `DELETE FROM callDraftTickets WHERE id IN (${deleteIds.join(',')})`,
          []
        );
        
        totalDeleted += result.affectedRows;
        verbose(`Deleted ${result.affectedRows} duplicates for "${stat.title}"`);
      }

      success(`Deleted ${totalDeleted} duplicate tickets`);

      // Verify cleanup
      log('\nStep 4: Verifying cleanup...');
      const [remaining] = await connection.query(`
        SELECT COUNT(*) as count FROM callDraftTickets
        WHERE title LIKE '%Voicemail%' AND reviewStatus = 'pending'
      `);

      success(`Remaining voicemail tickets: ${remaining[0].count}`);
    } else {
      log('\nDRY RUN: Would have:');
      log(`  - Created ${tombstonesCreated} tombstone records`);
      log(`  - Deleted ${totalToDelete} duplicate tickets`);
      log(`  - Kept ${duplicates.length} original tickets`);
    }

    // Step 5: Report summary
    log('\n' + '='.repeat(70));
    log('MIGRATION SUMMARY');
    log('='.repeat(70));
    log(`Status: ${isDryRun ? 'DRY RUN (no changes)' : 'COMPLETED'}`);
    log(`Duplicate groups found: ${duplicates.length}`);
    log(`Total duplicate tickets: ${totalDuplicates}`);
    log(`Tickets to delete: ${totalToDelete}`);
    log(`Tickets to keep: ${duplicates.length}`);
    log(`Tombstones created: ${tombstonesCreated}`);
    log('='.repeat(70));

    if (!isDryRun) {
      success('Migration completed successfully!');
      log('\nNext steps:');
      log('1. Verify the admin dashboard shows no duplicate voicemails');
      log('2. Test voicemail import with new calls');
      log('3. Monitor for any re-appearance of old duplicates');
      log('4. Run Phase 7 production readiness checklist');
    }

  } catch (err) {
    error(`Migration failed: ${err.message}`);
    if (isVerbose) {
      console.error(err);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log('Database connection closed');
    }
  }
}

main().catch((err) => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
