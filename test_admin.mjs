import { getDb } from './server/db.ts';
import { adminCredentials } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const db = await getDb();
    const admin = await db.select().from(adminCredentials).where(eq(adminCredentials.email, 'harry@gigitekai.com')).limit(1);
    console.log('Admin account found:', admin.length > 0);
    if (admin.length > 0) {
      console.log('Email:', admin[0].email);
      console.log('Name:', admin[0].name);
      console.log('Role:', admin[0].role);
      console.log('IsActive:', admin[0].isActive);
      console.log('Password hash exists:', !!admin[0].hashedPassword);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}

main();
