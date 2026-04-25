/**
 * Delete all tickets and related data from the database.
 * Run with: node delete-all-tickets.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  
  try {
    // Check ticket count
    const [countBefore] = await connection.execute('SELECT COUNT(*) as count FROM `tickets`');
    console.log(`Total tickets before deletion: ${countBefore[0].count}`);
    
    // Disable foreign key checks temporarily for clean deletion
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete from child tables first (tables with ticketId FK)
    const childTables = [
      'ticketReplies',
      'ticketNotes',
      'customerFeedback',
      'kbGenerations',
      'kbGenerationQueue',
      'ticketKbSuggestions',
      'helpdeskNotifications',
      'ticketMergeHistory',
      'bulkTicketActions',
      'ticketSurveys',
    ];
    
    for (const table of childTables) {
      try {
        const [result] = await connection.execute(`DELETE FROM \`${table}\``);
        console.log(`Deleted from ${table}: ${result.affectedRows} rows`);
      } catch (err) {
        console.log(`Skipped ${table}: ${err.message?.substring(0, 80)}`);
      }
    }
    
    // Delete email messages linked to tickets
    try {
      const [result] = await connection.execute('DELETE FROM `emailMessages`');
      console.log(`Deleted from emailMessages: ${result.affectedRows} rows`);
    } catch (err) {
      console.log(`Skipped emailMessages: ${err.message?.substring(0, 80)}`);
    }
    
    // Delete the tickets themselves
    const [ticketResult] = await connection.execute('DELETE FROM `tickets`');
    console.log(`Deleted from tickets: ${ticketResult.affectedRows} rows`);
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Verify
    const [countAfter] = await connection.execute('SELECT COUNT(*) as count FROM `tickets`');
    console.log(`\nTickets remaining: ${countAfter[0].count}`);
    console.log('All tickets and related data deleted successfully.');
  } catch (error) {
    console.error('Error:', error.message);
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
  } finally {
    await connection.end();
  }
}

main();
