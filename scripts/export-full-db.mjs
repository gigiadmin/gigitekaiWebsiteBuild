import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";

const outputDir = "/home/ubuntu/gigitekai-transfer-build/database";
const dumpPath = path.join(outputDir, "gigitekai-full-database.sql");
const reportPath = path.join(outputDir, "database-export-report.json");

function sqlValue(connection, value) {
  if (value === null || value === undefined) return "NULL";
  if (Buffer.isBuffer(value)) return `X'${value.toString("hex")}'`;
  if (value instanceof Date) return connection.escape(value.toISOString().slice(0, 19).replace("T", " "));
  if (typeof value === "object") return connection.escape(JSON.stringify(value));
  return connection.escape(value);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is unavailable in this export session");
  fs.mkdirSync(outputDir, { recursive: true });
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [databaseRows] = await connection.query("SELECT DATABASE() AS databaseName");
  const databaseName = databaseRows[0].databaseName;
  const [tableRows] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tableNameColumn = `Tables_in_${databaseName}`;
  const tableNames = tableRows.map(row => row[tableNameColumn]);
  const stream = fs.createWriteStream(dumpPath, { encoding: "utf8" });
  const write = chunk => new Promise((resolve, reject) => stream.write(chunk, error => error ? reject(error) : resolve()));
  const report = { databaseName, generatedAt: new Date().toISOString(), tables: [], totalRows: 0 };

  await write("-- GigitekAI full logical database export\n");
  await write("SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n\n");

  for (const tableName of tableNames) {
    const [createRows] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createStatement = createRows[0]["Create Table"];
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    await write(`-- Table: ${tableName}; rows: ${rows.length}\n`);
    await write(`DROP TABLE IF EXISTS \`${tableName}\`;\n${createStatement};\n`);
    for (const row of rows) {
      const columns = Object.keys(row).map(column => `\`${column}\``).join(", ");
      const values = Object.values(row).map(value => sqlValue(connection, value)).join(", ");
      await write(`INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`);
    }
    await write("\n");
    report.tables.push({ table: tableName, rows: rows.length });
    report.totalRows += rows.length;
    console.log(`Exported ${tableName}: ${rows.length} rows`);
  }

  await write("SET FOREIGN_KEY_CHECKS=1;\n");
  await new Promise((resolve, reject) => stream.end(error => error ? reject(error) : resolve()));
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  await connection.end();
  console.log(`Full database export complete: ${report.totalRows} rows across ${report.tables.length} tables`);
}

main().catch(error => {
  console.error("Database export failed:", error);
  process.exit(1);
});
