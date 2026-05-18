import { findAdminByEmail, updateAdminAccount, hashPassword } from './server/admin-auth';

async function resetPassword() {
  try {
    const admin = await findAdminByEmail('harry@gigitekai.com');
    if (!admin) {
      console.log('Admin not found');
      process.exit(1);
    }
    
    console.log('Found admin:', admin.email);
    const hashedPassword = await hashPassword('admin123');
    await updateAdminAccount(admin.id, { password: 'admin123' });
    console.log('Password reset to: admin123');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

resetPassword();
