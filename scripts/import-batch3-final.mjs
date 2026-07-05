/**
 * Import batch3 CSV articles using Python's CSV reader output
 */
import { config } from 'dotenv';
config();
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

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

  // Use Python to parse CSV properly
  const pythonScript = `
import csv
import json

with open('/home/ubuntu/upload/kb-batch3.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(json.dumps(row))
`;

  let imported = 0, skipped = 0, errors = 0;

  try {
    const output = execSync(`python3 -c 'import csv,json;[print(json.dumps(row)) for row in csv.DictReader(open(\"/home/ubuntu/upload/kb-batch3.csv\"))]'`, { encoding: 'utf8' });
    const lines = output.split('\n').filter(l => l.trim());
    
    console.log(`📋 Parsed ${lines.length} articles from CSV`);

    for (const line of lines) {
      try {
        const article = JSON.parse(line);
        const title = article.Title?.trim();
        const content = article.Content?.trim();
        const categoryStr = article.Category?.trim() || 'General';
        const tags = article.Tags?.trim() || '';

        if (!title || !content) {
          skipped++;
          continue;
        }

        const codeMatch = title.match(/^([A-Z]+-\d+)/);
        if (!codeMatch) {
          skipped++;
          continue;
        }

        const code = codeMatch[1];

        // Check if exists
        const [existing] = await conn.execute(
          'SELECT id FROM kbArticles WHERE articleCode = ? LIMIT 1',
          [code]
        );

        if (existing.length > 0) {
          console.log(`  SKIP (exists): ${code}`);
          skipped++;
          continue;
        }

        const cat = categoryStr.split('>')[0].trim();
        const subcat = categoryStr.split('>')[1]?.trim() || null;

        // Insert
        await conn.execute(
          `INSERT INTO kbArticles 
           (title, content, category, subcategory, tags, isPublished, audience, difficulty, 
            articleCode, ariaEnabled, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 1, NOW(), NOW())`,
          [title, content, cat, subcat, tags, 'technician', 'intermediate', code]
        );

        await conn.execute(
          `INSERT INTO knowledgeBase (category, title, content, keywords, priority, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [categoryStr, title, content.substring(0, 5000), `${tags}, ${title}`, 2]
        );

        console.log(`  OK: ${code}`);
        imported++;
      } catch (err) {
        console.error(`  ERROR: ${err.message}`);
        errors++;
      }
    }
  } catch (err) {
    console.error('Failed to parse CSV:', err.message);
  }

  await conn.end();
  console.log(`\n=== Import complete ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  // Final count
  const conn2 = await mysql.createConnection(parseDbUrl(DB_URL));
  const [cnt] = await conn2.execute('SELECT COUNT(*) as c FROM kbArticles WHERE isPublished = 1');
  console.log(`Total published KB articles: ${cnt[0].c}`);
  await conn2.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
