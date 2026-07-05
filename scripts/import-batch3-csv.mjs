/**
 * Import batch3 CSV articles (58 missing articles) directly into kbArticles
 */
import { config } from 'dotenv';
config();
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

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

// Simple CSV parser for quoted fields
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

// Extract article code from title (e.g., "AZR-004: ..." -> "AZR-004")
function extractArticleCode(title) {
  const match = title.match(/^([A-Z]+-\d+)/);
  return match ? match[1] : null;
}

// Parse category to extract main category and subcategory
function parseCategory(cat) {
  if (!cat) return { category: 'General', subcategory: null };
  const parts = cat.split('>').map(s => s.trim());
  return {
    category: parts[0] || 'General',
    subcategory: parts[1] || null
  };
}

// Map tier/difficulty
function getDifficulty(content) {
  const lower = content.toLowerCase();
  if (lower.includes('advanced') || lower.includes('expert')) return 'advanced';
  if (lower.includes('beginner') || lower.includes('basic')) return 'beginner';
  return 'intermediate';
}

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log('✅ Connected to DB');

  // Read CSV
  const csvText = readFileSync('/home/ubuntu/upload/kb-batch3.csv', 'utf8');
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  
  // Skip header
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length >= 4) {
      records.push({
        Title: fields[0],
        Content: fields[1],
        Category: fields[2],
        Tags: fields[3]
      });
    }
  }

  console.log(`📋 Parsed ${records.length} articles from CSV`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const title = record.Title?.trim();
      const content = record.Content?.trim();
      const categoryStr = record.Category?.trim() || 'General';
      const tags = record.Tags?.trim() || '';

      if (!title || !content) {
        console.log(`  SKIP: Missing title or content`);
        skipped++;
        continue;
      }

      const articleCode = extractArticleCode(title);
      if (!articleCode) {
        console.log(`  SKIP: Could not extract article code from "${title.substring(0, 50)}"`);
        skipped++;
        continue;
      }

      // Check if already exists
      const [existing] = await conn.execute(
        'SELECT id FROM kbArticles WHERE articleCode = ? LIMIT 1',
        [articleCode]
      );

      if (existing.length > 0) {
        console.log(`  SKIP (exists): ${articleCode}`);
        skipped++;
        continue;
      }

      const { category, subcategory } = parseCategory(categoryStr);
      const difficulty = getDifficulty(content);

      // Insert into kbArticles
      const [result] = await conn.execute(
        `INSERT INTO kbArticles 
         (title, content, category, subcategory, tags, isPublished, audience, difficulty, 
          articleCode, ariaEnabled, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 1, NOW(), NOW())`,
        [
          title,
          content,
          category,
          subcategory,
          tags,
          'technician',
          difficulty,
          articleCode
        ]
      );

      // Insert into knowledgeBase (search index)
      await conn.execute(
        `INSERT INTO knowledgeBase (category, title, content, keywords, priority, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          categoryStr,
          title,
          content.substring(0, 5000),
          `${tags}, ${title}`,
          2
        ]
      );

      console.log(`  OK: ${articleCode}`);
      imported++;
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      errors++;
    }
  }

  await conn.end();
  console.log(`\n=== Import complete ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  // Final count
  const conn2 = await mysql.createConnection(parseDbUrl(DB_URL));
  const [countResult] = await conn2.execute('SELECT COUNT(*) as total FROM kbArticles WHERE isPublished = 1');
  console.log(`Total published KB articles: ${countResult[0].total}`);
  await conn2.end();

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
