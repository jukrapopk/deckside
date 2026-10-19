// Shared between client components and server actions. Must not live in a
// "use server" file: those may only export async functions to the client.
export const STATUSES = ["backlog", "playing", "completed", "dropped"] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  backlog: "Backlog",
  playing: "Playing",
  completed: "Completed",
  dropped: "Dropped",
};

/** Filled circle per status. The glyph on top is always white. */
export const STATUS_BADGE: Record<Status, string> = {
  backlog: "bg-status-backlog",
  playing: "bg-status-playing",
  completed: "bg-status-completed",
  dropped: "bg-status-dropped",
};

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

/** Stable per-title seed so a game without cover art keeps the same image. */
export function coverSeed(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
