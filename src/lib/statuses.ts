// Shared between client forms and server actions. Must not live in a
// "use server" file: those may only export async functions to the client.
export const STATUSES = ["backlog", "playing", "completed", "dropped"] as const;

export type Status = (typeof STATUSES)[number];

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}
