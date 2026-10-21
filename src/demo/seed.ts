import type { GameWithPlatforms } from "@/lib/library";
import type { Platform } from "@/lib/platforms";
import type { Status } from "@/lib/statuses";

/** Bump when the seed shape or content changes; stored older demos reseed. */
export const DEMO_SEED_VERSION = 1;

const PLATFORMS: Platform[] = [
  { id: 1, name: "PC", icon: "monitor" },
  { id: 2, name: "Switch", icon: "handheld" },
  { id: 3, name: "PS5", icon: "console" },
  { id: 4, name: "Xbox", icon: "console" },
  { id: 5, name: "Steam Deck", icon: "handheld" },
];

function game(
  id: number,
  title: string,
  platformIds: number[],
  status: Status,
  rating: number | null,
  progress: number,
  favourite = false,
): GameWithPlatforms {
  const createdAt = new Date(Date.UTC(2026, 0, id, 12));

  return {
    id,
    title,
    platformIds,
    status,
    rating,
    progress,
    favourite,
    coverUrl: null,
    notes: null,
    createdAt,
    updatedAt: createdAt,
  };
}

const GAMES: GameWithPlatforms[] = [
  game(1, "Hollow Knight", [1, 2], "completed", 5, 100, true),
  game(2, "Celeste", [1, 2], "completed", 5, 100),
  game(3, "Hades", [1, 2], "playing", 4, 40, true),
  game(4, "Disco Elysium", [1], "up-next", null, 0),
  game(5, "Outer Wilds", [1], "backlog", null, 0),
  game(6, "Bloodborne", [3], "dropped", 3, 60),
  game(7, "Baldur's Gate 3", [1, 3], "playing", 5, 25, true),
  game(8, "Return of the Obra Dinn", [1, 2], "completed", 4, 100),
  game(9, "Signalis", [1, 5], "backlog", null, 0),
  game(10, "Animal Well", [1, 2], "up-next", null, 0),
  game(11, "Balatro", [1, 2, 5], "playing", 5, 30),
  game(12, "Pentiment", [1, 4], "completed", 4, 100),
];

export function seedDemoData() {
  return {
    version: DEMO_SEED_VERSION,
    platforms: PLATFORMS.map((platform) => ({ ...platform })),
    games: GAMES.map((game) => ({ ...game, platformIds: [...game.platformIds] })),
    nextGameId: Math.max(...GAMES.map((game) => game.id)) + 1,
    nextPlatformId: Math.max(...PLATFORMS.map((platform) => platform.id)) + 1,
  };
}
