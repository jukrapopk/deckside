import type { Platform } from "@/lib/platforms";
import type { Status } from "@/lib/statuses";

/**
 * The fields every library backend must provide. The SQLite rows and the
 * localStorage demo both satisfy this shape, so presentation code never needs
 * to know which one it is reading.
 */
export type LibraryGame = {
  id: number;
  title: string;
  status: Status;
  rating: number | null;
  favourite: boolean;
  progress: number;
  coverUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** A game plus the platforms it was filed under, as ids the client can resolve. */
export type GameWithPlatforms = LibraryGame & { platformIds: number[] };

/** Search matches the title or one of the game's platform names. */
export function matchesQuery(
  game: GameWithPlatforms,
  query: string,
  platforms: Platform[],
): boolean {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return true;

  if (game.title.toLocaleLowerCase().includes(term)) return true;

  const names = game.platformIds
    .map((id) => platforms.find((platform) => platform.id === id)?.name ?? "")
    .join(" ")
    .toLocaleLowerCase();

  return names.includes(term);
}
