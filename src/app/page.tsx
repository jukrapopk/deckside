import { Suspense } from "react";
import { io } from "next/cache";
import { AddGameForm } from "@/app/add-game-form";
import { GameRow } from "@/app/game-row";
import { listGames } from "@/db/queries";

async function GameList() {
  // better-sqlite3 is synchronous, so it would otherwise be read during
  // prerendering. `io()` keeps the query out of the static shell.
  await io();
  const games = listGames();

  if (games.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No games yet. Add your first one above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {games.map((game) => (
        <GameRow
          key={game.id}
          id={game.id}
          title={game.title}
          platform={game.platform}
          status={game.status}
          rating={game.rating}
        />
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Game Library</h1>
        <p className="text-sm text-zinc-500">
          Track what you own, what you are playing, and what you have finished.
        </p>
      </header>

      <AddGameForm />

      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <GameList />
      </Suspense>
    </main>
  );
}
