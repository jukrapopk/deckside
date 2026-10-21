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
import { uploadDemoCover } from "./cover-upload";
import { DEMO_POSTERS } from "./seed";
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

/**
 * A browser can refuse the write — a cover is a data URL, so the 5 MB quota is
 * reachable. Persisting first means a refused change is not shown as saved.
 */
const STORAGE_ERROR =
  "This browser could not save the library. Storage may be full; remove a cover or a game and try again.";

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
    if (!saveDemoStore(next)) return false;
    storeRef.current = next;
    setStore(next);
    return true;
  }, []);

  const addGame = useCallback(
    async (formData: FormData) => {
      const fields = readGameFields(formData, { allowDemoCover: true });
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

      const saved = commit({
        ...current,
        games: [...current.games, game],
        nextGameId: current.nextGameId + 1,
      });

      return saved ? { ok: true } : { error: STORAGE_ERROR };
    },
    [commit],
  );

  const updateGame = useCallback(
    async (id: number, formData: FormData) => {
      const fields = readGameFields(formData, { allowDemoCover: true });
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

      const saved = commit({
        ...current,
        games: current.games.map((item) => (item.id === id ? game : item)),
      });

      return saved ? { ok: true } : { error: STORAGE_ERROR };
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

      const saved = commit({
        ...current,
        platforms: [...current.platforms, platform],
        nextPlatformId: current.nextPlatformId + 1,
      });

      return saved ? { ok: true } : { error: STORAGE_ERROR };
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

      const saved = commit({
        ...current,
        platforms: current.platforms.map((platform) =>
          platform.id === id
            ? { ...platform, name: fields.name, icon: fields.icon }
            : platform,
        ),
      });

      return saved ? { ok: true } : { error: STORAGE_ERROR };
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
      coverPresets: DEMO_POSTERS,
      coverUpload: uploadDemoCover,
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
