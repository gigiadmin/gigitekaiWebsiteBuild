import { getDb } from './server/db.js';
import { adminCredentials } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();
const admin = await db.select().from(adminCredentials).where(eq(adminCredentials.email, 'harry@gigitekai.com')).limit(1);
console.log(JSON.stringify(admin, null, 2));
process.exit(0);
