/**
 * Validation bounds shared by the server actions and the forms that feed them.
 * Keep a client `maxLength` and its server check on the same value.
 */
export const TITLE_MAX_LENGTH = 200;
export const PLATFORM_NAME_MAX_LENGTH = 40;
export const COVER_URL_MAX_LENGTH = 500;
export const API_KEY_MAX_LENGTH = 200;

/** Local cover uploads: the cap both the picker and the action enforce. */
export const COVER_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;
export const COVER_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
export const COVER_UPLOAD_ACCEPT = COVER_UPLOAD_TYPES.join(",");

export const PROGRESS_MIN = 0;
export const PROGRESS_MAX = 100;

/** SteamGridDB autocomplete bounds, shared by the picker and its action. */
export const STEAMGRIDDB_QUERY_MIN_LENGTH = 2;
export const STEAMGRIDDB_QUERY_MAX_LENGTH = 100;
