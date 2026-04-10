import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const EMAIL = "harry@gigitek.com";
const NEW_PASSWORD = "GigitekAI2024!";

async function resetPassword() {
  console.log("Connecting to database...");
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 12);
    console.log("Password hashed successfully");

    // Check if user exists
    const [rows] = await conn.execute(
      "SELECT id, email, role FROM admin_credentials WHERE email = ?",
      [EMAIL]
    );

    if (rows.length === 0) {
      console.log(`No account found for ${EMAIL}. Creating new account...`);
      await conn.execute(
        "INSERT INTO admin_credentials (email, name, hashed_password, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
        [EMAIL, "Harry", hashedPassword, "admin", 1]
      );
      console.log(`✅ Admin account created for ${EMAIL}`);
    } else {
      // Update existing password
      await conn.execute(
        "UPDATE admin_credentials SET hashed_password = ?, updated_at = NOW() WHERE email = ?",
        [hashedPassword, EMAIL]
      );
      console.log(`✅ Password reset for ${EMAIL}`);
      console.log("Account details:", JSON.stringify(rows[0]));
    }

    console.log(`\nLogin credentials:`);
    console.log(`  Email: ${EMAIL}`);
    console.log(`  Password: ${NEW_PASSWORD}`);
  } finally {
    await conn.end();
  }
}

resetPassword().catch(console.error);
