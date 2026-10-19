import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export const databasePath = resolve(
  /*turbopackIgnore: true*/
  process.env.DATABASE_PATH ?? "./data/game-library.db",
);

function createConnection() {
  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  // WAL lets readers continue while a write is in flight.
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  // Wait instead of failing when another connection holds the write lock.
  sqlite.pragma("busy_timeout = 5000");

  return sqlite;
}

// Next.js dev mode re-evaluates modules on every hot reload, so keep a single
// connection on the global object to avoid leaking file handles.
const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
};

export const sqlite = globalForDb.sqlite ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
