import Image from "next/image";
import { EditGameDialog, type GameValues } from "@/app/game-dialog";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import { coverSeed, type Status } from "@/lib/statuses";

type GameCardProps = {
  id: number;
  title: string;
  platform: string | null;
  status: Status;
  rating: number | null;
  coverUrl: string | null;
  /** First row of covers is above the fold, so load it eagerly. */
  eager?: boolean;
};

export function GameCard({
  id,
  title,
  platform,
  status,
  rating,
  coverUrl,
  eager = false,
}: GameCardProps) {
  // Seeded so a game without artwork keeps the same image between renders.
  const cover =
    coverUrl ?? `https://picsum.photos/seed/${coverSeed(title)}/600/900`;

  const values: GameValues = { id, title, platform, status, rating };

  return (
    <li className="group relative aspect-2/3 overflow-hidden border-b border-r border-line bg-surface-2">
      <Image
        src={cover}
        alt=""
        aria-hidden="true"
        fill
        priority={eager}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />

      {/* Scrim so the labels stay legible over any photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/95 via-black/70 to-transparent"
      />

      <EditGameDialog
        game={values}
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
