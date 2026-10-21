"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CoverPreset, CoverSearch } from "@/lib/cover-search";
import type { CoverUpload } from "@/lib/cover-upload";
import type { FormState } from "@/lib/form-state";
import type { GameWithPlatforms } from "@/lib/library";
import type { Platform } from "@/lib/platforms";
import type { StatusCounts } from "@/lib/statuses";

export type LibraryActions = {
  addGame: (formData: FormData) => Promise<FormState>;
  updateGame: (id: number, formData: FormData) => Promise<FormState>;
  deleteGame: (id: number) => Promise<void>;
  addPlatform: (formData: FormData) => Promise<FormState>;
  updatePlatform: (id: number, formData: FormData) => Promise<FormState>;
  deletePlatform: (id: number) => Promise<void>;
};

/** The key is write-only from the browser; only these operations are exposed. */
export type KeyActions = {
  saveKey: (key: string) => Promise<FormState>;
  checkKey: (key?: string) => Promise<FormState>;
};

export type LibraryContextValue = {
  games: GameWithPlatforms[];
  platforms: Platform[];
  counts: StatusCounts;
  query: string;
  setQuery: (query: string) => void;
  /** Server navigation is pending; the demo is always immediate. */
  pending: boolean;
  /** False until a client-only store has loaded. Server data is always ready. */
  ready: boolean;
  actions: LibraryActions;
  coverSearch?: CoverSearch;
  /** Bundled posters shown when network cover search is unavailable. */
  coverPresets?: CoverPreset[];
  /** Set when the file has to be encoded in the browser (the demo). */
  coverUpload?: CoverUpload;
  keyActions?: KeyActions;
  hasSteamGridDbKey: boolean;
  isDemo: boolean;
  resetDemo?: () => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({
  value,
  children,
}: {
  value: LibraryContextValue;
  children: ReactNode;
}) {
  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) {
    throw new Error("useLibrary must be used inside LibraryProvider");
  }
  return value;
}

export function usePlatforms(): Platform[] {
  return useLibrary().platforms;
}
