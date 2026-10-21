import { Suspense } from "react";
import { io } from "next/cache";
import {
  countByStatus,
  listGames,
  listPlatforms,
  parseFilters,
} from "@/db/queries";
import { hasSteamGridDbKey } from "@/lib/settings";
import { SITE_NAME } from "@/lib/site";
import { GameGrid } from "./game-grid";
import { ServerLibraryProvider } from "./server-library-provider";
import { GameGridSkeleton, TopBarSkeleton } from "./skeletons";
import { TopBar } from "./top-bar";
import { ViewProvider } from "./view-provider";

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
  });
}

async function Library({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readFilters(searchParams);

  return (
    <ServerLibraryProvider
      games={listGames(filters)}
      platforms={listPlatforms()}
      counts={countByStatus()}
      q={filters.q ?? ""}
      hasKey={hasSteamGridDbKey()}
    >
      <TopBar />
      <main className="flex-1">
        <GameGrid />
      </main>
    </ServerLibraryProvider>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <ViewProvider>
      <div className="flex min-h-[100dvh] flex-col">
        <h1 className="sr-only">{SITE_NAME}</h1>

        <Suspense
          fallback={
            <>
              <TopBarSkeleton />
              <main className="flex-1">
                <GameGridSkeleton />
              </main>
            </>
          }
        >
          <Library searchParams={searchParams} />
        </Suspense>
      </div>
    </ViewProvider>
  );
}
