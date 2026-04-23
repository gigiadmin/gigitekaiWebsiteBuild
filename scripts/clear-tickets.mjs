/**
 * Production Cleanup Script — Clear all test tickets
 * Deletes all tickets, replies, notes, and activity from the helpdesk
 * Run: node scripts/clear-tickets.mjs
 */
import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';

// Load env
try {
  const envFile = readFileSync('/home/ubuntu/gigitekai/.env', 'utf8');
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
} catch (e) { /* use existing env */ }

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse the DATABASE_URL
const url = new URL(dbUrl);
const connection = await createConnection({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

console.log('Connected to database');

try {
  // Count before deletion
  const [ticketCount] = await connection.execute('SELECT COUNT(*) as count FROM tickets');
  const [replyCount] = await connection.execute('SELECT COUNT(*) as count FROM ticketReplies');
  const [noteCount] = await connection.execute('SELECT COUNT(*) as count FROM ticketNotes');
  const [activityCount] = await connection.execute('SELECT COUNT(*) as count FROM ticketActivity');

  console.log(`Found: ${ticketCount[0].count} tickets, ${replyCount[0].count} replies, ${noteCount[0].count} notes, ${activityCount[0].count} activity records`);

  // Delete in correct order (foreign keys)
  await connection.execute('DELETE FROM ticketActivity');
  console.log(`✅ Deleted ${activityCount[0].count} ticket activity records`);

  await connection.execute('DELETE FROM ticketNotes');
  console.log(`✅ Deleted ${noteCount[0].count} ticket notes`);

  await connection.execute('DELETE FROM ticketReplies');
  console.log(`✅ Deleted ${replyCount[0].count} ticket replies`);

  await connection.execute('DELETE FROM tickets');
  console.log(`✅ Deleted ${ticketCount[0].count} tickets`);

  // Also clear emails and agent metrics while we're at it
  const [emailCount] = await connection.execute('SELECT COUNT(*) as count FROM emailMessages');
  await connection.execute('DELETE FROM emailMessages');
  console.log(`✅ Deleted ${emailCount[0].count} email messages`);

  const [metricsCount] = await connection.execute('SELECT COUNT(*) as count FROM agentMetrics');
  await connection.execute('DELETE FROM agentMetrics');
  console.log(`✅ Deleted ${metricsCount[0].count} agent metrics`);

  console.log('\n🎉 Production cleanup complete! All test data has been cleared.');
} catch (err) {
  console.error('Error during cleanup:', err.message);
} finally {
  await connection.end();
}
