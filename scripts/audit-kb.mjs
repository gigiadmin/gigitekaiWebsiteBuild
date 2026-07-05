/**
 * Audit KB articles - find short/truncated ones and total count
 */
import { config } from 'dotenv';
config();
import mysql from 'mysql2/promise';

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

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  
  const [short] = await conn.execute(
    'SELECT id, title, articleCode, LENGTH(content) as len FROM kbArticles WHERE isPublished=1 AND LENGTH(content)<300 ORDER BY len ASC LIMIT 20'
  );
  console.log('Short articles (<300 chars):');
  short.forEach(r => console.log(`  ID ${r.id} [${r.articleCode||'no-code'}]: ${r.len} chars - ${r.title}`));

  const [cnt] = await conn.execute('SELECT COUNT(*) as c FROM kbArticles WHERE isPublished=1');
  console.log('\nTotal published articles:', cnt[0].c);

  await conn.end();
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
