import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await conn.execute(`
    ALTER TABLE tickets 
    ADD COLUMN stepsAttempted TEXT AFTER description
  `);
  console.log('✓ Added stepsAttempted column to tickets table');
} catch(e) {
  if (e.message.includes('Duplicate column')) {
    console.log('✓ Column already exists');
  } else {
    console.error('Error:', e.message);
  }
}

conn.end();
