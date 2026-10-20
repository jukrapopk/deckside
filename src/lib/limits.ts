/**
 * Validation bounds shared by the server actions and the forms that feed them.
 * Keep a client `maxLength` and its server check on the same value.
 */
export const TITLE_MAX_LENGTH = 200;
export const PLATFORM_NAME_MAX_LENGTH = 40;
export const COVER_URL_MAX_LENGTH = 500;
export const API_KEY_MAX_LENGTH = 200;

export const PROGRESS_MIN = 0;
export const PROGRESS_MAX = 100;

/** SteamGridDB autocomplete bounds, shared by the picker and its action. */
export const STEAMGRIDDB_QUERY_MIN_LENGTH = 2;
export const STEAMGRIDDB_QUERY_MAX_LENGTH = 100;
