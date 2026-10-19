"use client";

import { Star, Trash } from "@phosphor-icons/react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { deleteGame, setGameStatus } from "@/app/actions";
import { STATUSES, STATUS_LABELS, coverSeed, type Status } from "@/lib/statuses";

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
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Seeded so a game without artwork keeps the same image between renders.
  const cover =
    coverUrl ?? `https://picsum.photos/seed/${coverSeed(title)}/600/900`;

  return (
    <li
      className={`group flex flex-col gap-2 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-[10px] border border-line bg-surface-2">
        <Image
          src={cover}
          alt=""
          aria-hidden="true"
          fill
          priority={eager}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />

        <span className="absolute left-2 top-2 rounded-full border border-line bg-bg/80 px-2 py-0.5 text-[11px] font-medium text-ink backdrop-blur">
          {STATUS_LABELS[status]}
        </span>

        {rating !== null && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-line bg-bg/80 px-2 py-0.5 text-[11px] font-medium text-ink backdrop-blur">
            <Star size={11} weight="fill" aria-hidden="true" />
            {rating}
          </span>
        )}

        {/* Revealed on hover or keyboard focus so actions stay reachable. */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-linear-to-t from-black/90 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 motion-reduce:transition-none">
          {confirmingDelete ? (
            <>
              <span className="flex-1 text-xs font-medium text-ink">
                Delete?
              </span>
              <button
                type="button"
                onClick={() =>
                  startTransition(() => deleteGame(id).then(() => undefined))
                }
                className="rounded-[10px] bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-[10px] border border-line px-2.5 py-1 text-xs font-medium text-ink hover:border-accent"
              >
                Keep
              </button>
            </>
          ) : (
            <>
              <label htmlFor={`status-${id}`} className="sr-only">
                Status for {title}
              </label>
              <select
                id={`status-${id}`}
                value={status}
                onChange={(event) => {
                  const next = event.target.value as Status;
                  startTransition(() => setGameStatus(id, next).then(() => undefined));
                }}
                className="min-w-0 flex-1 rounded-[10px] border border-line bg-bg/90 px-2 py-1 text-xs text-ink focus:border-accent"
              >
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label={`Delete ${title}`}
                className="rounded-[10px] border border-line bg-bg/90 p-1.5 text-muted hover:border-red-500 hover:text-red-400"
              >
                <Trash size={14} weight="bold" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium" title={title}>
          {title}
        </h3>
        <p className="truncate text-xs text-muted">
          {platform ?? "No platform"}
        </p>
      </div>
    </li>
  );
}
