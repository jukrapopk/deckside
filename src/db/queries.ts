import { and, asc, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "./index";
import {
  gamePlatforms,
  games,
  platforms,
  type Game,
  type Platform,
} from "./schema";
import { STATUSES, type StatusCounts } from "@/lib/statuses";

export type GameFilters = {
  q?: string;
};

/** A game plus the platforms it was filed under, as ids the client can resolve. */
export type GameWithPlatforms = Game & { platformIds: number[] };

export function parseFilters(params: { q?: string }): GameFilters {
  const q = params.q?.trim();

  return {
    q: q || undefined,
  };
}

/**
 * Called from both the bar and the grid, so the request reads the list once.
 */
export const listPlatforms = cache((): Platform[] => {
  return getDb().select().from(platforms).orderBy(asc(platforms.name)).all();
});

export function listGames({ q }: GameFilters = {}): GameWithPlatforms[] {
  const filters: SQL[] = [];

  if (q) {
    // `%` and `_` keep their LIKE wildcard meaning here. Fine for a personal
    // library; add an ESCAPE clause if that ever becomes a problem.
    const pattern = `%${q}%`;

    // Platform names are no longer on the game row, so a title match is not
    // the only kind of match. Resolve the name hits first; the set is tiny.
    const byPlatform = getDb()
      .select({ gameId: gamePlatforms.gameId })
      .from(gamePlatforms)
      .innerJoin(platforms, eq(platforms.id, gamePlatforms.platformId))
      .where(like(platforms.name, pattern))
      .all()
      .map((row) => row.gameId);

    const match = byPlatform.length
      ? or(like(games.title, pattern), inArray(games.id, byPlatform))
      : like(games.title, pattern);
    if (match) filters.push(match);
  }

  const rows = getDb()
    .select()
    .from(games)
    .where(filters.length ? and(...filters) : undefined)
    // The client sorts for display; this only keeps the server's first paint
    // deterministic. `created_at` has second granularity, so break ties by
    // insertion order.
    .orderBy(desc(games.createdAt), desc(games.id))
    .all();

  if (rows.length === 0) return [];

  const links = getDb()
    .select()
    .from(gamePlatforms)
    .where(
      inArray(
        gamePlatforms.gameId,
        rows.map((row) => row.id),
      ),
    )
    .all();

  const byGame = new Map<number, number[]>();
  for (const link of links) {
    const list = byGame.get(link.gameId) ?? [];
    list.push(link.platformId);
    byGame.set(link.gameId, list);
  }

  return rows.map((row) => ({
    ...row,
    platformIds: byGame.get(row.id) ?? [],
  }));
}

/** Both suspense boundaries ask for this; one scan per request is enough. */
export const countByStatus = cache((): StatusCounts => {
  const rows = getDb()
    .select({ status: games.status })
    .from(games)
    .all();

  const counts = { all: rows.length } as StatusCounts;
  for (const status of STATUSES) counts[status] = 0;
  for (const row of rows) counts[row.status] += 1;

  return counts;
});
