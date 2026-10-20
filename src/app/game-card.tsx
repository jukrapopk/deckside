import { EditGameDialog } from "@/app/game-dialog";
import { CoverArt } from "@/components/cover-art";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import type { Game } from "@/db/schema";
import { GRID_TILE } from "@/lib/grid";

type GameCardProps = {
  game: Game;
  /** First row of covers is above the fold, so load it eagerly. */
  eager?: boolean;
};

export function GameCard({ game, eager = false }: GameCardProps) {
  const { title, platform, status, rating, coverUrl } = game;

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
        <p className="min-h-6 truncate text-base text-white/75">{platform}</p>
      </div>
    </li>
  );
}
