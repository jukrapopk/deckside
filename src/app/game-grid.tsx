import { GameController, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { GameCard } from "./game-card";
import type { GameFilters } from "@/db/queries";
import type { Game } from "@/db/schema";
import type { Status } from "@/lib/statuses";

type GameGridProps = {
  games: Game[];
  total: number;
  filters: GameFilters;
};

export function GameGrid({ games, total, filters }: GameGridProps) {
  if (total === 0) {
    return <EmptyLibrary />;
  }

  if (games.length === 0) {
    return <NoMatches filters={filters} />;
  }

  const filtered = Boolean(filters.q || filters.status);

  return (
    <div className="flex flex-col">
      <p className="border-b border-line px-5 py-3 text-base text-muted">
        {filtered
          ? `${games.length} of ${total} games`
          : `${total} ${total === 1 ? "game" : "games"}`}
      </p>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {games.map((game, index) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={game.title}
            platform={game.platform}
            status={game.status as Status}
            rating={game.rating}
            coverUrl={game.coverUrl}
            eager={index < 6}
          />
        ))}
      </ul>
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
      <GameController size={40} weight="bold" aria-hidden="true" className="text-muted" />
      <h2 className="text-xl font-semibold">Your library is empty</h2>
      <p className="max-w-[45ch] text-base text-muted">
        Use the add button in the top bar to record the first thing you own, are
        playing, or have finished.
      </p>
    </div>
  );
}

function NoMatches({ filters }: { filters: GameFilters }) {
  const description = filters.q
    ? `Nothing matches "${filters.q}".`
    : "Nothing matches this filter.";

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
      <MagnifyingGlass size={40} weight="bold" aria-hidden="true" className="text-muted" />
      <h2 className="text-xl font-semibold">No games found</h2>
      <p className="max-w-[45ch] text-base text-muted">{description}</p>
      <Link
        href="/"
        className="mt-2 border border-line px-5 py-3 text-base font-medium hover:border-accent"
      >
        Clear filters
      </Link>
    </div>
  );
}
