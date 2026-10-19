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
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        {filtered
          ? `${games.length} of ${total} games`
          : `${total} ${total === 1 ? "game" : "games"}`}
      </p>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {games.map((game, index) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={game.title}
            platform={game.platform}
            status={game.status as Status}
            rating={game.rating}
            coverUrl={game.coverUrl}
            eager={index < 5}
          />
        ))}
      </ul>
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-line px-6 py-20 text-center">
      <GameController size={32} weight="bold" aria-hidden="true" className="text-muted" />
      <h2 className="text-lg font-semibold">Your library is empty</h2>
      <p className="max-w-[40ch] text-sm text-muted">
        Use the Add game button above to record the first thing you own, are
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
    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-line px-6 py-20 text-center">
      <MagnifyingGlass size={32} weight="bold" aria-hidden="true" className="text-muted" />
      <h2 className="text-lg font-semibold">No games found</h2>
      <p className="max-w-[40ch] text-sm text-muted">{description}</p>
      <Link
        href="/"
        className="mt-1 rounded-[10px] border border-line px-4 py-2 text-sm font-medium hover:border-accent"
      >
        Clear filters
      </Link>
    </div>
  );
}
