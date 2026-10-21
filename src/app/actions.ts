"use server";

import { refresh } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { gamePlatforms, games, platforms } from "@/db/schema";
import {
  API_KEY_MAX_LENGTH,
  COVER_URL_MAX_LENGTH,
  PLATFORM_NAME_MAX_LENGTH,
  PROGRESS_MAX,
  PROGRESS_MIN,
  TITLE_MAX_LENGTH,
} from "@/lib/limits";
import { isPlatformIconValue, type PlatformIconValue } from "@/lib/platforms";
import { deleteCover, isCoverUrl, saveCoverFile, saveCoverUrl } from "@/lib/covers";
import { parseRating } from "@/lib/rating";
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
import { isStatus, type Status } from "@/lib/statuses";

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
      coverFile: File | null;
    }
  | { ok: false; error: string };

function readFields(formData: FormData): Fields {
  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "backlog");
  const coverUrl = String(formData.get("coverUrl") ?? "").trim();
  // An empty file input still posts a File with no bytes.
  const uploaded = formData.get("coverFile");
  const coverFile =
    uploaded instanceof File && uploaded.size > 0 ? uploaded : null;
  const platformIds = [
    ...new Set(
      formData
        .getAll("platformIds")
        .map((value) => Number(value))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  if (!title) return { ok: false, error: "Title is required." };
  if (title.length > TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }
  if (!isStatus(status)) return { ok: false, error: "Unknown status." };
  // The picker writes https links and uploaded files, but the field is still
  // form input, so the shape is re-checked here.
  if (
    coverUrl &&
    (!isCoverUrl(coverUrl) || coverUrl.length > COVER_URL_MAX_LENGTH)
  ) {
    return {
      ok: false,
      error: "Cover art must be an uploaded image or an https link.",
    };
  }

  const parsed = parseRating(String(formData.get("rating") ?? ""));
  if (parsed.error) return { ok: false, error: parsed.error };

  const favourite = formData.get("favourite") === "1";

  const progressRaw = formData.get("progress");
  const progress = progressRaw === null ? PROGRESS_MIN : Number(progressRaw);
  if (
    !Number.isInteger(progress) ||
    progress < PROGRESS_MIN ||
    progress > PROGRESS_MAX
  ) {
    return {
      ok: false,
      error: `Progress must be a whole number from ${PROGRESS_MIN} to ${PROGRESS_MAX}.`,
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
    coverFile,
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

type StagedCover =
  | { ok: true; url: string | null; created: string | null }
  | { ok: false; error: string };

/**
 * Turns the form's cover choice into something the row can point at. An upload
 * converts, a new SteamGridDB pick is downloaded and converted, and an
 * unchanged value is left exactly as it was — including the remote links rows
 * saved before covers were localized.
 */
async function stageCover(
  file: File | null,
  url: string | null,
  previous: string | null,
): Promise<StagedCover> {
  if (file) {
    const saved = await saveCoverFile(file);
    if (!saved.ok) return { ok: false, error: saved.error };

    return { ok: true, url: saved.url, created: saved.url };
  }

  if (!url || url === previous) return { ok: true, url, created: null };

  if (url.startsWith("https://")) {
    const saved = await saveCoverUrl(url);
    if (!saved.ok) return { ok: false, error: saved.error };

    return { ok: true, url: saved.url, created: saved.url };
  }

  return { ok: true, url, created: null };
}export async function addGame(formData: FormData): Promise<FormState> {
  const fields = readFields(formData);
  if (!fields.ok) return { error: fields.error };

  const cover = await stageCover(
    fields.coverFile,
    fields.values.coverUrl,
    null,
  );
  if (!cover.ok) return { error: cover.error };

  const platformIds = validPlatformIds(fields.platformIds);
  const db = getDb();

  try {
    db.transaction((tx) => {
      const inserted = tx
        .insert(games)
        .values({ ...fields.values, coverUrl: cover.url })
        .run();
      const gameId = Number(inserted.lastInsertRowid);

      if (platformIds.length) {
        tx.insert(gamePlatforms).values(linksFor(gameId, platformIds)).run();
      }
    });
  } catch (error) {
    // Do not leave a file behind for a row that never appeared.
    await deleteCover(cover.created);
    throw error;
  }

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

  const db = getDb();
  const previous = db
    .select({ coverUrl: games.coverUrl })
    .from(games)
    .where(eq(games.id, id))
    .get();

  if (!previous) return { error: "Unknown game." };

  const cover = await stageCover(
    fields.coverFile,
    fields.values.coverUrl,
    previous.coverUrl,
  );
  if (!cover.ok) return { error: cover.error };

  const coverUrl = cover.url;
  const platformIds = validPlatformIds(fields.platformIds);

  try {
    db.transaction((tx) => {
      tx.update(games)
        .set({ ...fields.values, coverUrl, updatedAt: new Date() })
        .where(eq(games.id, id))
        .run();

      // The form always carries the full selection, so replace the set.
      tx.delete(gamePlatforms).where(eq(gamePlatforms.gameId, id)).run();

      if (platformIds.length) {
        tx.insert(gamePlatforms).values(linksFor(id, platformIds)).run();
      }
    });
  } catch (error) {
    await deleteCover(cover.created);
    throw error;
  }

  // The previous upload is only removed once the row points somewhere else.
  if (previous.coverUrl !== coverUrl) await deleteCover(previous.coverUrl);

  refresh();
  return { ok: true };
}

export async function deleteGame(id: number): Promise<void> {
  if (!Number.isInteger(id)) return;

  const db = getDb();
  const deleted = db
    .select({ coverUrl: games.coverUrl })
    .from(games)
    .where(eq(games.id, id))
    .get();

  db.delete(games).where(eq(games.id, id)).run();
  await deleteCover(deleted?.coverUrl);

  refresh();
}

/** The platform list is managed from Settings and picked from a game's form. */
type PlatformFields =
  | { ok: true; name: string; icon: PlatformIconValue }
  | { ok: false; error: string };

function readPlatform(formData: FormData): PlatformFields {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "");

  if (!name) return { ok: false, error: "Name is required." };
  if (name.length > PLATFORM_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Keep the name to ${PLATFORM_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }
  // Presets are keys; anything else has to be a well-formed `lucide:<name>`.
  // Whether this build ships that name is a rendering concern, so an unknown
  // but valid name saves and draws the default glyph.
  if (!isPlatformIconValue(icon)) {
    return { ok: false, error: "Choose an icon." };
  }

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
