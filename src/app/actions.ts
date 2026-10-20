"use server";

import { refresh } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { gamePlatforms, games, platforms } from "@/db/schema";
import { isPlatformIcon } from "@/lib/platforms";
import { clearSetting, setSetting, STEAMGRIDDB_KEY } from "@/lib/settings";
import { isStatus, type Status } from "@/lib/statuses";
import { parseRating } from "@/lib/rating";

export type FormState = { ok?: boolean; error?: string };

type Fields =
  | {
      ok: true;
      values: {
        title: string;
        status: Status;
        rating: number | null;
        coverUrl: string | null;
      };
      platformIds: number[];
    }
  | { ok: false; error: string };

function readFields(formData: FormData): Fields {
  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "backlog");
  const coverUrl = String(formData.get("coverUrl") ?? "").trim();
  const platformIds = [
    ...new Set(
      formData
        .getAll("platformIds")
        .map((value) => Number(value))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  if (!title) return { ok: false, error: "Title is required." };
  if (title.length > 200) {
    return { ok: false, error: "Title must be 200 characters or fewer." };
  }
  if (!isStatus(status)) return { ok: false, error: "Unknown status." };
  // The picker only writes https links, but the field is still form input.
  if (coverUrl && (!coverUrl.startsWith("https://") || coverUrl.length > 500)) {
    return { ok: false, error: "Cover art must be an https link." };
  }

  const parsed = parseRating(String(formData.get("rating") ?? ""));
  if (parsed.error) return { ok: false, error: parsed.error };

  return {
    ok: true,
    values: {
      title,
      status,
      rating: parsed.rating,
      coverUrl: coverUrl || null,
    },
    platformIds,
  };
}

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
  const fields = readFields(formData);
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

  const fields = readFields(formData);
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
export async function addPlatform(formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "");

  if (!name) return { error: "Name is required." };
  if (name.length > 40) {
    return { error: "Keep the name to 40 characters or fewer." };
  }
  if (!isPlatformIcon(icon)) return { error: "Choose an icon." };

  const db = getDb();
  const existing = db
    .select({ id: platforms.id })
    .from(platforms)
    .where(sql`lower(${platforms.name}) = lower(${name})`)
    .get();

  if (existing) return { error: "That platform is already in the list." };

  db.insert(platforms).values({ name, icon }).run();
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
 * The key is write-only from the UI's point of view: it is stored here and
 * used by server actions, never sent back to the browser.
 */
export async function saveSteamGridDbKey(formData: FormData): Promise<FormState> {
  const key = String(formData.get("apiKey") ?? "").trim();

  if (!key) return { error: "Enter a key first." };
  if (key.length > 200) return { error: "That key is too long." };

  setSetting(STEAMGRIDDB_KEY, key);
  refresh();
  return { ok: true };
}

export async function clearSteamGridDbKey(): Promise<void> {
  clearSetting(STEAMGRIDDB_KEY);
  refresh();
}
