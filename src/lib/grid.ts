/*
  Geometry shared by the library grid and its loading skeleton.

  The skeleton only does its job while it matches the real grid. These live in
  one place so a change to the column counts or the tile shape cannot leave the
  placeholder a different shape from the content it stands in for.
*/

/** Column counts for the library grid. */
export const GRID_COLS =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

/** One tile: the card, and the skeleton that replaces it while loading. */
export const GRID_TILE = "aspect-2/3 border-b border-r border-line bg-surface-2";
