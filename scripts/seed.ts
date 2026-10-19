import { getDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { games } from "@/db/schema";

// Safe to run on a fresh database: migrations are idempotent.
runMigrations();

const seed = [
  { title: "Hollow Knight", platform: "PC", status: "completed", rating: 9 },
  { title: "Celeste", platform: "Switch", status: "completed", rating: 10 },
  { title: "Hades", platform: "PC", status: "playing", rating: 9 },
  { title: "Outer Wilds", platform: "PC", status: "backlog", rating: null },
  { title: "Bloodborne", platform: "PS4", status: "dropped", rating: 7 },
] as const;

const db = getDb();
db.delete(games).run();
db.insert(games)
  .values(seed.map((game) => ({ ...game })))
  .run();

console.log(`Seeded ${seed.length} games.`);
