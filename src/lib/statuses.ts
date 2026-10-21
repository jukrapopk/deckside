// Shared between client components and server actions. Must not live in a
// "use server" file: those may only export async functions to the client.
//
// Ordered as a game actually moves through a library: it sits in the backlog,
// gets picked to play next, is played, and then either finishes or is dropped.
// The order is the filter-menu order and the status picker's order.
export const STATUSES = [
  "backlog",
  "up-next",
  "playing",
  "completed",
  "dropped",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  backlog: "Backlog",
  // "Up next" rather than "Queued" or "Play next": it names a slot, not an
  // order, which matters because nothing here stores a sequence. It also
  // reads as a subset of Backlog in the filter list, which is what it is.
  "up-next": "Up next",
  playing: "Playing",
  completed: "Completed",
  dropped: "Dropped",
};

/** Filled circle per status. The glyph on top is always white. */
export const STATUS_BADGE: Record<Status, string> = {
  backlog: "bg-status-backlog",
  "up-next": "bg-status-up-next",
  playing: "bg-status-playing",
  completed: "bg-status-completed",
  dropped: "bg-status-dropped",
};

/** How many games sit in each status, plus the total. */
export type StatusCounts = Record<Status, number> & { all: number };

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

export function countStatuses(
  games: readonly { status: Status }[],
): StatusCounts {
  const counts = { all: games.length } as StatusCounts;
  for (const status of STATUSES) counts[status] = 0;
  for (const game of games) counts[game.status] += 1;
  return counts;
}
