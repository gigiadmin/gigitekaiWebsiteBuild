/**
 * Script to create the first admin account for the GigitekAI Admin Portal
 * Run with: node scripts/create-admin.mjs
 */

import bcrypt from "bcryptjs";
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "support@gigitekai.com";
  const name = process.env.ADMIN_NAME || "Harry (Admin)";
  // SEC-02: Never hardcode passwords in scripts. Set ADMIN_INITIAL_PASSWORD env var before running.
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) {
    console.error("\u274c ADMIN_INITIAL_PASSWORD environment variable is not set.");
    console.error("   Set it before running: ADMIN_INITIAL_PASSWORD=YourSecurePassword node scripts/create-admin.mjs");
    process.exit(1);
  }
  const role = "admin";

  console.log("🔗 Connecting to database...");
  const conn = await createConnection(DATABASE_URL);

  try {
    // Check if admin already exists
    const [existing] = await conn.execute(
      "SELECT id FROM adminCredentials WHERE email = ?",
      [email.toLowerCase()]
    );

    if (existing.length > 0) {
      console.log(`⚠️  Admin account already exists for: ${email}`);
      console.log("   Use the update script to change the password.");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert admin
    await conn.execute(
      `INSERT INTO adminCredentials (email, name, hashedPassword, role, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, true, NOW(), NOW())`,
      [email.toLowerCase(), name, hashedPassword, role]
    );

    console.log("✅ Admin account created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log("\n⚠️  IMPORTANT: Change your password after first login!");
  } finally {
    await conn.end();
  }
}

createAdmin().catch((err) => {
  console.error("❌ Failed to create admin:", err.message);
  process.exit(1);
});
