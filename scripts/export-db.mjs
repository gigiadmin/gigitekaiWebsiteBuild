import { getDb } from "../server/db.ts";
import { sql } from "drizzle-orm";
import fs from "fs";

async function run() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Failed to get DB connection");
      process.exit(1);
    }
    const tablesResult = await db.execute(sql`SHOW TABLES`);
    const tables = Array.isArray(tablesResult) ? tablesResult[0] : tablesResult;
    console.log("Tables found:", tables.length);
    let dump = "-- GigitekAI Database Backup via Drizzle\n";
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      try {
        const rowsResult = await db.execute(sql.raw(`SELECT * FROM \`${tableName}\` LIMIT 2000`));
        const rows = Array.isArray(rowsResult) ? rowsResult[0] : rowsResult;
        dump += `\n-- Table: ${tableName} (${rows.length} rows)\n`;
        for (const r of rows) {
          const keys = Object.keys(r);
          const cols = keys.map(c => `\`${c}\``).join(", ");
          const vals = keys.map(k => {
            const v = r[k];
            if (v === null) return "NULL";
            if (typeof v === "number" || typeof v === "boolean") return v;
            if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
            if (Buffer.isBuffer(v)) return `X'${v.toString("hex")}'`;
            return `'${String(v).replace(/\x00/g, "").replace(/'/g, "\\'")}'`;
          }).join(", ");
          dump += `INSERT INTO \`${tableName}\` (${cols}) VALUES (${vals});\n`;
        }
      } catch (e) {
        console.error(`Skipping table ${tableName}:`, e.message);
      }
    }
    fs.writeFileSync("/home/ubuntu/gigitekai_backup_staging/database_dump.sql", dump);
    console.log("Database backup written successfully to /home/ubuntu/gigitekai_backup_staging/database_dump.sql!");
  } catch (err) {
    console.error("Export error:", err);
  } finally {
    process.exit(0);
  }
}

run();
