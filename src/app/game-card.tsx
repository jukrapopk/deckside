import Image from "next/image";
import { EditGameDialog } from "@/app/game-dialog";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import type { Game } from "@/db/schema";
import { GRID_TILE } from "@/lib/grid";

type GameCardProps = {
  game: Game;
  /** First row of covers is above the fold, so load it eagerly. */
  eager?: boolean;
};

/** Stable per-title seed so a game without cover art keeps the same image. */
function coverSeed(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function GameCard({ game, eager = false }: GameCardProps) {
  const { title, platform, status, rating, coverUrl } = game;

  // Seeded so a game without artwork keeps the same image between renders.
  const cover =
    coverUrl ?? `https://picsum.photos/seed/${coverSeed(title)}/600/900`;

  return (
    <li className={`group relative overflow-hidden ${GRID_TILE}`}>
      <Image
        src={cover}
        alt=""
        aria-hidden="true"
        fill
        priority={eager}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />

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

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
        {/* Star row sits above the title. Both it and the platform row keep a
            fixed height so missing data never shifts the title. */}
        <div className="flex h-6 items-center">
          {rating !== null && <StarRating value={rating} />}
        </div>
        {/* Badge trails the title. It must not shrink, or a long title would
            push it out of the row. */}
        <div className="flex items-center gap-2">
          <h3
            className="min-w-0 truncate text-base font-semibold text-white"
            title={title}
          >
            {title}
          </h3>
          <StatusBadge status={status} className="shrink-0" />
        </div>
        <p className="min-h-5 truncate text-sm text-white/75">{platform}</p>
      </div>
    </li>
  );
}
