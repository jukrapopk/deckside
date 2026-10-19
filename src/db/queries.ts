import { desc } from "drizzle-orm";
import { db } from "./index";
import { games } from "./schema";

export function listGames() {
  return db.select().from(games).orderBy(desc(games.createdAt)).all();
}
