import mysql from "mysql2/promise";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const outputDir = "/home/ubuntu/gigitekai-migration-handoff/data";
await mkdir(outputDir, { recursive: true });

const connection = await mysql.createConnection(databaseUrl);

try {
  const [[server]] = await connection.query(`
    SELECT
      DATABASE() AS databaseName,
      VERSION() AS engineVersion,
      @@version_comment AS engineComment,
      @@character_set_database AS characterSet,
      @@collation_database AS collationName,
      @@sql_mode AS sqlMode,
      @@time_zone AS serverTimeZone
  `);

  const [tableRows] = await connection.query(`
    SELECT
      table_name AS tableName,
      table_collation AS tableCollation,
      COALESCE(data_length, 0) AS dataBytes,
      COALESCE(index_length, 0) AS indexBytes
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const tables = [];
  for (const table of tableRows) {
    const quoted = `\`${String(table.tableName).replaceAll("`", "``")}\``;
    const [[countResult]] = await connection.query(`SELECT COUNT(*) AS exactRows FROM ${quoted}`);
    tables.push({
      tableName: table.tableName,
      exactRows: Number(countResult.exactRows),
      dataBytes: Number(table.dataBytes),
      indexBytes: Number(table.indexBytes),
      totalBytes: Number(table.dataBytes) + Number(table.indexBytes),
      tableCollation: table.tableCollation,
    });
  }

  const [views] = await connection.query(`
    SELECT table_name AS viewName
    FROM information_schema.views
    WHERE table_schema = DATABASE()
    ORDER BY table_name
  `);
  const [triggers] = await connection.query(`
    SELECT trigger_name AS triggerName, event_manipulation AS eventType, event_object_table AS tableName
    FROM information_schema.triggers
    WHERE trigger_schema = DATABASE()
    ORDER BY trigger_name
  `);
  const [routines] = await connection.query(`
    SELECT routine_name AS routineName, routine_type AS routineType
    FROM information_schema.routines
    WHERE routine_schema = DATABASE()
    ORDER BY routine_name
  `);
  const [events] = await connection.query(`
    SELECT event_name AS eventName, status, event_type AS eventType, interval_value AS intervalValue, interval_field AS intervalField
    FROM information_schema.events
    WHERE event_schema = DATABASE()
    ORDER BY event_name
  `);

  const summary = {
    generatedAt: new Date().toISOString(),
    server,
    tableCount: tables.length,
    exactTotalRows: tables.reduce((sum, table) => sum + table.exactRows, 0),
    estimatedDatabaseBytes: tables.reduce((sum, table) => sum + table.totalBytes, 0),
    viewCount: views.length,
    triggerCount: triggers.length,
    routineCount: routines.length,
    scheduledEventCount: events.length,
    tables,
    views,
    triggers,
    routines,
    events,
  };

  await writeFile(
    path.join(outputDir, "database-inventory.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );

  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(3);
  const markdown = [
    "# GigitekAI Database Inventory",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "## Summary",
    "",
    "| Field | Value |",
    "|---|---|",
    `| Database | \`${server.databaseName}\` |`,
    `| Engine | ${server.engineComment} |`,
    `| Version | \`${server.engineVersion}\` |`,
    `| Character set | \`${server.characterSet}\` |`,
    `| Database collation | \`${server.collationName}\` |`,
    `| Server time zone | \`${server.serverTimeZone}\` |`,
    `| Base tables | ${summary.tableCount} |`,
    `| Exact total rows | ${summary.exactTotalRows.toLocaleString("en-US")} |`,
    `| Estimated data + index size | ${mb(summary.estimatedDatabaseBytes)} MB |`,
    `| Views | ${summary.viewCount} |`,
    `| Triggers | ${summary.triggerCount} |`,
    `| Stored routines | ${summary.routineCount} |`,
    `| Scheduled database events | ${summary.scheduledEventCount} |`,
    "",
    "## Exact Per-Table Counts",
    "",
    "| Table | Exact rows | Estimated size (MB) | Collation |",
    "|---|---:|---:|---|",
    ...tables.map((table) =>
      `| \`${table.tableName}\` | ${table.exactRows.toLocaleString("en-US")} | ${mb(table.totalBytes)} | \`${table.tableCollation}\` |`
    ),
    "",
    "## SQL Mode",
    "",
    `\`${server.sqlMode}\``,
    "",
    "> Size values come from `information_schema`; row counts are exact `COUNT(*)` results at the time of export.",
    "",
  ].join("\n");

  await writeFile(path.join(outputDir, "database-inventory.md"), markdown, "utf8");
  console.log(JSON.stringify({
    outputDir,
    tableCount: summary.tableCount,
    exactTotalRows: summary.exactTotalRows,
    estimatedDatabaseSizeMb: Number(mb(summary.estimatedDatabaseBytes)),
    viewCount: summary.viewCount,
    triggerCount: summary.triggerCount,
    routineCount: summary.routineCount,
    scheduledEventCount: summary.scheduledEventCount,
  }, null, 2));
} finally {
  await connection.end();
}
