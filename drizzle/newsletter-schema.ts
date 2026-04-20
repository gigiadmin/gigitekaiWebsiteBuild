/**
 * Newsletter Schema Addition
 * Add this to drizzle/schema.ts
 */

import { mysqlTable, varchar, timestamp, int, boolean } from "drizzle-orm/mysql-core";

export const newsletter = mysqlTable("newsletter", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  isActive: boolean("is_active").default(true).notNull(),
  verificationToken: varchar("verification_token", { length: 255 }),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Newsletter = typeof newsletter.$inferSelect;
export type NewletterInsert = typeof newsletter.$inferInsert;
