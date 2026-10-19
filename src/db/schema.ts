import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  platform: text("platform"),
  status: text("status", {
    enum: ["backlog", "playing", "completed", "dropped"],
  })
    .notNull()
    .default("backlog"),
  rating: integer("rating"),
  coverUrl: text("cover_url"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
