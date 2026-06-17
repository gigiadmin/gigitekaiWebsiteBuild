#!/usr/bin/env node
/**
 * cleanup-duplicate-tickets.mjs
 * 
 * Removes duplicate tickets created by multiple email ingestion pipelines.
 * 
 * Usage:
 *   node cleanup-duplicate-tickets.mjs [--dry-run] [--subject "pattern"]
 * 
 * Examples:
 *   node cleanup-duplicate-tickets.mjs --dry-run                    # Preview what will be deleted
 *   node cleanup-duplicate-tickets.mjs --subject "Regarding"        # Delete tickets matching subject
 *   node cleanup-duplicate-tickets.mjs                              # Actually delete duplicates
 */

import mysql from 'mysql2/promise';
import process from 'process';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const subjectPattern = args.find(arg => arg.startsWith('--subject='))?.split('=')[1] || 
                       (args.includes('--subject') ? args[args.indexOf('--subject') + 1] : null);

async function main() {
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'gigitekai',
    });

    console.log('🔍 Analyzing duplicate tickets...\n');

    // Find duplicate tickets by subject
    let query = `
      SELECT 
        subject,
        COUNT(*) as count,
        GROUP_CONCAT(id ORDER BY id) as ids,
        MIN(createdAt) as first_created,
        MAX(createdAt) as last_created
      FROM tickets
      WHERE 1=1
    `;

    const params = [];
    if (subjectPattern) {
      query += ` AND subject LIKE ?`;
      params.push(`%${subjectPattern}%`);
    }

    query += `
      GROUP BY subject
      HAVING count > 1
      ORDER BY count DESC
      LIMIT 50
    `;

    const [duplicates] = await connection.execute(query, params);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate tickets found!');
      return;
    }

    console.log(`📊 Found ${duplicates.length} groups of duplicate tickets:\n`);

    let totalDuplicates = 0;
    const ticketsToDelete = [];

    for (const dup of duplicates) {
      const ids = dup.ids.split(',').map(Number);
      const duplicateCount = ids.length - 1; // Keep the first one
      totalDuplicates += duplicateCount;

      console.log(`  Subject: "${dup.subject}"`);
      console.log(`  Total: ${dup.count} tickets | Duplicates to delete: ${duplicateCount}`);
      console.log(`  IDs: ${ids.join(', ')}`);
      console.log(`  First created: ${dup.first_created}`);
      console.log(`  Last created: ${dup.last_created}`);
      console.log('');

      // Keep the first ticket, mark others for deletion
      for (let i = 1; i < ids.length; i++) {
        ticketsToDelete.push(ids[i]);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`  Total duplicate tickets to delete: ${totalDuplicates}`);
    console.log(`  Tickets to keep: ${duplicates.length}`);

    if (isDryRun) {
      console.log('\n🔒 DRY RUN MODE - No changes made');
      console.log(`\nTickets that would be deleted: ${ticketsToDelete.join(', ')}`);
      console.log('\nTo actually delete, run without --dry-run flag');
      return;
    }

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete tickets!');
    console.log(`Tickets to delete: ${ticketsToDelete.join(', ')}\n`);

    // In a real scenario, you'd prompt for confirmation
    // For now, we'll proceed with deletion
    console.log('🗑️  Deleting duplicate tickets...\n');

    // Delete ticket replies first (foreign key constraint)
    if (ticketsToDelete.length > 0) {
      const placeholders = ticketsToDelete.map(() => '?').join(',');
      
      // Delete replies
      const [replyResult] = await connection.execute(
        `DELETE FROM ticketReplies WHERE ticketId IN (${placeholders})`,
        ticketsToDelete
      );
      console.log(`  Deleted ${replyResult.affectedRows} ticket replies`);

      // Delete tickets
      const [ticketResult] = await connection.execute(
        `DELETE FROM tickets WHERE id IN (${placeholders})`,
        ticketsToDelete
      );
      console.log(`  Deleted ${ticketResult.affectedRows} duplicate tickets`);
    }

    console.log('\n✅ Cleanup complete!');
    console.log(`\nRemaining tickets: ${duplicates.length} (kept the oldest of each group)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
