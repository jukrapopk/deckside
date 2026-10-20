import type { GameWithPlatforms } from "@/db/queries";
import type { Platform } from "@/db/schema";
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
function byTitle(a: GameWithPlatforms, b: GameWithPlatforms): number {
  return (
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) ||
    a.id - b.id
  );
}

export function sortGames(
  games: GameWithPlatforms[],
  sort: Sort,
): GameWithPlatforms[] {
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

  const byId = new Map(platforms.map((platform) => [platform.id, platform]));
  const sections = new Map<string, GameGroup>();

  for (const game of games) {
    const own = game.platformIds
      .map((id) => byId.get(id))
      .filter((platform): platform is Platform => Boolean(platform));

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
