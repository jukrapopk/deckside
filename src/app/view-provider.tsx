"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isStatus, STATUSES, type Status } from "@/lib/statuses";
import {
  DEFAULT_DIRECTION,
  DEFAULT_FAVOURITES_FIRST,
  DEFAULT_GROUP,
  DEFAULT_SORT,
  isDirection,
  isGroup,
  isSort,
  SORT_DIRECTIONS,
  type Direction,
  type Group,
  type Sort,
} from "@/lib/view";

const STORAGE_KEY = "game-library:view";

type View = {
  /** Selected statuses; all of them is the unfiltered view. */
  statuses: Status[];
  sort: Sort;
  direction: Direction;
  group: Group;
  favouritesFirst: boolean;
};

type ViewControls = View & {
  /** False until the saved view has been read from localStorage. */
  ready: boolean;
  setAllStatuses: () => void;
  clearStatuses: () => void;
  toggleStatus: (status: Status) => void;
  setSort: (sort: Sort) => void;
  invertDirection: () => void;
  setGroup: (group: Group) => void;
  setFavouritesFirst: (favouritesFirst: boolean) => void;
  resetView: () => void;
};

const ViewContext = createContext<ViewControls | null>(null);

function defaults(): View {
  return {
    statuses: [...STATUSES],
    sort: DEFAULT_SORT,
    direction: DEFAULT_DIRECTION,
    group: DEFAULT_GROUP,
    favouritesFirst: DEFAULT_FAVOURITES_FIRST,
  };
}

/**
 * The filter used to hold one status. Read both shapes so a stored view keeps
 * working after the upgrade; a missing or unusable list means every status.
 */
function readStatuses(value: unknown, legacy: unknown): Status[] {
  if (Array.isArray(value)) {
    const selected = new Set(
      value.filter(
        (item): item is Status => typeof item === "string" && isStatus(item),
      ),
    );

    // An empty list is a real state (everything unchecked). An array with no
    // valid values is corrupt and falls back to every status.
    if (selected.size === 0 && value.length > 0) return [...STATUSES];

    return STATUSES.filter((status) => selected.has(status));
  }

  if (typeof legacy === "string" && isStatus(legacy)) return [legacy];

  return [...STATUSES];
}

/** Anything can be in localStorage; keep only values this version knows. */
function readStored(): View {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return defaults();

    const stored = parsed as Record<string, unknown>;

    return {
      statuses: readStatuses(stored.statuses, stored.status),
      sort:
        typeof stored.sort === "string" && isSort(stored.sort)
          ? stored.sort
          : DEFAULT_SORT,
      direction:
        typeof stored.direction === "string" && isDirection(stored.direction)
          ? stored.direction
          : DEFAULT_DIRECTION,
      group:
        typeof stored.group === "string" && isGroup(stored.group)
          ? stored.group
          : DEFAULT_GROUP,
      favouritesFirst: stored.favouritesFirst === true,
    };
  } catch {
    return defaults();
  }
}

/**
 * Filter, sort, grouping, and the favourites strip live here rather than in
 * the URL: they are how this browser likes to look at the library, not part of
 * a shared address. Storage is read after mount so the first client render
 * matches the server; the grid waits on `ready` so the default view never
 * flashes before the saved one.
 */
export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // The server has no storage, so the saved view can only be read after
    // mount; the first render must match the server's output until then.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    // The first write would otherwise store the pre-hydration defaults.
    if (!hydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(view));
    } catch {
      // A full or blocked store only costs the memory, not the session.
    }
  }, [view, hydrated]);

  const value = useMemo<ViewControls>(
    () => ({
      ...view,
      ready: hydrated,
      setAllStatuses: () =>
        setView((current) => ({ ...current, statuses: [...STATUSES] })),
      clearStatuses: () =>
        setView((current) => ({ ...current, statuses: [] })),
      toggleStatus: (status) =>
        setView((current) => {
          const selected = new Set(current.statuses);
          if (selected.has(status)) {
            selected.delete(status);
          } else {
            selected.add(status);
          }

          return {
            ...current,
            statuses: STATUSES.filter((option) => selected.has(option)),
          };
        }),
      // Each field starts in the direction it reads best in; the button then
      // flips it.
      setSort: (sort) =>
        setView((current) => ({
          ...current,
          sort,
          direction: SORT_DIRECTIONS[sort],
        })),
      invertDirection: () =>
        setView((current) => ({
          ...current,
          direction: current.direction === "asc" ? "desc" : "asc",
        })),
      setGroup: (group) => setView((current) => ({ ...current, group })),
      setFavouritesFirst: (favouritesFirst) =>
        setView((current) => ({ ...current, favouritesFirst })),
      resetView: () => setView(defaults()),
    }),
    [view, hydrated],
  );

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export function useView(): ViewControls {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useView must be used inside ViewProvider");
  }
  return context;
}
