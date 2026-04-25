/**
 * Check current database state - users, tickets, email messages
 * Run with: node check-db-state.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Check tickets
    const [tickets] = await connection.execute('SELECT COUNT(*) as count FROM `tickets`');
    console.log(`\nTickets: ${tickets[0].count}`);

    // Check recent users (last 20)
    const [users] = await connection.execute(
      'SELECT id, email, name, createdAt FROM `users` ORDER BY createdAt DESC LIMIT 20'
    );
    console.log(`\nRecent Users (last 20):`);
    for (const u of users) {
      const time = new Date(u.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      console.log(`  [${time}] ${u.email} (${u.name || 'no name'})`);
    }

    // Check email messages
    const [emails] = await connection.execute('SELECT COUNT(*) as count FROM `emailMessages`');
    console.log(`\nEmail Messages in DB: ${emails[0].count}`);

    // Check for ggtech or ai.com users
    const [ggtech] = await connection.execute(
      "SELECT id, email, name, createdAt FROM `users` WHERE email LIKE '%ggtech%' OR email LIKE '%@ai.com'"
    );
    if (ggtech.length > 0) {
      console.log(`\nFound ggtech/ai.com users:`);
      for (const u of ggtech) {
        console.log(`  ${u.email} (${u.name})`);
      }
    } else {
      console.log(`\nNo ggtech.com or ai.com users found in database.`);
    }

  } finally {
    await connection.end();
  }
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
