"use server";

import { refresh } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { gamePlatforms, games, platforms } from "@/db/schema";
import { isPlatformIcon, type PlatformIconKey } from "@/lib/platforms";
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
        favourite: boolean;
        progress: number;
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

  const favourite = formData.get("favourite") === "1";

  const progressRaw = formData.get("progress");
  const progress = progressRaw === null ? 0 : Number(progressRaw);
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    return {
      ok: false,
      error: "Progress must be a whole number from 0 to 100.",
    };
  }

  return {
    ok: true,
    values: {
      title,
      status,
      rating: parsed.rating,
      favourite,
      progress,
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
type PlatformFields =
  | { ok: true; name: string; icon: PlatformIconKey }
  | { ok: false; error: string };

function readPlatform(formData: FormData): PlatformFields {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "");

  if (!name) return { ok: false, error: "Name is required." };
  if (name.length > 40) {
    return { ok: false, error: "Keep the name to 40 characters or fewer." };
  }
  if (!isPlatformIcon(icon)) return { ok: false, error: "Choose an icon." };

  return { ok: true, name, icon };
}

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
  const fields = readPlatform(formData);
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

  const fields = readPlatform(formData);
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
