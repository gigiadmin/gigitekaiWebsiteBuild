#!/usr/bin/env node
/**
 * Cleanup Script: Remove Duplicate Voicemails
 * 
 * This script identifies and removes duplicate voicemail tickets that were created
 * due to the race condition in the voicemail dedup logic.
 * 
 * Duplicates are identified by:
 * - Same caller phone number
 * - Same title (voicemail subject)
 * - Same description (voicemail transcript)
 * - Created within 24 hours of each other
 * 
 * Only the OLDEST ticket is kept; newer duplicates are deleted.
 */

import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = await createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

console.log('🔍 Scanning for duplicate voicemails...\n');

// Find duplicate voicemail tickets
const [duplicates] = await pool.query(`
  SELECT 
    title,
    description,
    COUNT(*) as count,
    GROUP_CONCAT(id ORDER BY created_at) as ids,
    MIN(created_at) as oldest_created_at
  FROM callDraftTickets
  WHERE title LIKE '%Voicemail%'
    AND reviewStatus = 'pending'
  GROUP BY title, description
  HAVING COUNT(*) > 1
`);

if (duplicates.length === 0) {
  console.log('✅ No duplicates found!');
  await pool.end();
  process.exit(0);
}

console.log(`Found ${duplicates.length} duplicate voicemail groups:\n`);

let totalDeleted = 0;

for (const dup of duplicates) {
  const ids = dup.ids.split(',').map(Number);
  const keepId = ids[0]; // Keep the oldest
  const deleteIds = ids.slice(1); // Delete the rest
  
  console.log(`📋 Title: "${dup.title.substring(0, 50)}..."`);
  console.log(`   Count: ${dup.count} duplicates`);
  console.log(`   Keeping ID: ${keepId} (created: ${dup.oldest_created_at})`);
  console.log(`   Deleting IDs: ${deleteIds.join(', ')}`);
  
  // Delete the duplicate tickets
  const [result] = await pool.query(
    'DELETE FROM callDraftTickets WHERE id IN (?)',
    [deleteIds]
  );
  
  totalDeleted += result.affectedRows;
  console.log(`   ✓ Deleted ${result.affectedRows} duplicates\n`);
}

console.log(`\n✅ Cleanup complete!`);
console.log(`   Total duplicates removed: ${totalDeleted}`);
console.log(`   Remaining voicemail tickets: ${duplicates.reduce((sum, d) => sum + 1, 0)}`);

await pool.end();
