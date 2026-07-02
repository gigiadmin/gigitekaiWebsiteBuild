import { getDb } from './db.ts';
import { callDraftTickets } from '../drizzle/schema.ts';
import { count, desc } from 'drizzle-orm';

const db = await getDb();
const total = await db.select({ count: count() }).from(callDraftTickets);
console.log('Total drafts:', total[0].count);

// Get recent drafts
const recent = await db.select().from(callDraftTickets).orderBy(desc(callDraftTickets.createdAt)).limit(5);
console.log('\nRecent 5 drafts:');
recent.forEach(d => {
  console.log(`  ID: ${d.id}, Title: ${d.title}, Status: ${d.reviewStatus}, Created: ${d.createdAt}`);
});
