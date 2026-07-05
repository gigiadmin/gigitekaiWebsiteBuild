/**
 * Direct DB import script for 100 KB articles from CSV
 * Run: node scripts/import-100-kb-articles.mjs
 */
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

// Parse CSV
const csvPath = '/home/ubuntu/gigitekai-kb-import-100-articles.csv';
const csvText = readFileSync(csvPath, 'utf-8');
const lines = csvText.split('\n').filter(l => l.trim());
const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

console.log('Headers:', headers);

const titleIdx = headers.indexOf('title');
const contentIdx = headers.indexOf('content');
const categoryIdx = headers.indexOf('category');
const tagsIdx = headers.indexOf('tags');
const tierIdx = headers.indexOf('tier');
const audienceIdx = headers.indexOf('audience');

const articles = [];
for (let i = 1; i < lines.length; i++) {
  // Handle CSV with possible commas in quoted fields
  const line = lines[i];
  // Simple split on comma (these CSVs don't have quoted commas)
  const values = line.split(',').map(v => v.trim());
  
  if (!values[titleIdx]) continue;
  
  const tier = parseInt(values[tierIdx] || '2', 10);
  const audience = values[audienceIdx] || 'Help Desk';
  
  // Map tier to difficulty
  let difficulty = 'intermediate';
  if (tier === 1) difficulty = 'beginner';
  else if (tier === 3) difficulty = 'advanced';
  
  // Map audience to DB enum
  let dbAudience = 'technician';
  if (audience.toLowerCase().includes('help desk') || audience.toLowerCase().includes('end')) {
    dbAudience = 'end-user';
  } else if (audience.toLowerCase().includes('admin')) {
    dbAudience = 'admin';
  }
  
  articles.push({
    title: values[titleIdx],
    content: values[contentIdx] || '',
    category: values[categoryIdx] || 'General',
    tags: values[tagsIdx] || '',
    difficulty,
    audience: dbAudience,
    tier,
  });
}

console.log(`📋 Parsed ${articles.length} articles from CSV`);

// Connect to DB
const conn = await createConnection(DATABASE_URL);
console.log('✅ Connected to database');

let imported = 0;
let failed = 0;
const errors = [];

for (const article of articles) {
  try {
    // Insert article
    const [result] = await conn.execute(
      `INSERT INTO kbArticles (title, content, category, tags, isPublished, audience, difficulty, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 1, ?, ?, NOW(), NOW())`,
      [article.title, article.content, article.category, article.tags, article.audience, article.difficulty]
    );
    
    const articleId = result.insertId;
    
    // Index in searchIndex
    const metadata = JSON.stringify({
      category: article.category,
      tags: article.tags ? article.tags.split(';').map(t => t.trim()) : [],
      audience: article.audience,
      difficulty: article.difficulty,
      tier: article.tier,
    });
    
    await conn.execute(
      `INSERT INTO searchIndex (contentType, sourceId, title, excerpt, content, url, metadata, createdAt, updatedAt)
       VALUES ('kb', ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE title=VALUES(title), excerpt=VALUES(excerpt), content=VALUES(content), updatedAt=NOW()`,
      [
        articleId.toString(),
        article.title,
        article.content.substring(0, 300),
        article.content,
        `/kb/${articleId}`,
        metadata,
      ]
    );
    
    imported++;
    if (imported % 10 === 0) console.log(`  ✅ Imported ${imported}/${articles.length}...`);
  } catch (err) {
    failed++;
    errors.push(`Article "${article.title}": ${err.message}`);
    console.error(`  ❌ Failed: ${article.title} — ${err.message}`);
  }
}

await conn.end();

console.log('\n📊 Import Results:');
console.log(`  ✅ Imported: ${imported}`);
console.log(`  ❌ Failed: ${failed}`);
if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(e => console.log(' -', e));
}
console.log('\n🎉 Done!');
