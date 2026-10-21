"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";
import {
  addGame,
  addPlatform,
  checkSteamGridDbKey,
  deleteGame,
  deletePlatform,
  saveSteamGridDbKey,
  updateGame,
  updatePlatform,
} from "@/app/actions";
import { findCovers } from "@/app/artwork-actions";
import {
  LibraryProvider,
  type KeyActions,
  type LibraryActions,
} from "./library-context";
import type { GameWithPlatforms } from "@/lib/library";
import type { Platform } from "@/lib/platforms";
import type { StatusCounts } from "@/lib/statuses";

const ACTIONS: LibraryActions = {
  addGame,
  updateGame,
  deleteGame,
  addPlatform,
  updatePlatform,
  deletePlatform,
};

const KEY_ACTIONS: KeyActions = {
  saveKey: saveSteamGridDbKey,
  checkKey: checkSteamGridDbKey,
};

/** Wires the shared library UI to SQLite-backed server actions. */
export function ServerLibraryProvider({
  games,
  platforms,
  counts,
  q,
  hasKey,
  children,
}: {
  games: GameWithPlatforms[];
  platforms: Platform[];
  counts: StatusCounts;
  q: string;
  hasKey: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // The URL is the source of truth for search. The field is uncontrolled, so
  // typing stays responsive while the server round trip is in flight.
  const query = q;

  const setQuery = useCallback(
    (nextQuery: string) => {
      const params = new URLSearchParams();
      const trimmed = nextQuery.trim();
      if (trimmed) params.set("q", trimmed);
      const search = params.toString();

      startTransition(() => {
        router.push(search ? `/?${search}` : "/");
      });
    },
    [router],
  );

  const value = useMemo(
    () => ({
      games,
      platforms,
      counts,
      query,
      setQuery,
      pending,
      ready: true,
      actions: ACTIONS,
      coverSearch: findCovers,
      keyActions: KEY_ACTIONS,
      hasSteamGridDbKey: hasKey,
      isDemo: false,
    }),
    [games, platforms, counts, query, setQuery, pending, hasKey],
  );

  return <LibraryProvider value={value}>{children}</LibraryProvider>;
}
