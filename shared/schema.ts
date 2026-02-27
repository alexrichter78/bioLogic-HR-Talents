import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const berufTemplates = pgTable("beruf_templates", {
  id: serial("id").primaryKey(),
  berufName: text("beruf_name").notNull(),
  fuehrung: text("fuehrung").notNull().default("Keine"),
  taetigkeiten: jsonb("taetigkeiten"),
  generatedAt: timestamp("generated_at"),
  source: text("source").default("openai"),
}, (table) => [
  uniqueIndex("beruf_fuehrung_idx").on(table.berufName, table.fuehrung),
]);

export type BerufTemplate = typeof berufTemplates.$inferSelect;
