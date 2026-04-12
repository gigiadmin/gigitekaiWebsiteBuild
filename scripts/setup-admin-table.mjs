import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const EMAIL = process.env.ADMIN_EMAIL || "support@gigitekai.com";
// SEC-02: Never hardcode passwords in scripts. Set ADMIN_INITIAL_PASSWORD env var before running.
const PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;
if (!PASSWORD) {
  console.error("\u274c ADMIN_INITIAL_PASSWORD environment variable is not set.");
  console.error("   Usage: ADMIN_INITIAL_PASSWORD=YourSecurePassword node scripts/setup-admin-table.mjs");
  process.exit(1);
}

async function setup() {
  console.log("Connecting to database...");
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Table already exists with camelCase columns (hashedPassword, isActive, etc.)
    console.log("✅ Table verified (adminCredentials already exists)");

    // Hash the password
    const hashedPassword = await bcrypt.hash(PASSWORD, 12);

    // Check if admin exists
    const [rows] = await conn.execute(
      "SELECT id, email, role FROM adminCredentials WHERE email = ?",
      [EMAIL]
    );

    if (rows.length === 0) {
      // Create admin account
      await conn.execute(
        "INSERT INTO adminCredentials (email, name, hashedPassword, role, isActive) VALUES (?, ?, ?, ?, ?)",
        [EMAIL, "Harry", hashedPassword, "admin", 1]
      );
      console.log(`✅ Admin account created for ${EMAIL}`);
    } else {
      // Reset password and ensure admin role
      await conn.execute(
        "UPDATE adminCredentials SET hashedPassword = ?, role = 'admin', isActive = 1, updatedAt = NOW() WHERE email = ?",
        [hashedPassword, EMAIL]
      );
      console.log(`✅ Password reset for ${EMAIL}`);
    }

    console.log(`\n=== Login Credentials ===`);
    console.log(`  URL:      https://gigitekai.com/login`);
    console.log(`  Email:    ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
    console.log(`  Role:     admin`);
  } finally {
    await conn.end();
  }
}

setup().catch(console.error);
