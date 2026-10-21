import type { GameWithPlatforms } from "@/lib/library";
import { RATING_MAX, RATING_MIN } from "@/lib/rating";
import { isStatus } from "@/lib/statuses";
import type { Platform } from "@/lib/platforms";
import { DEMO_SEED_VERSION, seedDemoData } from "./seed";

const STORAGE_KEY = "deckside:demo:library";

export type DemoStore = {
  version: number;
  platforms: Platform[];
  games: GameWithPlatforms[];
  nextGameId: number;
  nextPlatformId: number;
};

type StoredGame = Omit<GameWithPlatforms, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type StoredStore = Omit<DemoStore, "games"> & {
  games: StoredGame[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readPlatform(value: unknown): Platform | null {
  if (!isRecord(value)) return null;

  const { id, name, icon } = value;
  if (
    typeof id !== "number" ||
    !Number.isInteger(id) ||
    id <= 0 ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof icon !== "string"
  ) {
    return null;
  }

  return { id, name, icon };
}

function readGame(value: unknown): GameWithPlatforms | null {
  if (!isRecord(value)) return null;

  const {
    id,
    title,
    status,
    rating,
    favourite,
    progress,
    coverUrl,
    notes,
    platformIds,
    createdAt,
    updatedAt,
  } = value;

  if (
    typeof id !== "number" ||
    !Number.isInteger(id) ||
    id <= 0 ||
    typeof title !== "string" ||
    !title.trim() ||
    typeof status !== "string" ||
    !isStatus(status) ||
    (rating !== null &&
      (typeof rating !== "number" ||
        !Number.isInteger(rating) ||
        rating < RATING_MIN ||
        rating > RATING_MAX)) ||
    typeof favourite !== "boolean" ||
    typeof progress !== "number" ||
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100 ||
    (coverUrl !== null && typeof coverUrl !== "string") ||
    (notes !== null && typeof notes !== "string") ||
    !Array.isArray(platformIds) ||
    !platformIds.every(
      (platformId) =>
        typeof platformId === "number" &&
        Number.isInteger(platformId) &&
        platformId > 0,
    )
  ) {
    return null;
  }

  const created = readDate(createdAt);
  const updated = readDate(updatedAt);
  if (!created || !updated) return null;

  return {
    id,
    title,
    status,
    rating,
    favourite,
    progress,
    coverUrl,
    notes,
    platformIds: [...new Set(platformIds)],
    createdAt: created,
    updatedAt: updated,
  };
}

function parseStore(value: unknown): DemoStore | null {
  if (!isRecord(value) || typeof value.version !== "number") return null;
  if (!Array.isArray(value.platforms) || !Array.isArray(value.games)) {
    return null;
  }

  const platforms = value.platforms.map(readPlatform);
  const games = value.games.map(readGame);
  if (platforms.some((platform) => platform === null)) return null;
  if (games.some((game) => game === null)) return null;
  if (
    new Set(platforms.map((platform) => platform!.id)).size !== platforms.length
  ) {
    return null;
  }
  if (new Set(games.map((game) => game!.id)).size !== games.length) return null;

  const storedNextGameId =
    typeof value.nextGameId === "number" &&
    Number.isInteger(value.nextGameId) &&
    value.nextGameId > 0
      ? value.nextGameId
      : 0;
  const storedNextPlatformId =
    typeof value.nextPlatformId === "number" &&
    Number.isInteger(value.nextPlatformId) &&
    value.nextPlatformId > 0
      ? value.nextPlatformId
      : 0;

  const nextGameId = Math.max(
    storedNextGameId,
    Math.max(0, ...games.map((game) => game!.id)) + 1,
  );
  const nextPlatformId = Math.max(
    storedNextPlatformId,
    Math.max(0, ...platforms.map((platform) => platform!.id)) + 1,
  );

  if (value.version !== DEMO_SEED_VERSION) return null;

  return {
    version: DEMO_SEED_VERSION,
    platforms: platforms as Platform[],
    games: games as GameWithPlatforms[],
    nextGameId,
    nextPlatformId,
  };
}

export function createDemoStore(): DemoStore {
  return seedDemoData();
}

/** Returns false when the write was refused, typically because storage is full. */
export function saveDemoStore(store: DemoStore): boolean {
  const stored: StoredStore = {
    ...store,
    games: store.games.map(({ createdAt, updatedAt, ...game }) => ({
      ...game,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    })),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch {
    // Uploaded covers are data URLs, so this is reachable in real use. The
    // caller decides whether to keep the change in memory or report it.
    return false;
  }
}

export function loadDemoStore(): DemoStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseStore(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    // Corrupt storage falls through to a fresh seed.
  }

  const store = createDemoStore();
  saveDemoStore(store);
  return store;
}
