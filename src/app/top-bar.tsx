"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { AddGameDialog } from "./game-dialog";
import { ViewDialog } from "./view-dialog";
import { SettingsDialog } from "./settings-dialog";
import type { StatusCounts } from "@/lib/statuses";

/** Long enough to finish a word, short enough that the grid feels live. */
const SEARCH_DEBOUNCE_MS = 200;

type TopBarProps = {
  q: string;
  counts: StatusCounts;
  hasSteamGridDbKey: boolean;
};

export function TopBar({ q, counts, hasSteamGridDbKey }: TopBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // What the URL should hold, so a debounced echo of an in-flight search is
  // skipped even before the next render arrives.
  const committedQ = useRef(q);
  // The query the field was last synced to, so we can tell uncommitted typing
  // from a navigation that changed the URL.
  const syncedQ = useRef(q);

  useEffect(() => {
    committedQ.current = q;
  }, [q]);

  // The field is uncontrolled so typing never fights the router. When the
  // query changes from somewhere else — the empty state's clear link, or
  // back/forward — pull the new value in, unless the field holds typing that
  // has not been committed yet.
  useEffect(() => {
    const input = searchRef.current;
    if (!input) return;

    const typing =
      document.activeElement === input &&
      input.value.trim() !== syncedQ.current;

    if (!typing && input.value !== q) input.value = q;
    syncedQ.current = q;
  }, [q]);

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  function go(nextQ: string) {
    const trimmed = nextQ.trim();
    if (trimmed === committedQ.current) return;
    committedQ.current = trimmed;

    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    const query = params.toString();
    startTransition(() => router.push(query ? `/?${query}` : "/"));
  }

  function cancelSearch() {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = null;
  }

  function queueSearch(nextQ: string) {
    cancelSearch();
    debounce.current = setTimeout(() => {
      debounce.current = null;
      go(nextQ);
    }, SEARCH_DEBOUNCE_MS);
  }

  function flushSearch(nextQ: string) {
    cancelSearch();
    go(nextQ);
  }

  return (
    <header
      className={`sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur transition-opacity motion-reduce:transition-none ${
        isPending ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-stretch">
        <form
          role="search"
          className="flex min-w-0 flex-1 items-center"
          onSubmit={(event) => {
            event.preventDefault();
            flushSearch(searchRef.current?.value ?? q);
          }}
        >
          <label htmlFor="library-search" className="sr-only">
            Search games
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              size={20}
              strokeWidth={2.25}
              aria-hidden="true"
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="library-search"
              ref={searchRef}
              name="q"
              type="text"
              inputMode="search"
              enterKeyHint="search"
              defaultValue={q}
              onChange={(event) => queueSearch(event.target.value)}
              placeholder="Search"
              className={`h-16 w-full min-w-0 border-0 bg-transparent pl-14 text-lg text-ink outline-none placeholder:text-muted max-sm:pl-12 ${
                q ? "pr-12" : "pr-4"
              }`}
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  const input = searchRef.current;
                  if (input) {
                    input.value = "";
                    input.focus();
                  }
                  flushSearch("");
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center text-muted hover:text-ink"
              >
                <X size={18} strokeWidth={2.25} aria-hidden="true" />
              </button>
            )}
          </div>
        </form>

        <ViewDialog counts={counts} />

        <SettingsDialog hasKey={hasSteamGridDbKey} />

        <AddGameDialog />
      </div>
    </header>
  );
}
