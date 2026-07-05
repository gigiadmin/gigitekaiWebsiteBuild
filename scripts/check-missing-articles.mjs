/**
 * Check which of the 100 Gap Analysis articles are missing from the DB
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

// All 100 article codes from Gap Analysis
const gapCodes = [
  'AZR-001','AZR-002','AZR-003','AZR-004','AZR-005','AZR-006','AZR-007','AZR-008','AZR-009','AZR-010',
  'AZR-011','AZR-012','AZR-013','AZR-014','AZR-015','AZR-016','AZR-017','AZR-018','AZR-019','AZR-020',
  'EML-054','EML-055','EML-056','EML-057','EML-058','EML-059','EML-060','EML-061','EML-062','EML-063',
  'EML-064','EML-065','EML-066','EML-067','EML-068','EML-069','EML-070','EML-071','EML-072','EML-073',
  'TMS-060','TMS-061','TMS-062','TMS-063','TMS-064','TMS-065','TMS-066','TMS-067','TMS-068','TMS-069',
  'TMS-070','TMS-071','TMS-072','TMS-073','TMS-074','TMS-075','TMS-076','TMS-077','TMS-078','TMS-079',
  'SPO-001','SPO-002','SPO-003','SPO-004','SPO-005','SPO-006','SPO-007','SPO-008','SPO-009','SPO-010',
  'SPO-011','SPO-012','SPO-013','SPO-014','SPO-015','SPO-016','SPO-017','SPO-018','SPO-019','SPO-020',
  'ODV-070','ODV-071','ODV-072','ODV-073','ODV-074','ODV-075','ODV-076','ODV-077',
  'INT-001','INT-002','INT-003','INT-004','INT-005','INT-006',
  'EID-001','EID-002','EID-003','EID-004','EID-005','EID-006'
];

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  
  // Get all article codes in DB
  const [rows] = await conn.execute(
    'SELECT articleCode FROM kbArticles WHERE isPublished=1 AND articleCode IS NOT NULL'
  );
  const dbCodes = new Set(rows.map(r => r.articleCode));
  
  const missing = gapCodes.filter(c => !dbCodes.has(c));
  console.log(`Missing from DB (${missing.length} articles):`);
  missing.forEach(c => console.log(' ', c));
  
  const [cnt] = await conn.execute('SELECT COUNT(*) as c FROM kbArticles WHERE isPublished=1');
  console.log('\nTotal published articles:', cnt[0].c);
  
  await conn.end();
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
