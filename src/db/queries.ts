import { and, desc, like, or, type SQL } from "drizzle-orm";
import { getDb } from "./index";
import { games } from "./schema";
import { STATUSES, type StatusCounts } from "@/lib/statuses";

export type GameFilters = {
  q?: string;
};

export function parseFilters(params: { q?: string }): GameFilters {
  const q = params.q?.trim();

  return {
    q: q || undefined,
  };
}

export function listGames({ q }: GameFilters = {}) {
  const filters: SQL[] = [];

  if (q) {
    // `%` and `_` keep their LIKE wildcard meaning here. Fine for a personal
    // library; add an ESCAPE clause if that ever becomes a problem.
    const pattern = `%${q}%`;
    const match = or(like(games.title, pattern), like(games.platform, pattern));
    if (match) filters.push(match);
  }

  return getDb()
    .select()
    .from(games)
    .where(filters.length ? and(...filters) : undefined)
    // The client sorts for display; this only keeps the server's first paint
    // deterministic. `created_at` has second granularity, so break ties by
    // insertion order.
    .orderBy(desc(games.createdAt), desc(games.id))
    .all();
}

export function countByStatus(): StatusCounts {
  const rows = getDb()
    .select({ status: games.status })
    .from(games)
    .all();

  const counts = { all: rows.length } as StatusCounts;
  for (const status of STATUSES) counts[status] = 0;
  for (const row of rows) counts[row.status] += 1;

  return counts;
}
