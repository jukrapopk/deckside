import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { STATUSES } from "@/lib/statuses";

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  // The same list drives the UI and the parser, so it lives in one place.
  // Drizzle only uses this for typing; SQLite gets a plain TEXT column.
  status: text("status", { enum: STATUSES })
    .notNull()
    .default("backlog"),
  rating: integer("rating"),
  // A single flag rather than a rating: favourites are a shortlist, not a score.
  favourite: integer("favourite", { mode: "boolean" })
    .notNull()
    .default(false),
  // Whole percent, 0–100. Zero means "not tracked" on a tile, not an empty bar.
  progress: integer("progress").notNull().default(0),
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

/** The platform list is a setting: games pick from it rather than typing. */
export const platforms = sqliteTable("platforms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  // A key into PLATFORM_ICONS, not a component name; the card only shows this.
  icon: text("icon").notNull().default("console"),
});

export type Platform = typeof platforms.$inferSelect;

/** A game can sit on several platforms, so the link is its own row. */
export const gamePlatforms = sqliteTable(
  "game_platforms",
  {
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platformId: integer("platform_id")
      .notNull()
      .references(() => platforms.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.gameId, table.platformId] }),
    index("game_platforms_platform_idx").on(table.platformId),
  ],
);

/** Small key/value store for local preferences, such as the SteamGridDB key. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
