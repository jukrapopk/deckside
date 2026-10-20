/**
 * The SteamGridDB v2 API, reduced to the two calls the cover picker needs.
 *
 * Only this module talks HTTP; the server action above it turns the failures
 * into sentences a person can act on. Responses are parsed defensively — the
 * picker still works if the API gains fields, and an unexpected shape reads as
 * "no results" rather than a crash.
 */

const API = "https://www.steamgriddb.com/api/v2";

export type SteamGridDbGame = {
  id: number;
  name: string;
};

export type SteamGridDbGrid = {
  id: number;
  url: string;
  thumb?: string;
};

export class SteamGridDbError extends Error {
  constructor(readonly status: number) {
    super(`SteamGridDB responded with ${status}`);
    this.name = "SteamGridDbError";
  }
}

async function request<T>(path: string, key: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    // Results change as the community uploads art, and a pickup only runs on
    // demand; caching a stale list would be worse than a second request.
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) throw new SteamGridDbError(response.status);

  const body = (await response.json()) as { success?: boolean; data?: T };
  if (!body.success || body.data === undefined) {
    throw new SteamGridDbError(response.status);
  }

  return body.data;
}

/** Best-effort title lookup. The first result is the one we show art for. */
export async function searchGames(
  key: string,
  term: string,
): Promise<SteamGridDbGame[]> {
  const data = await request<SteamGridDbGame[]>(
    `/search/autocomplete/${encodeURIComponent(term)}`,
    key,
  );

  if (!Array.isArray(data)) return [];

  return data.filter(
    (game): game is SteamGridDbGame =>
      typeof game?.id === "number" && typeof game?.name === "string",
  );
}

/**
 * Portrait grids only: the card is 2:3, and a 920x430 hero cropped into that
 * box would cut the art rather than fit it.
 */
export async function listGrids(
  key: string,
  gameId: number,
): Promise<SteamGridDbGrid[]> {
  const params = new URLSearchParams({
    dimensions: "600x900",
    types: "static",
    nsfw: "false",
    humor: "false",
  });

  const data = await request<SteamGridDbGrid[]>(
    `/grids/game/${gameId}?${params.toString()}`,
    key,
  );

  if (!Array.isArray(data)) return [];

  return data.filter(
    (grid): grid is SteamGridDbGrid =>
      typeof grid?.id === "number" && typeof grid?.url === "string",
  );
}
