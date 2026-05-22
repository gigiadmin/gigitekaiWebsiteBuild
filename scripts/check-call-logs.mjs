import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Check most recent call logs
  const [rows] = await conn.execute(
    'SELECT id, graphCallId, callerNumber, direction, startedAt, durationSeconds, status, hasTranscript, transcriptText FROM callLogs ORDER BY startedAt DESC LIMIT 10'
  );
  
  console.log('=== Most Recent Call Logs ===');
  for (const row of rows) {
    console.log(`  ID: ${row.id} | From: ${row.callerNumber} | Dir: ${row.direction} | Start: ${row.startedAt} | Duration: ${row.durationSeconds}s | Status: ${row.status} | Transcript: ${row.hasTranscript ? 'YES' : 'NO'}`);
    if (row.transcriptText) {
      console.log(`    Transcript: ${row.transcriptText.substring(0, 100)}...`);
    }
  }
  
  // Check draft tickets
  const [drafts] = await conn.execute(
    'SELECT id, callLogId, title, priority, category, reviewStatus, createdAt FROM callDraftTickets ORDER BY createdAt DESC LIMIT 10'
  );
  
  console.log('\n=== Most Recent Draft Tickets ===');
  for (const d of drafts) {
    console.log(`  ID: ${d.id} | CallLog: ${d.callLogId} | Title: ${d.title} | Priority: ${d.priority} | Status: ${d.reviewStatus} | Created: ${d.createdAt}`);
  }
  
  // Check total counts
  const [[countResult]] = await conn.execute('SELECT COUNT(*) as total FROM callLogs');
  const [[draftCount]] = await conn.execute('SELECT COUNT(*) as total FROM callDraftTickets');
  console.log(`\n=== Totals ===`);
  console.log(`  Call Logs: ${countResult.total}`);
  console.log(`  Draft Tickets: ${draftCount.total}`);
  
  await conn.end();
}

main().catch(err => console.error('Error:', err.message));
