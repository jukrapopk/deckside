import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { gamePlatforms, games, platforms } from "@/db/schema";

// Safe to run on a fresh database: migrations are idempotent.
runMigrations();

const platformSeed = [
  { name: "PC", icon: "monitor" },
  { name: "Switch", icon: "handheld" },
  { name: "PS4", icon: "console" },
] as const;

const seed = [
  {
    title: "Hollow Knight",
    platform: "PC",
    status: "completed",
    rating: 5,
    progress: 100,
  },
  {
    title: "Celeste",
    platform: "Switch",
    status: "completed",
    rating: 5,
    progress: 100,
  },
  { title: "Hades", platform: "PC", status: "playing", rating: 4, progress: 40 },
  {
    title: "Disco Elysium",
    platform: "PC",
    status: "up-next",
    rating: null,
    progress: 0,
  },
  {
    title: "Outer Wilds",
    platform: "PC",
    status: "backlog",
    rating: null,
    progress: 0,
  },
  {
    title: "Bloodborne",
    platform: "PS4",
    status: "dropped",
    rating: 3,
    progress: 60,
  },
] as const;

const db = getDb();

db.transaction((tx) => {
  // The cascade takes the game/platform links with the games.
  tx.delete(games).run();

  const platformIds = new Map<string, number>();
  for (const platform of platformSeed) {
    const existing = tx
      .select()
      .from(platforms)
      .where(eq(platforms.name, platform.name))
      .get();

    const id =
      existing?.id ??
      Number(tx.insert(platforms).values(platform).run().lastInsertRowid);
    platformIds.set(platform.name, id);
  }

  for (const { platform, ...values } of seed) {
    const id = Number(tx.insert(games).values(values).run().lastInsertRowid);

    tx.insert(gamePlatforms)
      .values({ gameId: id, platformId: platformIds.get(platform)! })
      .run();
  }
});

console.log(`Seeded ${seed.length} games.`);
