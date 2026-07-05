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
  
  // Find articles with very short content (likely truncated)
  const [rows] = await conn.execute(
    'SELECT id, title, LENGTH(content) as len FROM kbArticles WHERE isPublished = 1 ORDER BY len ASC LIMIT 50'
  );
  
  console.log('Articles with shortest content:');
  rows.forEach(r => {
    console.log(`  ID ${r.id}: ${r.len} chars - ${r.title.substring(0, 60)}`);
  });
  
  await conn.end();
}

main().catch(console.error);
