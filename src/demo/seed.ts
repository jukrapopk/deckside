import type { CoverPreset } from "@/lib/cover-search";
import type { GameWithPlatforms } from "@/lib/library";
import type { Platform } from "@/lib/platforms";
import type { Status } from "@/lib/statuses";

/** Bump when the seed shape or content changes; stored older demos reseed. */
export const DEMO_SEED_VERSION = 3;

/** Original abstract placeholders, not third-party cover art. */
const POSTER_URLS = {
  orbit: "/demo/posters/poster-01.png",
  ridgeline: "/demo/posters/poster-02.png",
  ember: "/demo/posters/poster-03.png",
  oval: "/demo/posters/poster-04.png",
  ring: "/demo/posters/poster-05.png",
  arch: "/demo/posters/poster-06.png",
  tide: "/demo/posters/poster-07.png",
  signal: "/demo/posters/poster-08.png",
} as const;

export const DEMO_POSTERS: CoverPreset[] = [
  { url: POSTER_URLS.orbit, label: "Orbit" },
  { url: POSTER_URLS.ridgeline, label: "Ridgeline" },
  { url: POSTER_URLS.ember, label: "Ember" },
  { url: POSTER_URLS.oval, label: "Oval" },
  { url: POSTER_URLS.ring, label: "Ring" },
  { url: POSTER_URLS.arch, label: "Arch" },
  { url: POSTER_URLS.tide, label: "Tide" },
  { url: POSTER_URLS.signal, label: "Signal" },
];

const PLATFORMS: Platform[] = [
  { id: 1, name: "PC", icon: "monitor" },
  { id: 2, name: "Switch", icon: "handheld" },
  { id: 3, name: "PS5", icon: "console" },
  { id: 4, name: "Xbox", icon: "console" },
  { id: 5, name: "Steam Deck", icon: "handheld" },
];

const POSTERS: Record<number, string> = {
  1: POSTER_URLS.ring,
  2: POSTER_URLS.ridgeline,
  3: POSTER_URLS.ember,
  4: POSTER_URLS.oval,
  5: POSTER_URLS.orbit,
  6: POSTER_URLS.arch,
  7: POSTER_URLS.tide,
  8: POSTER_URLS.signal,
};

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
    coverUrl: POSTERS[id] ?? null,
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
