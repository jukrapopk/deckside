import { resolve } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";

const migrationsFolder = resolve(
  /*turbopackIgnore: true*/
  process.env.MIGRATIONS_PATH ?? "./drizzle",
);

export function runMigrations() {
  migrate(db, { migrationsFolder });
}
