import { Suspense } from "react";
import { io } from "next/cache";
import { countByStatus, listGames, parseFilters } from "@/db/queries";
import { hasSteamGridDbKey } from "@/lib/settings";
import { GameGrid } from "./game-grid";
import { GameGridSkeleton, TopBarSkeleton } from "./skeletons";
import { TopBar } from "./top-bar";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** better-sqlite3 is synchronous, so `io()` keeps these reads out of the static shell. */
async function readFilters(searchParams: SearchParams) {
  await io();
  const params = await searchParams;
  return parseFilters({
    q: firstValue(params.q),
    status: firstValue(params.status),
  });
}

async function LibraryBar({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readFilters(searchParams);

  return (
    <TopBar
      q={filters.q ?? ""}
      status={filters.status}
      counts={countByStatus()}
      hasSteamGridDbKey={hasSteamGridDbKey()}
    />
  );
}

async function LibraryGrid({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readFilters(searchParams);

  return (
    <GameGrid
      games={listGames(filters)}
      total={countByStatus().all}
      filters={filters}
    />
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Suspense fallback={<TopBarSkeleton />}>
        <LibraryBar searchParams={searchParams} />
      </Suspense>

      <main className="flex-1">
        <Suspense fallback={<GameGridSkeleton />}>
          <LibraryGrid searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
