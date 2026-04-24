/**
 * Cleanup script to remove NDR spam tickets and emails
 * Run with: node cleanup-ndr-spam.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse MySQL connection string
const url = new URL(DATABASE_URL);
const connection = await mysql.createConnection({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  port: url.port || 3306,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  console.log('Cleaning up NDR spam...\n');

  // Step 1: Find all tickets created from NDR emails
  const [ticketsFromNDR] = await connection.execute(`
    SELECT t.id, t.title, em.from
    FROM tickets t
    LEFT JOIN emailMessages em ON t.id = em.linkedTicketId
    WHERE em.from LIKE '%MicrosoftExchange%'
       OR em.from LIKE '%mailer-daemon%'
       OR em.from LIKE '%postmaster%'
       OR em.subject LIKE 'Undeliverable:%'
    ORDER BY t.id DESC
  `);

  console.log(`Found ${ticketsFromNDR.length} tickets created from NDR emails`);
  
  if (ticketsFromNDR.length === 0) {
    console.log('No NDR spam tickets found!');
    await connection.end();
    process.exit(0);
  }

  ticketsFromNDR.forEach(ticket => {
    console.log(`  - Ticket #${ticket.id}: "${ticket.title}"`);
  });

  // Step 2: Get the ticket IDs
  const ticketIds = ticketsFromNDR.map(t => t.id);

  // Step 3: Delete related records
  console.log('\nDeleting related records...');

  // Delete ticket feedback
  try {
    const [feedbackResult] = await connection.execute(
      `DELETE FROM ticketFeedback WHERE ticketId IN (${ticketIds.join(',')})`
    );
    console.log(`  - Deleted ${feedbackResult.affectedRows} feedback records`);
  } catch (e) {
    console.log('  - No feedback records to delete');
  }

  // Delete ticket messages
  try {
    const [messagesResult] = await connection.execute(
      `DELETE FROM ticketMessages WHERE ticketId IN (${ticketIds.join(',')})`
    );
    console.log(`  - Deleted ${messagesResult.affectedRows} message records`);
  } catch (e) {
    console.log('  - No message records to delete');
  }

  // Delete email messages linked to these tickets
  const [emailResult] = await connection.execute(
    `DELETE FROM emailMessages WHERE linkedTicketId IN (${ticketIds.join(',')})`
  );
  console.log(`  - Deleted ${emailResult.affectedRows} email message records`);

  // Delete the tickets themselves
  const [ticketResult] = await connection.execute(
    `DELETE FROM tickets WHERE id IN (${ticketIds.join(',')})`
  );
  console.log(`  - Deleted ${ticketResult.affectedRows} ticket records`);

  // Step 4: Delete orphaned NDR emails (not linked to any ticket)
  const [orphanedResult] = await connection.execute(`
    DELETE FROM emailMessages
    WHERE (from LIKE '%MicrosoftExchange%'
       OR from LIKE '%mailer-daemon%'
       OR from LIKE '%postmaster%'
       OR subject LIKE 'Undeliverable:%')
      AND linkedTicketId IS NULL
  `);
  console.log(`  - Deleted ${orphanedResult.affectedRows} orphaned NDR email records`);

  console.log('\nCleanup complete!');
  console.log(`Summary: Removed ${ticketResult.affectedRows} spam tickets and ${emailResult.affectedRows + orphanedResult.affectedRows} NDR emails`);

} catch (error) {
  console.error('Cleanup failed:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
