"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { AddGameDialog } from "./game-dialog";
import { useLibrary } from "./library-context";
import { ViewDialog } from "./view-dialog";
import { SettingsDialog } from "./settings-dialog";

/** Long enough to finish a word, short enough that the grid feels live. */
const SEARCH_DEBOUNCE_MS = 200;

export function TopBar() {
  const { query, setQuery, pending, counts } = useLibrary();
  const searchRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // What the URL (or demo filter) should hold, so a debounced echo of an
  // in-flight search is skipped even before the next render arrives.
  const committedQ = useRef(query);
  // The query the field was last synced to, so we can tell uncommitted typing
  // from a navigation that changed the query.
  const syncedQ = useRef(query);

  useEffect(() => {
    committedQ.current = query;
  }, [query]);

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

    if (!typing && input.value !== query) input.value = query;
    syncedQ.current = query;
  }, [query]);

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  function go(nextQ: string) {
    const trimmed = nextQ.trim();
    if (trimmed === committedQ.current) return;
    committedQ.current = trimmed;
    setQuery(trimmed);
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
        pending ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-stretch">
        <form
          role="search"
          className="flex min-w-0 flex-1 items-center"
          onSubmit={(event) => {
            event.preventDefault();
            flushSearch(searchRef.current?.value ?? query);
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
              defaultValue={query}
              onChange={(event) => queueSearch(event.target.value)}
              placeholder="Search"
              className={`h-16 w-full min-w-0 border-0 bg-transparent pl-14 text-lg text-ink outline-none placeholder:text-muted max-sm:pl-12 ${
                query ? "pr-12" : "pr-4"
              }`}
            />
            {query && (
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

        <SettingsDialog />

        <AddGameDialog />
      </div>
    </header>
  );
}
