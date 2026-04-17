import { getDb } from './server/db.ts';
import { 
  tickets, 
  chatSessions, 
  chatMessages, 
  realtimeChatSessions,
  realtimeChatMessages,
  userSessions, 
  ticketActivity 
} from './drizzle/schema.ts';

try {
  console.log('Starting database cleanup...');
  const db = await getDb();
  
  // Delete all records from each table
  await db.delete(realtimeChatMessages).execute();
  console.log('✓ Deleted realtime chat messages');
  
  await db.delete(chatMessages).execute();
  console.log('✓ Deleted chat messages');
  
  await db.delete(realtimeChatSessions).execute();
  console.log('✓ Deleted realtime chat sessions');
  
  await db.delete(chatSessions).execute();
  console.log('✓ Deleted chat sessions');
  
  await db.delete(userSessions).execute();
  console.log('✓ Deleted user sessions');
  
  await db.delete(ticketActivity).execute();
  console.log('✓ Deleted ticket activity');
  
  await db.delete(tickets).execute();
  console.log('✓ Deleted tickets');
  
  console.log('\n✓ Database cleanup complete! System is ready for production.');
  process.exit(0);
} catch (error) {
  console.error('Cleanup failed:', error.message);
  console.error(error);
  process.exit(1);
}
