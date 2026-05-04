import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Find user by email
  const [users] = await connection.execute(
    'SELECT id, email, role FROM users WHERE email = ?',
    ['hhenry23@gmail.com']
  );

  if (users.length === 0) {
    console.log('User not found with email hhenry23@gmail.com');
    process.exit(1);
  }

  const user = users[0];
  console.log('Found user:', user);

  // Update role to admin
  const [result] = await connection.execute(
    'UPDATE users SET role = ?, approved = ? WHERE id = ?',
    ['admin', true, user.id]
  );

  console.log('Updated user to admin role:', result);
  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
} finally {
  await connection.end();
}
