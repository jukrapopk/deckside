import { desc } from "drizzle-orm";
import { getDb } from "./index";
import { games } from "./schema";

export function listGames() {
  return getDb()
    .select()
    .from(games)
    // `created_at` has second granularity, so break ties by insertion order.
    .orderBy(desc(games.createdAt), desc(games.id))
    .all();
}
