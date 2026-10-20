import type { GameWithPlatforms } from "@/db/queries";
import type { Platform } from "@/db/schema";
import { indexPlatforms, platformsOf } from "@/lib/platforms";
import { STATUSES, STATUS_LABELS } from "@/lib/statuses";

/*
  View preferences (which games show, and in what order) are a client concern:
  they are remembered per browser, not per library. Keeping the vocabulary and
  the ordering here means the dialog, the grid, and the stored value all agree
  on the same set of options.
*/

export const SORTS = [
  { value: "title", label: "Title" },
  { value: "added", label: "Date added" },
  { value: "rating", label: "Rating" },
  { value: "status", label: "Status" },
] as const;

export type Sort = (typeof SORTS)[number]["value"];

export const DIRECTIONS = ["asc", "desc"] as const;

export type Direction = (typeof DIRECTIONS)[number];

/** Where each field starts when it is chosen; the button flips it from here. */
export const SORT_DIRECTIONS: Record<Sort, Direction> = {
  title: "asc",
  added: "desc",
  rating: "desc",
  status: "asc",
};

export const GROUPS = [
  { value: "none", label: "None" },
  { value: "status", label: "Status" },
  { value: "platform", label: "Platform" },
] as const;

export type Group = (typeof GROUPS)[number]["value"];

/** Alphabetical is the default: it is the only order that needs no upkeep. */
export const DEFAULT_SORT: Sort = "title";
export const DEFAULT_DIRECTION: Direction = "asc";
export const DEFAULT_GROUP: Group = "none";

export function isSort(value: string): value is Sort {
  return SORTS.some((option) => option.value === value);
}

export function isDirection(value: string): value is Direction {
  return DIRECTIONS.some((direction) => direction === value);
}

export function isGroup(value: string): value is Group {
  return GROUPS.some((option) => option.value === value);
}

/** Case-insensitive title order, with the id as a stable tie-break. */
function byTitle(a: GameWithPlatforms, b: GameWithPlatforms): number {
  return (
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) ||
    a.id - b.id
  );
}

/** One comparator per field, written in its natural ascending order. */
const COMPARATORS: Record<
  Sort,
  (a: GameWithPlatforms, b: GameWithPlatforms) => number
> = {
  title: byTitle,
  // `created_at` has second granularity, so break ties by insertion order.
  added: (a, b) =>
    a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id,
  // Unrated games sort below rated ones instead of counting as zero stars.
  rating: (a, b) => (a.rating ?? -1) - (b.rating ?? -1) || byTitle(a, b),
  status: (a, b) =>
    STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || byTitle(a, b),
};

export function sortGames(
  games: GameWithPlatforms[],
  sort: Sort,
  direction: Direction,
): GameWithPlatforms[] {
  const order = direction === "asc" ? 1 : -1;
  const compare = COMPARATORS[sort];

  return [...games].sort((a, b) => order * compare(a, b));
}

export type GameGroup = {
  key: string;
  label: string;
  games: GameWithPlatforms[];
};

/**
 * A game can sit on several platforms, so the platform grouping shows it in
 * each one. Games with none get their own section rather than disappearing.
 */
export function groupGames(
  games: GameWithPlatforms[],
  group: Group,
  platforms: Platform[],
): GameGroup[] {
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

  const byId = indexPlatforms(platforms);
  const sections = new Map<string, GameGroup>();

  for (const game of games) {
    const own = platformsOf(game, byId);

    if (own.length === 0) {
      const section = sections.get("no-platform") ?? {
        key: "no-platform",
        label: "No platform",
        games: [],
      };
      section.games.push(game);
      sections.set("no-platform", section);
      continue;
    }

    for (const platform of own) {
      const key = String(platform.id);
      const section = sections.get(key) ?? {
        key,
        label: platform.name,
        games: [],
      };
      section.games.push(game);
      sections.set(key, section);
    }
  }

  return [...sections.values()].sort((a, b) => {
    if (a.key === "no-platform") return 1;
    if (b.key === "no-platform") return -1;
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
}
