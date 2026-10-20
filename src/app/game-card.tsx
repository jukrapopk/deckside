"use client";

import { useMemo } from "react";
import { EditGameDialog } from "@/app/game-dialog";
import { usePlatforms } from "@/app/platforms-provider";
import { CoverArt } from "@/components/cover-art";
import { PlatformIcon } from "@/components/platform-icon";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import type { GameWithPlatforms } from "@/db/queries";
import { GRID_TILE } from "@/lib/grid";
import { indexPlatforms, platformsOf } from "@/lib/platforms";

type GameCardProps = {
  game: GameWithPlatforms;
  /** First row of covers is above the fold, so load it eagerly. */
  eager?: boolean;
};

export function GameCard({ game, eager = false }: GameCardProps) {
  const { title, status, rating, progress, coverUrl } = game;
  const platforms = usePlatforms();

  const byId = useMemo(() => indexPlatforms(platforms), [platforms]);

  const own = platformsOf(game, byId).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  // The tile itself is what responds, so the labels ride with the cover
  // instead of staying put under a zooming image. z-10 keeps a grown card
  // above its neighbours; the gutter is wide enough that it only covers
  // empty space.
  return (
    <li
      className={`group relative overflow-hidden ${GRID_TILE} transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100`}
    >
      <CoverArt src={coverUrl} title={title} eager={eager} />

      {/* Scrim so the labels stay legible over any photo. Tinted to the page
          ground rather than neutral black, so the card edge belongs to it. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-bg/95 via-bg/70 to-transparent"
      />

      {/* A bar on the bottom edge, above the scrim so its fill keeps its
          colour, under the labels so it cannot move the title block. Zero
          means untracked, so the tile stays clean until there is something
          to show. */}
      {progress > 0 && (
        <div
          role="progressbar"
          aria-label={`${title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="absolute inset-x-0 bottom-0 h-1.5 bg-white/15"
        >
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      )}

      <EditGameDialog
        game={game}
        triggerClassName="opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
        {/* Star row sits above the title. Both it and the platform row keep a
            fixed height so missing data never shifts the title. */}
        <div className="flex h-4 items-center">
          {rating !== null && <StarRating value={rating} />}
        </div>
        {/* Badge trails the title. It must not shrink, or a long title would
            push it out of the row. */}
        <div className="flex items-center gap-2">
          <h3
            className="min-w-0 truncate text-lg font-semibold text-white"
            title={title}
          >
            {title}
          </h3>
          <StatusBadge status={status} className="shrink-0" />
        </div>
        {/* Icons only: the tile is the quietest place for a word, and the
            name is still there on hover and for a screen reader. */}
        <div className="flex min-h-6 items-center gap-3 text-white/75">
          {own.map((platform) => (
            <span
              key={platform.id}
              role="img"
              aria-label={platform.name}
              title={platform.name}
            >
              <PlatformIcon icon={platform.icon} size={18} />
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}
