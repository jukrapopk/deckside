import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

/** The one setting so far. Named after the service, so adding another is local. */
export const STEAMGRIDDB_KEY = "steamgriddb_api_key";

export function getSetting(key: string): string | null {
  const row = getDb()
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .get();

  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb()
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

export function clearSetting(key: string) {
  getDb().delete(settings).where(eq(settings.key, key)).run();
}

/**
 * The key lives in the database, but an environment variable wins: it keeps
 * the secret out of the file for anyone who prefers it there, and it lets a
 * container supply it without a settings round trip.
 */
export function steamGridDbKey(): string | null {
  return process.env.STEAMGRIDDB_API_KEY?.trim() || getSetting(STEAMGRIDDB_KEY);
}

export function hasSteamGridDbKey(): boolean {
  return Boolean(steamGridDbKey());
}
