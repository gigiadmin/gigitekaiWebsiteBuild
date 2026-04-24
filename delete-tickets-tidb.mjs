import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'gateway05.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'UhWFWtnzYdiVL8G.root',
  password: '0kh6UuhTjx8gy682gSPg',
  database: 'mmTCDMc2kTTVcTkwoY8f9U',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true,
  },
});

async function deleteAllTickets() {
  const connection = await pool.getConnection();

  try {
    console.log('[Cleanup] Connecting to TiDB Cloud...');
    console.log('[Cleanup] Starting deletion of all spam tickets...');

    // Get count before deletion
    const [countBefore] = await connection.query('SELECT COUNT(*) as count FROM tickets');
    console.log(`[Cleanup] Total tickets before deletion: ${countBefore[0].count}`);

    // Delete all tickets
    const [result] = await connection.query('DELETE FROM tickets');
    console.log(`[Cleanup] ✅ Deleted ${result.affectedRows} tickets`);

    // Verify deletion
    const [countAfter] = await connection.query('SELECT COUNT(*) as count FROM tickets');
    console.log(`[Cleanup] Total tickets after deletion: ${countAfter[0].count}`);

    if (countAfter[0].count === 0) {
      console.log('[Cleanup] ✅ All tickets successfully deleted!');
      console.log('[Cleanup] Your helpdesk is now clean.');
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
