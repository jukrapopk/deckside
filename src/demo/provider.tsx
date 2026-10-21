"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  LibraryProvider,
  type LibraryActions,
} from "@/app/library-context";
import { readGameFields } from "@/lib/game-fields";
import { matchesQuery, type GameWithPlatforms } from "@/lib/library";
import { readPlatformFields } from "@/lib/platform-fields";
import type { Platform } from "@/lib/platforms";
import { countStatuses, type StatusCounts } from "@/lib/statuses";
import {
  createDemoStore,
  loadDemoStore,
  saveDemoStore,
  type DemoStore,
} from "./store";

function knownPlatformIds(store: DemoStore, ids: number[]): number[] {
  const known = new Set(store.platforms.map((platform) => platform.id));
  return ids.filter((id) => known.has(id));
}

/** A complete client-side library backed by one versioned localStorage key. */
export function DemoLibraryProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<DemoStore | null>(null);
  const storeRef = useRef<DemoStore | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loaded = loadDemoStore();
    storeRef.current = loaded;
    // Storage can only be read after mount; the first render must match SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(loaded);
  }, []);

  const commit = useCallback((next: DemoStore) => {
    storeRef.current = next;
    setStore(next);
    saveDemoStore(next);
  }, []);

  const addGame = useCallback(
    async (formData: FormData) => {
      const fields = readGameFields(formData);
      if (!fields.ok) return { error: fields.error };

      const current = storeRef.current;
      if (!current) return { error: "Demo data is still loading." };

      const now = new Date();
      const game: GameWithPlatforms = {
        id: current.nextGameId,
        ...fields.values,
        platformIds: knownPlatformIds(current, fields.platformIds),
        notes: null,
        createdAt: now,
        updatedAt: now,
      };

      commit({
        ...current,
        games: [...current.games, game],
        nextGameId: current.nextGameId + 1,
      });
      return { ok: true };
    },
    [commit],
  );

  const updateGame = useCallback(
    async (id: number, formData: FormData) => {
      const fields = readGameFields(formData);
      if (!fields.ok) return { error: fields.error };

      const current = storeRef.current;
      if (!current) return { error: "Demo data is still loading." };

      const existing = current.games.find((game) => game.id === id);
      if (!existing) return { error: "Unknown game." };

      const game: GameWithPlatforms = {
        ...existing,
        ...fields.values,
        platformIds: knownPlatformIds(current, fields.platformIds),
        updatedAt: new Date(),
      };

      commit({
        ...current,
        games: current.games.map((item) => (item.id === id ? game : item)),
      });
      return { ok: true };
    },
    [commit],
  );

  const deleteGame = useCallback(
    async (id: number) => {
      const current = storeRef.current;
      if (!current) return;

      commit({
        ...current,
        games: current.games.filter((game) => game.id !== id),
      });
    },
    [commit],
  );

  const addPlatform = useCallback(
    async (formData: FormData) => {
      const fields = readPlatformFields(formData);
      if (!fields.ok) return { error: fields.error };

      const current = storeRef.current;
      if (!current) return { error: "Demo data is still loading." };

      const name = fields.name.toLocaleLowerCase();
      if (
        current.platforms.some(
          (platform) => platform.name.toLocaleLowerCase() === name,
        )
      ) {
        return { error: "That platform is already in the list." };
      }

      const platform: Platform = {
        id: current.nextPlatformId,
        name: fields.name,
        icon: fields.icon,
      };

      commit({
        ...current,
        platforms: [...current.platforms, platform],
        nextPlatformId: current.nextPlatformId + 1,
      });
      return { ok: true };
    },
    [commit],
  );

  const updatePlatform = useCallback(
    async (id: number, formData: FormData) => {
      const fields = readPlatformFields(formData);
      if (!fields.ok) return { error: fields.error };

      const current = storeRef.current;
      if (!current) return { error: "Demo data is still loading." };

      const existing = current.platforms.find((platform) => platform.id === id);
      if (!existing) return { error: "Unknown platform." };

      const name = fields.name.toLocaleLowerCase();
      if (
        current.platforms.some(
          (platform) =>
            platform.id !== id && platform.name.toLocaleLowerCase() === name,
        )
      ) {
        return { error: "That platform is already in the list." };
      }

      commit({
        ...current,
        platforms: current.platforms.map((platform) =>
          platform.id === id
            ? { ...platform, name: fields.name, icon: fields.icon }
            : platform,
        ),
      });
      return { ok: true };
    },
    [commit],
  );

  const deletePlatform = useCallback(
    async (id: number) => {
      const current = storeRef.current;
      if (!current) return;

      commit({
        ...current,
        platforms: current.platforms.filter((platform) => platform.id !== id),
        games: current.games.map((game) => ({
          ...game,
          platformIds: game.platformIds.filter(
            (platformId) => platformId !== id,
          ),
        })),
      });
    },
    [commit],
  );

  const resetDemo = useCallback(() => {
    commit(createDemoStore());
    setQuery("");
  }, [commit]);

  const platforms = useMemo(
    () =>
      store
        ? [...store.platforms].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          )
        : [],
    [store],
  );

  const games = useMemo(() => {
    if (!store) return [];
    if (!query.trim()) return store.games;
    return store.games.filter((game) => matchesQuery(game, query, platforms));
  }, [store, query, platforms]);

  const counts = useMemo<StatusCounts>(
    () => countStatuses(store?.games ?? []),
    [store],
  );

  const actions = useMemo<LibraryActions>(
    () => ({
      addGame,
      updateGame,
      deleteGame,
      addPlatform,
      updatePlatform,
      deletePlatform,
    }),
    [
      addGame,
      updateGame,
      deleteGame,
      addPlatform,
      updatePlatform,
      deletePlatform,
    ],
  );

  const value = useMemo(
    () => ({
      games,
      platforms,
      counts,
      query,
      setQuery,
      pending: false,
      ready: store !== null,
      actions,
      hasSteamGridDbKey: false,
      isDemo: true,
      resetDemo,
    }),
    [
      games,
      platforms,
      counts,
      query,
      actions,
      resetDemo,
      store,
    ],
  );

  return <LibraryProvider value={value}>{children}</LibraryProvider>;
}
