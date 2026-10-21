import type { GameWithPlatforms } from "@/lib/library";
import { indexPlatforms, platformsOf, type Platform } from "@/lib/platforms";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/statuses";

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
  { value: "progress", label: "Progress" },
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
  progress: "desc",
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
/** Off by default: the duplicated top strip is a deliberate way to browse. */
export const DEFAULT_FAVOURITES_FIRST = false;

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
  progress: (a, b) => a.progress - b.progress || byTitle(a, b),
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
  /** Set when this section stands for a status, so the header can badge it. */
  status?: Status;
  /** Set when this section stands for a platform, so the header can icon it. */
  platform?: Platform;
  /** Set on the synthetic Favourites section at the top. */
  favourite?: boolean;
};

/**
 * A game can sit on several platforms, so the platform grouping shows it in
 * each one. Games with none get their own section rather than disappearing.
 * Each section carries the status or platform it stands for, so the grid
 * header can show the same mark as the tiles. With `favouritesFirst`, a
 * Favourites section repeats them at the top; they keep their own place too.
 */
export function groupGames(
  games: GameWithPlatforms[],
  group: Group,
  platforms: Platform[],
  favouritesFirst = false,
): GameGroup[] {
  const sections = groupSections(games, group, platforms);

  if (!favouritesFirst) return sections;

  const favourites = games.filter((game) => game.favourite);
  if (favourites.length === 0) return sections;

  return [
    {
      key: "favourites",
      label: "Favourites",
      favourite: true,
      games: favourites,
    },
    ...sections,
  ];
}

function groupSections(
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
      status,
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
        platform,
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
