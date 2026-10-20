"use server";

import { steamGridDbKey } from "@/lib/settings";
import {
  listGrids,
  searchGames,
  SteamGridDbError,
  type SteamGridDbGrid,
} from "@/lib/steamgriddb";

export type CoverOption = {
  id: number;
  /** Full-size grid, saved to the game. */
  url: string;
  /** Small preview, so the picker does not download twelve full covers. */
  thumb: string;
};

export type CoverSearchResult =
  | { ok: true; game: string; options: CoverOption[] }
  | { ok: false; message: string };

/**
 * One search from the edit dialog: title lookup, then the portrait art for the
 * first match. Two requests per press, and the button is explicit rather than
 * live-typed, so a slow connection cannot spend the rate limit on keystrokes.
 */
export async function findCovers(query: string): Promise<CoverSearchResult> {
  const term = query.trim().slice(0, 100);

  if (term.length < 2) {
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
    if (error instanceof SteamGridDbError) {
      if (error.status === 401 || error.status === 403) {
        return {
          ok: false,
          message: "SteamGridDB rejected that key. Check it in Settings.",
        };
      }
      if (error.status === 429) {
        return {
          ok: false,
          message: "SteamGridDB is rate limiting. Try again in a minute.",
        };
      }
      if (error.status === 404) {
        return { ok: false, message: `No art found for "${term}".` };
      }
    }

    return {
      ok: false,
      message: "Could not reach SteamGridDB. Check the connection and retry.",
    };
  }
}

function toOption(grid: SteamGridDbGrid): CoverOption {
  return {
    id: grid.id,
    url: grid.url,
    thumb: typeof grid.thumb === "string" ? grid.thumb : grid.url,
  };
}
