"use server";

import { refresh } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { gamePlatforms, games, platforms } from "@/db/schema";
import { readGameFields } from "@/lib/game-fields";
import type { FormState } from "@/lib/form-state";
import { API_KEY_MAX_LENGTH } from "@/lib/limits";
import { readPlatformFields } from "@/lib/platform-fields";
import {
  clearSetting,
  setSetting,
  STEAMGRIDDB_KEY,
  steamGridDbKey,
} from "@/lib/settings";
import { searchGames } from "@/lib/steamgriddb";
import {
  classifySteamGridDbError,
  STEAMGRIDDB_KEY_REJECTED,
  STEAMGRIDDB_RATE_LIMITED,
  STEAMGRIDDB_UNREACHABLE,
} from "@/lib/steamgriddb-errors";

/** Only ids that exist can be linked; the form is not the authority. */
function validPlatformIds(ids: number[]): number[] {
  if (ids.length === 0) return [];

  const known = new Set(
    getDb()
      .select({ id: platforms.id })
      .from(platforms)
      .all()
      .map((row) => row.id),
  );

  return ids.filter((id) => known.has(id));
}

function linksFor(gameId: number, platformIds: number[]) {
  return platformIds.map((platformId) => ({ gameId, platformId }));
}

export async function addGame(formData: FormData): Promise<FormState> {
  const fields = readGameFields(formData);
  if (!fields.ok) return { error: fields.error };

  const platformIds = validPlatformIds(fields.platformIds);
  const db = getDb();

  db.transaction((tx) => {
    const inserted = tx.insert(games).values(fields.values).run();
    const gameId = Number(inserted.lastInsertRowid);

    if (platformIds.length) {
      tx.insert(gamePlatforms).values(linksFor(gameId, platformIds)).run();
    }
  });

  refresh();
  return { ok: true };
}

export async function updateGame(
  id: number,
  formData: FormData,
): Promise<FormState> {
  if (!Number.isInteger(id)) return { error: "Unknown game." };

  const fields = readGameFields(formData);
  if (!fields.ok) return { error: fields.error };

  const platformIds = validPlatformIds(fields.platformIds);
  const db = getDb();

  db.transaction((tx) => {
    tx.update(games)
      .set({ ...fields.values, updatedAt: new Date() })
      .where(eq(games.id, id))
      .run();

    // The form always carries the full selection, so replace the set.
    tx.delete(gamePlatforms).where(eq(gamePlatforms.gameId, id)).run();

    if (platformIds.length) {
      tx.insert(gamePlatforms).values(linksFor(id, platformIds)).run();
    }
  });

  refresh();
  return { ok: true };
}

export async function deleteGame(id: number): Promise<void> {
  if (!Number.isInteger(id)) return;

  getDb().delete(games).where(eq(games.id, id)).run();
  refresh();
}

/** The platform list is managed from Settings and picked from a game's form. */
function platformNameTaken(name: string, exceptId?: number) {
  const where = sql`lower(${platforms.name}) = lower(${name})`;

  return Boolean(
    getDb()
      .select({ id: platforms.id })
      .from(platforms)
      .where(
        exceptId === undefined ? where : and(where, ne(platforms.id, exceptId)),
      )
      .get(),
  );
}

export async function addPlatform(formData: FormData): Promise<FormState> {
  const fields = readPlatformFields(formData);
  if (!fields.ok) return { error: fields.error };
  if (platformNameTaken(fields.name)) {
    return { error: "That platform is already in the list." };
  }

  getDb()
    .insert(platforms)
    .values({ name: fields.name, icon: fields.icon })
    .run();
  refresh();
  return { ok: true };
}

export async function updatePlatform(
  id: number,
  formData: FormData,
): Promise<FormState> {
  if (!Number.isInteger(id)) return { error: "Unknown platform." };

  const fields = readPlatformFields(formData);
  if (!fields.ok) return { error: fields.error };
  if (platformNameTaken(fields.name, id)) {
    return { error: "That platform is already in the list." };
  }

  const updated = getDb()
    .update(platforms)
    .set({ name: fields.name, icon: fields.icon })
    .where(eq(platforms.id, id))
    .run();

  if (updated.changes === 0) return { error: "Unknown platform." };

  refresh();
  return { ok: true };
}

export async function deletePlatform(id: number): Promise<void> {
  if (!Number.isInteger(id)) return;

  // The link rows cascade with the platform.
  getDb().delete(platforms).where(eq(platforms.id, id)).run();
  refresh();
}

/**
 * Saves the key. An empty value is a valid save: it clears the stored key.
 * Checking is a separate action, so this does not validate against the API.
 */
export async function saveSteamGridDbKey(key: string): Promise<FormState> {
  const candidate = key.trim();

  if (candidate.length > API_KEY_MAX_LENGTH) {
    return { error: "That key is too long." };
  }

  if (candidate) {
    setSetting(STEAMGRIDDB_KEY, candidate);
  } else {
    clearSetting(STEAMGRIDDB_KEY);
  }

  refresh();
  return { ok: true };
}

/**
 * One search is enough to know whether SteamGridDB accepts the key. The
 * candidate comes from the field when it is being edited; otherwise the saved
 * (or environment) key is tested.
 */
export async function checkSteamGridDbKey(key?: string): Promise<FormState> {
  const candidate = key?.trim() || steamGridDbKey();

  if (!candidate) return { error: "Enter a key first." };

  return validateSteamGridDbKey(candidate);
}

/** Any search proves auth; this title simply exists in the catalogue. */
const KEY_CHECK_TERM = "portal";

async function validateSteamGridDbKey(key: string): Promise<FormState> {
  if (key.length > API_KEY_MAX_LENGTH) {
    return { error: "That key is too long." };
  }

  try {
    await searchGames(key, KEY_CHECK_TERM);
    return { ok: true };
  } catch (error) {
    switch (classifySteamGridDbError(error)) {
      case "auth":
        return { error: STEAMGRIDDB_KEY_REJECTED };
      case "rate-limit":
        return { error: STEAMGRIDDB_RATE_LIMITED };
      default:
        return { error: STEAMGRIDDB_UNREACHABLE };
    }
  }
}
