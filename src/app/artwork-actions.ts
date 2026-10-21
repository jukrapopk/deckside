"use server";

import type {
  CoverOption,
  CoverSearchResult,
} from "@/lib/cover-search";
import {
  STEAMGRIDDB_QUERY_MAX_LENGTH,
  STEAMGRIDDB_QUERY_MIN_LENGTH,
} from "@/lib/limits";
import { steamGridDbKey } from "@/lib/settings";
import {
  listGrids,
  searchGames,
  type SteamGridDbGrid,
} from "@/lib/steamgriddb";
import {
  classifySteamGridDbError,
  STEAMGRIDDB_KEY_REJECTED,
  STEAMGRIDDB_RATE_LIMITED,
  STEAMGRIDDB_UNREACHABLE,
} from "@/lib/steamgriddb-errors";

export type { CoverOption, CoverSearchResult } from "@/lib/cover-search";

/**
 * One search from the edit dialog: title lookup, then the portrait art for the
 * first match. Two requests per press, and the button is explicit rather than
 * live-typed, so a slow connection cannot spend the rate limit on keystrokes.
 */
export async function findCovers(query: string): Promise<CoverSearchResult> {
  const term = query.trim().slice(0, STEAMGRIDDB_QUERY_MAX_LENGTH);

  if (term.length < STEAMGRIDDB_QUERY_MIN_LENGTH) {
    return { ok: false, message: "Type at least two characters." };
  }

  const key = steamGridDbKey();
  if (!key) {
    return {
      ok: false,
      message: "Add a SteamGridDB key in Settings, then search again.",
    };
  }

  try {
    const games = await searchGames(key, term);
    if (games.length === 0) {
      return { ok: false, message: `No game on SteamGridDB matched "${term}".` };
    }

    const game = games[0];
    const grids = await listGrids(key, game.id);
    if (grids.length === 0) {
      return {
        ok: false,
        message: `No portrait art for ${game.name}. Try a different title.`,
      };
    }

    return {
      ok: true,
      game: game.name,
      options: grids.slice(0, 12).map(toOption),
    };
  } catch (error) {
    switch (classifySteamGridDbError(error)) {
      case "auth":
        return {
          ok: false,
          message: `${STEAMGRIDDB_KEY_REJECTED} Check it in Settings.`,
        };
      case "rate-limit":
        return { ok: false, message: STEAMGRIDDB_RATE_LIMITED };
      case "not-found":
        return { ok: false, message: `No art found for "${term}".` };
      default:
        return { ok: false, message: STEAMGRIDDB_UNREACHABLE };
    }
  }
}

function toOption(grid: SteamGridDbGrid): CoverOption {
  return {
    id: grid.id,
    url: grid.url,
    thumb: typeof grid.thumb === "string" ? grid.thumb : grid.url,
  };
}
