/**
 * Import 36 MD KB articles into kbArticles and knowledgeBase tables
 */
import { config } from 'dotenv';
config();
import mysql from 'mysql2/promise';

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

const articles = [
  { file: 'AZR-002-vm-wont-start-allocation-failure.md' },
  { file: 'AZR-005-restore-from-azure-backup.md' },
  { file: 'AZR-009-password-hash-sync-failures.md' },
  { file: 'AZR-013-p2s-vpn-cannot-connect.md' },
  { file: 'AZR-014-s2s-vpn-tunnel-down.md' },
  { file: 'AZR-016-app-service-down.md' },
  { file: 'EID-001-sspr-enable-and-register.md' },
  { file: 'EID-004-revoke-sessions-after-compromise.md' },
  { file: 'EID-011-activate-pim-eligible-roles.md' },
  { file: 'EID-018-eliminate-legacy-authentication.md' },
  { file: 'EML-057-ndr-quick-reference.md' },
  { file: 'EML-059-convert-user-mailbox-to-shared.md' },
  { file: 'EML-060-full-access-sendas-sendonbehalf.md' },
  { file: 'EML-071-mail-flow-connectors-third-party.md' },
  { file: 'EML-072-rebuild-corrupt-outlook-profile.md' },
  { file: 'INT-001-autopilot-deployment-failures.md' },
  { file: 'ODV-070-onedrive-storage-full.md' },
  { file: 'ODV-076-ransomware-restore-onedrive.md' },
  { file: 'ODV-077-preserve-departing-employee-data.md' },
  { file: 'PUR-001-retention-policies-vs-labels.md' },
  { file: 'PUR-002-dlp-policy-for-pii.md' },
  { file: 'SEC-001-mde-onboarding-failures.md' },
  { file: 'SEC-002-isolate-device-incident.md' },
  { file: 'SPO-002-external-sharing-settings.md' },
  { file: 'SPO-003-two-stage-recycle-bin-restore.md' },
  { file: 'SPO-005-broken-permission-inheritance.md' },
  { file: 'SPO-010-restore-deleted-sharepoint-site.md' },
  { file: 'SPO-011-sync-vs-add-shortcut.md' },
  { file: 'SPO-020-library-wont-sync-blockers.md' },
  { file: 'TMS-060-guest-invitations-not-received.md' },
  { file: 'TMS-065-configure-e911.md' },
  { file: 'TMS-067-diagnose-poor-call-quality.md' },
  { file: 'TMS-079-recording-transcript-storage-expiration.md' },
  { file: 'TMS-091-port-phone-numbers.md' },
];

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const UPLOAD_DIR = '/home/ubuntu/upload';

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log('Connected to DB');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const { file } of articles) {
    const filePath = join(UPLOAD_DIR, file);
    if (!existsSync(filePath)) {
      console.log(`  MISSING: ${file}`);
      errors++;
      continue;
    }

    const content = readFileSync(filePath, 'utf8');
    const parsed = parseMdArticle(content, file);

    try {
      // Check if already exists by articleCode
      const [existing] = await conn.execute(
        'SELECT id FROM kbArticles WHERE articleCode = ? LIMIT 1',
        [parsed.articleCode]
      );

      if (existing.length > 0) {
        console.log(`  SKIP (exists): ${parsed.articleCode} - ${parsed.title}`);
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
          parsed.title,
          parsed.content,
          parsed.category,
          parsed.subcategory,
          parsed.tags,
          parsed.audience,
          parsed.difficulty,
          parsed.estimatedTime,
          parsed.articleCode
        ]
      );

      // Insert into knowledgeBase (search index)
      await conn.execute(
        `INSERT INTO knowledgeBase (category, title, content, keywords, priority, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          parsed.rawCategory,
          parsed.title,
          parsed.content.substring(0, 5000), // trim for search index
          parsed.keywords,
          2
        ]
      );

      console.log(`  OK: ${parsed.articleCode} - ${parsed.title}`);
      imported++;
    } catch (err) {
      console.error(`  ERROR: ${file}: ${err.message}`);
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
