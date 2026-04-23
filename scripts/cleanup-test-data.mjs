/**
 * Production Readiness Cleanup Script
 * Clears test/demo data from the database before going live.
 * Run with: node scripts/cleanup-test-data.mjs
 */
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('❌ DATABASE_URL not set in environment');
  process.exit(1);
}

async function cleanup() {
  console.log('🔧 GigitekAI Production Readiness Cleanup');
  console.log('==========================================');

  const conn = await createConnection(DB_URL);

  try {
    // Count before
    const [[emailCount]] = await conn.execute('SELECT COUNT(*) as count FROM emailMessages');
    const [[metricsCount]] = await conn.execute('SELECT COUNT(*) as count FROM agentMetrics');

    console.log(`\n📊 Current data:`);
    console.log(`   Emails:        ${emailCount.count} records`);
    console.log(`   Agent Metrics: ${metricsCount.count} records`);

    // Delete emails
    const [emailResult] = await conn.execute('DELETE FROM emailMessages');
    console.log(`\n✅ Deleted ${emailResult.affectedRows} email records`);

    // Delete agent metrics
    const [metricsResult] = await conn.execute('DELETE FROM agentMetrics');
    console.log(`✅ Deleted ${metricsResult.affectedRows} agent metrics records`);

    // Verify
    const [[emailAfter]] = await conn.execute('SELECT COUNT(*) as count FROM emailMessages');
    const [[metricsAfter]] = await conn.execute('SELECT COUNT(*) as count FROM agentMetrics');

    console.log(`\n📊 After cleanup:`);
    console.log(`   Emails:        ${emailAfter.count} records`);
    console.log(`   Agent Metrics: ${metricsAfter.count} records`);
    console.log('\n✅ Cleanup complete — database is production-ready!');

  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

cleanup();
