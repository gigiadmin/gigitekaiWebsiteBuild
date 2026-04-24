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

async function findTables() {
  const connection = await pool.getConnection();

  try {
    console.log('[Query] Finding all tables in database...');

    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('[Query] Available tables:');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`  - ${tableName}`);
    });

    // Look for ticket-related tables
    console.log('\n[Query] Looking for ticket-related tables...');
    const [ticketTables] = await connection.query("SHOW TABLES LIKE '%ticket%'");
    if (ticketTables.length > 0) {
      console.log('[Query] Ticket tables found:');
      ticketTables.forEach(t => {
        const tableName = Object.values(t)[0];
        console.log(`  - ${tableName}`);
      });
    } else {
      console.log('[Query] No ticket tables found');
    }

  } catch (error) {
    console.error('[Query] ❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

findTables();
