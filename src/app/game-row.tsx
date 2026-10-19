"use client";

import { useTransition } from "react";
import { deleteGame, setGameStatus } from "@/app/actions";
import { STATUSES, type Status } from "@/lib/statuses";

type GameRowProps = {
  id: number;
  title: string;
  platform: string | null;
  status: Status;
  rating: number | null;
};

export function GameRow({ id, title, platform, status, rating }: GameRowProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <li
      className={`flex flex-wrap items-center gap-3 py-3 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <p className="text-sm text-zinc-500">
          {[platform, rating ? `${rating}/10` : null]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </div>

      <select
        value={status}
        aria-label={`Status for ${title}`}
        onChange={(event) => {
          const next = event.target.value as Status;
          startTransition(() => setGameStatus(id, next));
        }}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-label={`Delete ${title}`}
        onClick={() => {
          if (!confirm(`Delete "${title}"?`)) return;
          startTransition(() => deleteGame(id));
        }}
        className="rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </li>
  );
}
