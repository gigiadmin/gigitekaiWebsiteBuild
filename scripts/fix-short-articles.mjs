/**
 * Fix 6 articles with truncated content by updating them with full MD content
 */
import { config } from 'dotenv';
config();
import mysql from 'mysql2/promise';
import { readFileSync, existsSync } from 'fs';

const DB_URL = process.env.DATABASE_URL;

function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port) || 3306,
    user: u.username,
    password: u.password,
    database: u.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: false }
  };
}

// Map of article ID -> MD file path
const fixes = [
  {
    id: 1650001,
    title: 'Cannot Sign In to Azure Portal — No Subscriptions Found',
    file: '/home/ubuntu/upload/batch1/AZR-001-azure-portal-no-subscriptions.md'
  },
  {
    id: 1650002,
    title: 'Azure VM Won\'t Start — Allocation Failure or Stuck Starting',
    file: '/home/ubuntu/upload/AZR-002-vm-wont-start-allocation-failure.md'
  },
  {
    id: 1650016,
    title: 'Azure App Service Down — Restart Log Stream and Health Checks',
    file: '/home/ubuntu/upload/AZR-016-app-service-down.md'
  },
];

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log('Connected to DB');

  let updated = 0;
  let skipped = 0;

  for (const fix of fixes) {
    if (!existsSync(fix.file)) {
      console.log(`  MISSING FILE: ${fix.file} - skipping ID ${fix.id}`);
      skipped++;
      continue;
    }

    const content = readFileSync(fix.file, 'utf8');
    console.log(`  Updating ID ${fix.id}: ${content.length} chars - ${fix.title}`);

    await conn.execute(
      'UPDATE kbArticles SET content = ?, updatedAt = NOW() WHERE id = ?',
      [content, fix.id]
    );
    updated++;
  }

  console.log(`\nUpdated: ${updated}, Skipped: ${skipped}`);

  // Show remaining short articles
  const [short] = await conn.execute(
    'SELECT id, title, LENGTH(content) as len FROM kbArticles WHERE isPublished=1 AND LENGTH(content)<300 ORDER BY len ASC'
  );
  console.log('\nRemaining short articles (<300 chars):');
  short.forEach(r => console.log(`  ID ${r.id}: ${r.len} chars - ${r.title}`));

  const [cnt] = await conn.execute('SELECT COUNT(*) as c FROM kbArticles WHERE isPublished=1');
  console.log('\nTotal published articles:', cnt[0].c);

  await conn.end();
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
