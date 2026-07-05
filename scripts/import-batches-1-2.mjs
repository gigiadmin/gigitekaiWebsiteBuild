/**
 * Import batch1 and batch2 KB articles (31 total) with full content
 * Replaces truncated articles from the initial CSV import
 */
import { config } from 'dotenv';
config();
import mysql from 'mysql2/promise';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const DB_URL = process.env.DATABASE_URL;

// Parse MySQL URL: mysql://user:pass@host:port/db
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

// Map tier to difficulty
function tierToDifficulty(tier) {
  if (tier === '1') return 'beginner';
  if (tier === '2') return 'intermediate';
  if (tier === '3') return 'advanced';
  return 'intermediate';
}

// Map audience string to enum
function mapAudience(audience) {
  if (!audience) return 'technician';
  const a = audience.toLowerCase();
  if (a.includes('end user') || a.includes('end-user')) return 'end-user';
  if (a.includes('admin')) return 'admin';
  return 'technician';
}

// Parse category into category + subcategory
function parseCategory(cat) {
  if (!cat) return { category: 'General', subcategory: null };
  const parts = cat.split('>').map(s => s.trim());
  return {
    category: parts[0] || 'General',
    subcategory: parts[1] || null
  };
}

// Extract metadata from MD content
function parseMdArticle(content, filename) {
  const lines = content.split('\n');
  const title = lines[0].replace(/^#\s*/, '').trim();
  
  const meta = {};
  for (const line of lines) {
    const m = line.match(/^\*\*([^*]+)\*\*:\s*(.+)/);
    if (m) {
      meta[m[1].trim()] = m[2].trim();
    }
  }
  
  const articleCode = meta['Article Code'] || filename.replace('.md', '').toUpperCase().split('-').slice(0,2).join('-');
  const rawCategory = meta['Category'] || 'General';
  const { category, subcategory } = parseCategory(rawCategory);
  const tier = meta['Tier'] || '2';
  const audience = mapAudience(meta['Audience'] || '');
  const difficulty = tierToDifficulty(tier);
  const estimatedTime = meta['Estimated Resolution Time'] || null;
  
  // Extract tags from last line
  let tags = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const tagMatch = lines[i].match(/^\*\*Tags:\*\*\s*(.+)/);
    if (tagMatch) {
      tags = tagMatch[1].trim();
      break;
    }
  }
  
  // Keywords = tags + title words
  const keywords = [tags, title].filter(Boolean).join(', ');
  
  return {
    title,
    content,
    category,
    subcategory,
    tags,
    articleCode,
    audience,
    difficulty,
    estimatedTime,
    keywords,
    rawCategory
  };
}

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log('✅ Connected to DB');

  const batchDirs = ['/home/ubuntu/upload/batch1', '/home/ubuntu/upload/batch2'];
  const articles = [];

  // Collect all MD files from both batches
  for (const dir of batchDirs) {
    try {
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const filePath = join(dir, file);
        const content = readFileSync(filePath, 'utf8');
        const parsed = parseMdArticle(content, file);
        articles.push(parsed);
      }
    } catch (err) {
      console.error(`Error reading ${dir}:`, err.message);
    }
  }

  console.log(`📋 Found ${articles.length} articles to import`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const article of articles) {
    try {
      // Check if already exists by articleCode
      const [existing] = await conn.execute(
        'SELECT id FROM kbArticles WHERE articleCode = ? LIMIT 1',
        [article.articleCode]
      );

      if (existing.length > 0) {
        console.log(`  SKIP (exists): ${article.articleCode} - ${article.title}`);
        skipped++;
        continue;
      }

      // Insert into kbArticles
      const [result] = await conn.execute(
        `INSERT INTO kbArticles 
         (title, content, category, subcategory, tags, isPublished, audience, difficulty, 
          estimatedResolutionTime, articleCode, ariaEnabled, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          article.title,
          article.content,
          article.category,
          article.subcategory,
          article.tags,
          article.audience,
          article.difficulty,
          article.estimatedTime,
          article.articleCode
        ]
      );

      // Insert into knowledgeBase (search index)
      await conn.execute(
        `INSERT INTO knowledgeBase (category, title, content, keywords, priority, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          article.rawCategory,
          article.title,
          article.content.substring(0, 5000), // trim for search index
          article.keywords,
          2
        ]
      );

      console.log(`  OK: ${article.articleCode} - ${article.title}`);
      imported++;
    } catch (err) {
      console.error(`  ERROR: ${article.articleCode}: ${err.message}`);
      errors++;
    }
  }

  await conn.end();
  console.log(`\n=== Import complete ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Errors: ${errors}`);

  // Final count
  const conn2 = await mysql.createConnection(parseDbUrl(DB_URL));
  const [countResult] = await conn2.execute('SELECT COUNT(*) as total FROM kbArticles WHERE isPublished = 1');
  console.log(`Total published KB articles: ${countResult[0].total}`);
  await conn2.end();
}

main().catch(console.error);
