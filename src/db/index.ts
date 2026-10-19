import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export const databasePath = resolve(
  /*turbopackIgnore: true*/
  process.env.DATABASE_PATH ?? "./data/game-library.db",
);

type Db = BetterSQLite3Database<typeof schema>;

// Next.js dev mode re-evaluates modules on every hot reload, so keep a single
// connection on the global object to avoid leaking file handles.
const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: Db;
};

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

// Connect lazily. `next build` imports this module while prerendering, and an
// eager connection would create the database file as a build side effect.
export function getDb(): Db {
  if (!globalForDb.db) {
    globalForDb.sqlite ??= createConnection();
    globalForDb.db = drizzle(globalForDb.sqlite, { schema });
  }
  return globalForDb.db;
}
