import { config } from 'dotenv';
config({ path: '/home/ubuntu/gigitekai/.env' });
import mysql from 'mysql2/promise';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

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
  console.log('✅ Connected to DB');

  // Get all batch files
  const batchDir = '/tmp';
  const files = readdirSync(batchDir)
    .filter(f => f.startsWith('batch3-batch') && f.endsWith('.sql'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

  console.log(`Found ${files.length} batch files`);

  let total = 0;
  for (const file of files) {
    const path = join(batchDir, file);
    const sql = readFileSync(path, 'utf8');
    const statements = sql.split(';\n').filter(s => s.trim());

    console.log(`\n📋 ${file}: ${statements.length} statements`);

    for (let i = 0; i < statements.length; i++) {
      try {
        const stmt = statements[i].trim();
        if (!stmt) continue;

        // Split into kbArticles and knowledgeBase inserts
        if (stmt.includes('INSERT INTO kbArticles')) {
          await conn.execute(stmt);
          total++;
          if ((i + 1) % 5 === 0) process.stdout.write('.');
        }
      } catch (err) {
        console.error(`\n  ERROR in statement ${i+1}: ${err.message}`);
      }
    }
  }

  await conn.end();
  console.log(`\n\n✅ Imported ${total} articles`);
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
