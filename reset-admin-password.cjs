const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetAdminPassword() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute('SELECT hashedPassword FROM adminCredentials WHERE email = ?', ['harry@gigitekai.com']);
  
  if (rows.length === 0) {
    console.log('No admin found');
    await conn.end();
    return;
  }
  
  const hash = rows[0].hashedPassword;
  console.log('Current hash starts with:', hash?.substring(0, 15));
  console.log('Hash length:', hash?.length);
  
  const testPassword = 'YGnali421!!!';
  const isValid = await bcrypt.compare(testPassword, hash);
  console.log('Password valid:', isValid);
  
  if (!isValid) {
    console.log('\nResetting password hash...');
    const newHash = await bcrypt.hash(testPassword, 12);
    const [result] = await conn.execute('UPDATE adminCredentials SET hashedPassword = ? WHERE email = ?', [newHash, 'harry@gigitekai.com']);
    console.log('Updated rows:', result.affectedRows);
    
    // Verify
    const [verifyRows] = await conn.execute('SELECT hashedPassword FROM adminCredentials WHERE email = ?', ['harry@gigitekai.com']);
    const verified = await bcrypt.compare(testPassword, verifyRows[0].hashedPassword);
    console.log('Verification after reset:', verified);
  } else {
    console.log('Password is already correct!');
  }
  
  await conn.end();
}

resetAdminPassword().catch(e => console.error('Error:', e.message));
