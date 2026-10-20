"use client";

import { Gamepad2, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GameCard } from "./game-card";
import { usePlatforms } from "./platforms-provider";
import { useView } from "./view-provider";
import { HeartGlyph } from "@/components/heart";
import { PlatformIcon } from "@/components/platform-icon";
import { StatusBadge } from "@/components/status-badge";
import type { GameWithPlatforms } from "@/db/queries";
import { GRID_COLS } from "@/lib/grid";
import { groupGames, sortGames } from "@/lib/view";

type GameGridProps = {
  games: GameWithPlatforms[];
  /** Library-wide count, before the search narrowed `games`. */
  total: number;
  q: string;
};

const ACTION =
  "mt-2 border border-line px-5 py-3 text-base font-medium hover:border-accent";

export function GameGrid({ games, total, q }: GameGridProps) {
  const { status, sort, direction, group, favouritesFirst, setStatus } =
    useView();
  const platforms = usePlatforms();

  if (total === 0) return <EmptyLibrary />;
  if (games.length === 0) {
    return (
      <NoMatches
        description={`Nothing matches "${q}".`}
        action={
          <Link href="/" className={ACTION}>
            Clear search
          </Link>
        }
      />
    );
  }

  const visible = status
    ? games.filter((game) => game.status === status)
    : games;

  if (visible.length === 0) {
    return (
      <NoMatches
        description="Nothing matches this status."
        action={
          <button
            type="button"
            onClick={() => setStatus(undefined)}
            className={ACTION}
          >
            Clear filter
          </button>
        }
      />
    );
  }

  const sorted = sortGames(visible, sort, direction);
  const sections = groupGames(sorted, group, platforms, favouritesFirst);
  // The first screenful is worth loading eagerly, whichever group it lands in.
  const eager = new Set(
    sections
      .flatMap((section) => section.games)
      .slice(0, 6)
      .map((game) => game.id),
  );

  return (
    <div className="flex flex-col">
      {sections.map((section) => (
        <section key={section.key}>
          {(group !== "none" || section.favourite) && (
            <h2 className="flex items-center justify-between border-b border-line px-5 py-3 text-base font-semibold">
              <span className="flex items-center gap-3">
                {section.favourite ? (
                  <span
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center"
                  >
                    <HeartGlyph filled />
                  </span>
                ) : section.status ? (
                  <StatusBadge status={section.status} decorative />
                ) : section.platform ? (
                  <span
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center"
                  >
                    <PlatformIcon icon={section.platform.icon} />
                  </span>
                ) : (
                  // "No platform" still indents like the sections above it.
                  <span aria-hidden="true" className="size-7" />
                )}
                {section.label}
              </span>
              <span className="text-sm font-normal text-muted">
                {section.games.length}
              </span>
            </h2>
          )}
          <ul className={GRID_COLS}>
            {section.games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                eager={eager.has(game.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
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

function NoMatches({
  description,
  action,
}: {
  description: string;
  action: ReactNode;
}) {
  return (
    <MessageState
      title="No games found"
      description={description}
      icon={
        <Search
          size={40}
          strokeWidth={1.75}
          aria-hidden="true"
          className="text-muted"
        />
      }
      action={action}
    />
  );
}
