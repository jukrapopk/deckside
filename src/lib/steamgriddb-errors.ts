import { SteamGridDbError } from "./steamgriddb";

/** Shared failure copy, so the cover picker and the key check agree. */
export const STEAMGRIDDB_KEY_REJECTED = "SteamGridDB rejected that key.";
export const STEAMGRIDDB_RATE_LIMITED =
  "SteamGridDB is rate limiting. Try again in a minute.";
export const STEAMGRIDDB_UNREACHABLE =
  "Could not reach SteamGridDB. Check the connection and retry.";

export type SteamGridDbFailure =
  | "auth"
  | "rate-limit"
  | "not-found"
  | "unreachable";

/** Map an API failure to the one thing the caller can act on. */
export function classifySteamGridDbError(
  error: unknown,
): SteamGridDbFailure {
  if (error instanceof SteamGridDbError) {
    if (error.status === 401 || error.status === 403) return "auth";
    if (error.status === 429) return "rate-limit";
    if (error.status === 404) return "not-found";
  }

  return "unreachable";
}
