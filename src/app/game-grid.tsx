import { Gamepad2, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GameCard } from "./game-card";
import type { GameFilters } from "@/db/queries";
import type { Game } from "@/db/schema";
import { GRID_COLS } from "@/lib/grid";

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

  return (
    <ul className={GRID_COLS}>
      {games.map((game, index) => (
        <GameCard key={game.id} game={game} eager={index < 6} />
      ))}
    </ul>
  );
}

/** Icon, heading, explanation, and an optional action. Shared empty state. */
function MessageState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-[45ch] text-base text-muted">{description}</p>
      {action}
    </div>
  );
}

function EmptyLibrary() {
  return (
    <MessageState
      title="Your library is empty"
      description="Use the add button in the top bar to record the first thing you own, want to play next, or have finished."
      icon={
        <Gamepad2
          size={40}
          strokeWidth={1.75}
          aria-hidden="true"
          className="text-muted"
        />
      }
    />
  );
}

function NoMatches({ filters }: { filters: GameFilters }) {
  return (
    <MessageState
      title="No games found"
      description={
        filters.q
          ? `Nothing matches "${filters.q}".`
          : "Nothing matches this filter."
      }
      icon={
        <Search
          size={40}
          strokeWidth={1.75}
          aria-hidden="true"
          className="text-muted"
        />
      }
      action={
        <Link
          href="/"
          className="mt-2 border border-line px-5 py-3 text-base font-medium hover:border-accent"
        >
          Clear filters
        </Link>
      }
    />
  );
}
