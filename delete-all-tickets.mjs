import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gigitekai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function deleteAllTickets() {
  const connection = await pool.getConnection();

  try {
    console.log('[Cleanup] Starting deletion of all spam tickets...');

    // Get count before deletion
    const [countBefore] = await connection.query('SELECT COUNT(*) as count FROM helpdesk_tickets');
    console.log(`[Cleanup] Total tickets before deletion: ${countBefore[0].count}`);

    // Delete all tickets (this will cascade to related records)
    const [result] = await connection.query('DELETE FROM helpdesk_tickets');
    console.log(`[Cleanup] ✅ Deleted ${result.affectedRows} tickets`);

    // Verify deletion
    const [countAfter] = await connection.query('SELECT COUNT(*) as count FROM helpdesk_tickets');
    console.log(`[Cleanup] Total tickets after deletion: ${countAfter[0].count}`);

    if (countAfter[0].count === 0) {
      console.log('[Cleanup] ✅ All tickets successfully deleted!');
    } else {
      console.log(`[Cleanup] ⚠️ Warning: ${countAfter[0].count} tickets still remain`);
    }

  } catch (error) {
    console.error('[Cleanup] ❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

deleteAllTickets();
