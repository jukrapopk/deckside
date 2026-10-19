/*
  Geometry shared by the library grid and its loading skeleton.

  The skeleton only does its job while it matches the real grid: the columns,
  the gutter, and the outer inset all live here, so the placeholder cannot end
  up a different shape from the content it stands in for. A tile keeps the same
  ratio and surface for the same reason.
*/

/** Columns, gutter, and inset for the library grid. */
export const GRID_COLS =
  "grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

/** One tile: the card, and the skeleton that replaces it while loading. */
export const GRID_TILE = "aspect-2/3 bg-surface-2";
