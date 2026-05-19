import { findAdminByEmail, updateAdminAccount } from './server/admin-auth';

async function resetPassword() {
  try {
    const admin = await findAdminByEmail('harry@gigitekai.com');
    if (!admin) {
      console.log('Admin not found');
      process.exit(1);
    }
    
    console.log('Found admin:', admin.email);
    await updateAdminAccount(admin.id, { password: 'YGnali421+' });
    console.log('Password reset to: YGnali421+');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

resetPassword();
