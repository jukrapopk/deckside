import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { STATUSES } from "@/lib/statuses";

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  platform: text("platform"),
  // The same list drives the UI and the parser, so it lives in one place.
  // Drizzle only uses this for typing; SQLite gets a plain TEXT column.
  status: text("status", { enum: STATUSES })
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
