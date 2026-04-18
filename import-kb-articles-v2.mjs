import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

async function importKBArticles() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("🚀 Importing KB articles...\n");

    const kbDir = "/home/ubuntu/kb-articles";
    const files = fs.readdirSync(kbDir).filter((f) => f.endsWith(".md"));

    console.log(`📁 Found ${files.length} KB article files\n`);

    let imported = 0;
    for (const file of files) {
      const filePath = path.join(kbDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      // Extract title from filename (remove number prefix and .md)
      const title = file
        .replace(/^\d+-/, "")
        .replace(/.md$/, "")
        .replace(/-/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      // Determine category from filename
      let category = "General";
      if (file.includes("password") || file.includes("email") || file.includes("mobile"))
        category = "Tier 1 - Account & Authentication";
      else if (file.includes("wifi") || file.includes("network") || file.includes("vpn"))
        category = "Tier 1 - Network & Connectivity";
      else if (file.includes("email") || file.includes("outlook"))
        category = "Tier 1 - Email & Communication";
      else if (file.includes("printer") || file.includes("peripheral") || file.includes("device"))
        category = "Tier 1 - Hardware & Peripherals";
      else if (file.includes("browser") || file.includes("application"))
        category = "Tier 1 - Software & Applications";
      else if (file.includes("microsoft") || file.includes("365"))
        category = "Tier 2 - Microsoft 365";
      else if (file.includes("performance") || file.includes("computer"))
        category = "Tier 2 - Performance & Optimization";
      else if (file.includes("network") && file.includes("advanced"))
        category = "Tier 2 - Network Administration";
      else if (file.includes("security") || file.includes("malware"))
        category = "Tier 2 - Security & Compliance";
      else if (file.includes("backup") || file.includes("recovery"))
        category = "Tier 2 - Backup & Recovery";
      else if (file.includes("remote") || file.includes("access"))
        category = "Tier 2 - Remote Access";

      try {
        await connection.execute(
          "INSERT INTO kbArticles (title, content, category, tags, isPublished, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
          [title, content, category, category, true]
        );
        console.log(`✅ ${title}`);
        imported++;
      } catch (error) {
        console.error(`❌ Failed to import ${title}:`, error.message);
      }
    }

    console.log(`\n📊 Successfully imported ${imported}/${files.length} articles`);
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("💥 Fatal error:", error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

importKBArticles();
