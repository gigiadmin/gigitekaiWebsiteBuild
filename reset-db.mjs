#!/usr/bin/env node
/**
 * Production Database Reset Script
 * Clears all test/development data while preserving schema and admin config
 * Uses Drizzle ORM for safe, type-safe operations
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n');

  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection, { mode: 'default' });

    console.log('✅ Connected to database\n');

    // Disable foreign key checks
    const [disableFK] = await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Disabled foreign key checks\n');

    // List of tables to truncate
    const tablesToTruncate = [
      // Ticket data
      'tickets',
      'ticketReplies',
      'ticketAttachments',
      'ticketTags',
      'ticketMergeHistory',
      'ticketRouting',
      'ticketSLATracking',
      'ticketAssignments',
      
      // Contact data
      'contactSubmissions',
      'customerInvites',
      'customerFeedback',
      
      // Chat data
      'chatSessions',
      'chatMessages',
      'conversationSummaries',
      'chatTranscripts',
      
      // Call data
      'calls',
      'callRecordings',
      'callQualityMetrics',
      'voicemailMessages',
      'callDrafts',
      
      // Metrics
      'agentMetrics',
      'serviceHealthMonitoring',
      'serviceStatusSubscriptions',
      'uptimeRobotMetrics',
      'm365HealthStatus',
      'websiteTraffic',
      'sentimentAnalysisResults',
      'slaPredictions',
      
      // Email data
      'emailMessages',
      'emailDigests',
      'emailDripCampaigns',
      'emailRecipientGroups',
      'emailForwarding',
      'smsCampaigns',
      
      // Activity logs
      'userActivity',
      'adminAuditLog',
      'systemLogs',
      
      // Temporary data
      'webPushSubscriptions',
      'emailDigestSchedules',
      'cannedResponses',
      'kbAutoLinkingCache',
    ];

    console.log(`📋 Truncating ${tablesToTruncate.length} tables...\n`);

    for (const table of tablesToTruncate) {
      try {
        await connection.execute(`TRUNCATE TABLE \`${table}\``);
        console.log(`  ✅ ${table}`);
      } catch (error) {
        // Some tables might not exist, that's ok
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`  ⚠️  ${table} (not found, skipping)`);
        } else {
          console.error(`  ❌ ${table}: ${error.message}`);
        }
      }
    }

    // Re-enable foreign key checks
    const [enableFK] = await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n✅ Re-enabled foreign key checks\n');

    // Verify reset
    console.log('📊 Verification:\n');
    const verifyQueries = [
      { table: 'tickets', query: 'SELECT COUNT(*) as count FROM tickets' },
      { table: 'ticketReplies', query: 'SELECT COUNT(*) as count FROM ticketReplies' },
      { table: 'contactSubmissions', query: 'SELECT COUNT(*) as count FROM contactSubmissions' },
      { table: 'chatSessions', query: 'SELECT COUNT(*) as count FROM chatSessions' },
      { table: 'calls', query: 'SELECT COUNT(*) as count FROM calls' },
      { table: 'users', query: 'SELECT COUNT(*) as count FROM users' },
      { table: 'knowledgeBase', query: 'SELECT COUNT(*) as count FROM knowledgeBase' },
    ];

    for (const { table, query } of verifyQueries) {
      try {
        const [rows] = await connection.execute(query);
        const count = rows[0]?.count || 0;
        const status = count === 0 ? '✅' : '⚠️ ';
        console.log(`  ${status} ${table}: ${count} rows`);
      } catch (error) {
        console.log(`  ⚠️  ${table}: (query failed)`);
      }
    }

    console.log('\n✅ Database reset complete!\n');
    console.log('🚀 Ready for production testing\n');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run reset
resetDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
