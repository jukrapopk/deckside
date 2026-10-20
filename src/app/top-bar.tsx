"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { AddGameDialog } from "./game-dialog";
import { FilterDialog } from "./filter-dialog";
import { SettingsDialog } from "./settings-dialog";
import type { StatusCounts } from "@/lib/statuses";

type TopBarProps = {
  q: string;
  counts: StatusCounts;
  hasSteamGridDbKey: boolean;
};

export function TopBar({ q, counts, hasSteamGridDbKey }: TopBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  function go(nextQ: string) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    const query = params.toString();
    startTransition(() => router.push(query ? `/?${query}` : "/"));
  }

  const typed = () => searchRef.current?.value ?? q;

  return (
    <header
      className={`sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur transition-opacity motion-reduce:transition-none ${
        isPending ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-stretch">
        <form
          className="flex min-w-0 flex-1 items-center"
          onSubmit={(event) => {
            event.preventDefault();
            go(typed());
          }}
        >
          <label htmlFor="library-search" className="sr-only">
            Search games
          </label>
          <Search
            size={20}
            strokeWidth={2.25}
            aria-hidden="true"
            className="pointer-events-none ml-5 shrink-0 text-muted"
          />
          <input
            id="library-search"
            ref={searchRef}
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search title or platform"
            className="h-16 w-full min-w-0 border-0 bg-transparent px-4 text-lg text-ink outline-none placeholder:text-muted"
          />
          {q && (
            <button
              type="button"
              onClick={() => go("")}
              aria-label="Clear search"
              className="mr-2 flex size-9 shrink-0 items-center justify-center text-muted hover:text-ink"
            >
              <X size={18} strokeWidth={2.25} aria-hidden="true" />
            </button>
          )}
        </form>

        <FilterDialog counts={counts} />

        <SettingsDialog hasKey={hasSteamGridDbKey} />

        <AddGameDialog />
      </div>
    </header>
  );
}
