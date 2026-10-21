"use client";

import {
  ChevronDown,
  Gamepad2,
  Search,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { GameCard } from "./game-card";
import { AddGameDialog } from "./game-dialog";
import { useLibrary, usePlatforms } from "./library-context";
import { GameGridSkeleton } from "./skeletons";
import { useView } from "./view-provider";
import { HeartGlyph } from "@/components/heart";
import { PlatformIcon } from "@/components/platform-icon";
import { StatusBadge } from "@/components/status-badge";
import { GRID_COLS } from "@/lib/grid";
import { groupGames, sortGames } from "@/lib/view";

const ACTION =
  "mt-2 border border-line px-5 py-3 text-base font-medium hover:border-accent";

export function GameGrid() {
  const {
    games,
    counts,
    query,
    setQuery,
    ready: libraryReady,
  } = useLibrary();
  const {
    ready,
    statuses,
    sort,
    direction,
    group,
    favouritesFirst,
    setAllStatuses,
  } = useView();
  const platforms = usePlatforms();
  // Collapsing is a browsing aid, not a saved view preference: groups reopen
  // when the page is reloaded.
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(),
  );

  function toggleSection(key: string) {
    setCollapsedSections((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // Wait for both the data source and the saved view before drawing a grid
  // that would otherwise flash defaults for a frame.
  if (!libraryReady || !ready) return <GameGridSkeleton />;

  if (counts.all === 0) return <EmptyLibrary />;
  if (games.length === 0) {
    return (
      <NoMatches
        description={`Nothing matches "${query}".`}
        action={
          <button
            type="button"
            onClick={() => setQuery("")}
            className={ACTION}
          >
            Clear search
          </button>
        }
      />
    );
  }

  const visible = games.filter((game) => statuses.includes(game.status));

  if (visible.length === 0) {
    return (
      <NoMatches
        icon={SearchX}
        description="The status filter is hiding every game."
        action={
          <button
            type="button"
            onClick={() => setAllStatuses()}
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
  // The first screenful of the expanded sections is worth loading eagerly.
  const eager = new Set(
    sections
      .filter((section) => !collapsedSections.has(section.key))
      .flatMap((section) => section.games)
      .slice(0, 6)
      .map((game) => game.id),
  );

  return (
    <div className="flex flex-col">
      {sections.map((section) => {
        const headed = group !== "none" || section.favourite === true;
        const isCollapsed = headed && collapsedSections.has(section.key);
        const listId = `group-${section.key}-games`;

        return (
          <section
            key={section.key}
            className={headed ? "border-b border-line" : undefined}
          >
            {/* Keep the card h3s under a heading even when the grid has no
                visible group header. */}
            {!headed && <h2 className="sr-only">All games</h2>}
            {headed && (
              <h2 className="text-base font-semibold">
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  aria-controls={listId}
                  onClick={() => toggleSection(section.key)}
                  className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-surface-2 motion-reduce:transition-none"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {section.favourite ? (
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center"
                      >
                        <HeartGlyph filled />
                      </span>
                    ) : section.status ? (
                      <StatusBadge
                        status={section.status}
                        decorative
                        className="shrink-0"
                      />
                    ) : section.platform ? (
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center"
                      >
                        <PlatformIcon icon={section.platform.icon} />
                      </span>
                    ) : (
                      // "No platform" still indents like the sections above it.
                      <span aria-hidden="true" className="size-7 shrink-0" />
                    )}
                    <span className="truncate">{section.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-muted">
                    <span className="text-sm font-normal">
                      {section.games.length}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2.25}
                      aria-hidden="true"
                      className={`shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                        isCollapsed ? "-rotate-90" : ""
                      }`}
                    />
                  </span>
                </button>
              </h2>
            )}
            <ul
              id={listId}
              hidden={isCollapsed}
              className={headed ? `${GRID_COLS} pt-2` : GRID_COLS}
            >
              {section.games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  eager={eager.has(game.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}
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
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center px-6 py-24 text-center ${
        description ? "gap-4" : "gap-6"
      }`}
    >
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && (
        <p className="max-w-[45ch] break-words text-base text-muted">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

function EmptyLibrary() {
  return (
    <MessageState
      title="Your library is empty"
      description="Add a game to start tracking what you own, what is next, and what you are playing."
      icon={
        <Gamepad2
          size={40}
          strokeWidth={1.75}
          aria-hidden="true"
          className="text-muted"
        />
      }
      action={<AddGameDialog trigger="empty" />}
    />
  );
}

function NoMatches({
  description,
  action,
  icon: Icon = Search,
}: {
  description?: string;
  action: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <MessageState
      title="No games found"
      description={description}
      icon={
        <Icon
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
