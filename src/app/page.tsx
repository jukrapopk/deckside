import { Suspense } from "react";
import { connection } from "next/server";
import { listGames } from "@/db/queries";

async function GameList() {
  // The data is request-time, so opt out of prerendering instead of
  // baking a stale list into the static shell.
  await connection();
  const games = listGames();

  if (games.length === 0) {
    return <p className="text-zinc-500">No games yet.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {games.map((game) => (
        <li key={game.id} className="flex items-center gap-4 py-3">
          <span className="flex-1 font-medium">{game.title}</span>
          {game.platform && (
            <span className="text-sm text-zinc-500">{game.platform}</span>
          )}
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {game.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Game Library</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading games…</p>}>
        <GameList />
      </Suspense>
    </main>
  );
}
