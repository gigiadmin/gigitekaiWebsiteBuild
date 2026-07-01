import { getDb } from "./server/db.ts";

const db = await getDb();
if (db) {
  await db.delete(await import("./drizzle/schema.ts").then(m => m.settings)).where(
    (await import("drizzle-orm").then(m => m.eq))(
      (await import("./drizzle/schema.ts").then(m => m.settings.key)),
      "ai_news_last_run_date"
    )
  );
  console.log("Reset successful");
  process.exit(0);
} else {
  console.error("DB not available");
  process.exit(1);
}
