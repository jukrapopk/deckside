import type { Game } from "@/db/schema";
import { STATUSES, STATUS_LABELS } from "@/lib/statuses";

/*
  View preferences (which games show, and in what order) are a client concern:
  they are remembered per browser, not per library. Keeping the vocabulary and
  the ordering here means the dialog, the grid, and the stored value all agree
  on the same set of options.
*/

export const SORTS = [
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "added", label: "Recently added" },
  { value: "rating", label: "Highest rated" },
  { value: "status", label: "Status" },
] as const;

export type Sort = (typeof SORTS)[number]["value"];

export const GROUPS = [
  { value: "none", label: "None" },
  { value: "status", label: "Status" },
  { value: "platform", label: "Platform" },
] as const;

export type Group = (typeof GROUPS)[number]["value"];

/** Alphabetical is the default: it is the only order that needs no upkeep. */
export const DEFAULT_SORT: Sort = "title-asc";
export const DEFAULT_GROUP: Group = "none";

export function isSort(value: string): value is Sort {
  return SORTS.some((option) => option.value === value);
}

export function isGroup(value: string): value is Group {
  return GROUPS.some((option) => option.value === value);
}

/** Case-insensitive title order, with the id as a stable tie-break. */
function byTitle(a: Game, b: Game): number {
  return (
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) ||
    a.id - b.id
  );
}

export function sortGames(games: Game[], sort: Sort): Game[] {
  const sorted = [...games];

  switch (sort) {
    case "title-desc":
      sorted.sort((a, b) => byTitle(b, a));
      break;
    case "added":
      // `created_at` has second granularity, so break ties by insertion order.
      sorted.sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id,
      );
      break;
    case "rating":
      // Unrated games sit at the bottom rather than counting as zero stars.
      sorted.sort(
        (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || byTitle(a, b),
      );
      break;
    case "status":
      sorted.sort(
        (a, b) =>
          STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) ||
          byTitle(a, b),
      );
      break;
    default:
      sorted.sort(byTitle);
  }

  return sorted;
}

export type GameGroup = {
  key: string;
  label: string;
  games: Game[];
};

export function groupGames(games: Game[], group: Group): GameGroup[] {
  if (group === "none") {
    return [{ key: "all", label: "", games }];
  }

  if (group === "status") {
    // The status order is the library's own order, not the alphabet's.
    return STATUSES.map((status) => ({
      key: status,
      label: STATUS_LABELS[status],
      games: games.filter((game) => game.status === status),
    })).filter((section) => section.games.length > 0);
  }

  const byPlatform = new Map<string, Game[]>();
  for (const game of games) {
    const platform = game.platform?.trim() || "";
    const list = byPlatform.get(platform) ?? [];
    list.push(game);
    byPlatform.set(platform, list);
  }

  return [...byPlatform.entries()]
    .sort(([a], [b]) => {
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    })
    .map(([platform, list]) => ({
      key: platform || "no-platform",
      label: platform || "No platform",
      games: list,
    }));
}
