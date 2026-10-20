"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isStatus, type Status } from "@/lib/statuses";
import {
  DEFAULT_DIRECTION,
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
  status?: Status;
  sort: Sort;
  direction: Direction;
  group: Group;
};

type ViewControls = View & {
  setStatus: (status?: Status) => void;
  setSort: (sort: Sort) => void;
  invertDirection: () => void;
  setGroup: (group: Group) => void;
  resetView: () => void;
};

const ViewContext = createContext<ViewControls | null>(null);

function defaults(): View {
  return {
    sort: DEFAULT_SORT,
    direction: DEFAULT_DIRECTION,
    group: DEFAULT_GROUP,
  };
}

/** Anything can be in localStorage; keep only values this version knows. */
function readStored(): View {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();

    const parsed = JSON.parse(raw) as Partial<View> | null;
    return {
      status:
        typeof parsed?.status === "string" && isStatus(parsed.status)
          ? parsed.status
          : undefined,
      sort:
        typeof parsed?.sort === "string" && isSort(parsed.sort)
          ? parsed.sort
          : DEFAULT_SORT,
      direction:
        typeof parsed?.direction === "string" && isDirection(parsed.direction)
          ? parsed.direction
          : DEFAULT_DIRECTION,
      group:
        typeof parsed?.group === "string" && isGroup(parsed.group)
          ? parsed.group
          : DEFAULT_GROUP,
    };
  } catch {
    return defaults();
  }
}

/**
 * Filter, sort, and grouping live here rather than in the URL: they are how
 * this browser likes to look at the library, not part of a shared address.
 * Storage is read after mount so the server-rendered order stays the default
 * and hydration has nothing to disagree about.
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
      setStatus: (status) => setView((current) => ({ ...current, status })),
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
      resetView: () => setView(defaults()),
    }),
    [view],
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
