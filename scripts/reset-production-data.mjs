/**
 * Production Data Reset Script
 * Deletes voicemail/call data and resets analytics stats
 * Run: node scripts/reset-production-data.mjs
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  console.log('🔌 Connecting to database...');
  const connection = await mysql.createConnection(DATABASE_URL);

  const tables = [
    // Call/Voicemail data (delete child tables first due to FK constraints)
    { name: 'call_transcripts', label: 'Call Transcripts' },
    { name: 'callQualityScores', label: 'Call Quality Scores' },
    { name: 'call_analytics', label: 'Call Analytics' },
    { name: 'call_recordings', label: 'Call Recordings' },
    { name: 'callDraftTickets', label: 'Call Draft Tickets' },
    { name: 'voicemailDedup', label: 'Voicemail Dedup' },
    { name: 'callLogs', label: 'Call Logs' },
    // Stats / Analytics
    { name: 'agentMetrics', label: 'Agent Metrics' },
    { name: 'chatAnalytics', label: 'Chat Analytics' },
    { name: 'kbArticleViews', label: 'KB Article Views' },
    { name: 'kbArticleAnalytics', label: 'KB Article Analytics' },
    { name: 'kbSearchQueries', label: 'KB Search Queries' },
    { name: 'leadGenAnalytics', label: 'Lead Gen Analytics' },
    { name: 'pricingAnalytics', label: 'Pricing Analytics' },
    { name: 'websiteTraffic', label: 'Website Traffic' },
    { name: 'userActivity', label: 'User Activity' },
    { name: 'healthCheckHistory', label: 'Health Check History' },
    { name: 'searchAnalytics', label: 'Search Analytics' },
    { name: 'uptimeStatistics', label: 'Uptime Statistics' },
  ];

  // Disable FK checks temporarily
  await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

  let success = 0;
  let failed = 0;

  for (const table of tables) {
    try {
      const [result] = await connection.execute(`DELETE FROM \`${table.name}\``);
      console.log(`✅ Cleared ${table.label} (${result.affectedRows} rows deleted)`);
      success++;
    } catch (err) {
      console.warn(`⚠️  Skipped ${table.label}: ${err.message}`);
      failed++;
    }
  }

  // Re-enable FK checks
  await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

  await connection.end();

  console.log(`\n🏁 Done! ${success} tables cleared, ${failed} skipped.`);
  console.log('✅ Production database is now clean and ready for real data.');
}

main().catch(err => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
