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

export type CoverSearch = (query: string) => Promise<CoverSearchResult>;
