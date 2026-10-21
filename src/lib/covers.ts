import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { databasePath } from "@/db";
import { COVER_UPLOAD_MAX_BYTES, COVER_UPLOAD_TYPES } from "@/lib/limits";

/*
  Uploaded covers sit next to the database rather than in `public`: `public` is
  baked into the image, while this directory rides the same volume as the
  SQLite file, so a redeploy keeps the artwork. The route in app/covers serves
  them, since nothing outside `public` is reachable otherwise.

  Both sources land here as a 2:3 WebP — the shape the card and the picker frame
  use — so a 6 MB upload and a CDN PNG cost the same handful of kilobytes, and
  the library does not depend on the CDN still serving the original.
*/
export const coversDir = join(dirname(databasePath), "covers");

export const LOCAL_COVER_PREFIX = "/covers/";

const COVER_WIDTH = 720;
const COVER_HEIGHT = 1080;
const WEBP_QUALITY = 82;

/** A remote pick is downloaded, so its size is bounded like an upload. */
const REMOTE_COVER_MAX_BYTES = 15 * 1024 * 1024;
const REMOTE_TIMEOUT_MS = 10_000;

/** Names are generated here, so anything else is a stray request. */
const COVER_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export function isLocalCoverUrl(url: string): boolean {
  return (
    url.startsWith(LOCAL_COVER_PREFIX) &&
    COVER_NAME.test(url.slice(LOCAL_COVER_PREFIX.length))
  );
}

/**
 * Rows saved before covers were localized still hold a SteamGridDB link; they
 * are left alone rather than migrated, so the check has to keep accepting one.
 */
export function isCoverUrl(url: string): boolean {
  return url.startsWith("https://") || isLocalCoverUrl(url);
}

/** Only SteamGridDB is fetched: the URL arrives in a form field. */
function isSteamGridDBUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      (hostname === "steamgriddb.com" || hostname.endsWith(".steamgriddb.com"))
    );
  } catch {
    return false;
  }
}

type SaveResult = { ok: true; url: string } | { ok: false; error: string };

/** Converts whatever came in into the stored shape, or null if it is not art. */
async function storeWebp(source: Uint8Array): Promise<string | null> {
  await mkdir(coversDir, { recursive: true });
  const name = `${randomUUID()}.webp`;

  try {
    await sharp(source, { failOn: "error" })
      // Phone photos carry their orientation in EXIF; bake it in before the
      // crop, or a portrait photo is stored on its side.
      .rotate()
      .resize(COVER_WIDTH, COVER_HEIGHT, {
        fit: "cover",
        position: "attention",
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(join(coversDir, name));
  } catch {
    await unlink(join(coversDir, name)).catch(() => {});
    return null;
  }

  return `${LOCAL_COVER_PREFIX}${name}`;
}

/** Reads a download without trusting its size header. */
async function readCapped(
  response: Response,
  limit: number,
): Promise<Uint8Array | null> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    await response.body?.cancel().catch(() => {});
    return null;
  }

  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      total += value.length;
      if (total > limit) {
        await reader.cancel().catch(() => {});
        return null;
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}

/** Stores an uploaded file as the app's cover format. */
export async function saveCoverFile(file: File): Promise<SaveResult> {
  if (!COVER_UPLOAD_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: "Use a JPEG, PNG, WebP, or AVIF image.",
    };
  }
  if (file.size > COVER_UPLOAD_MAX_BYTES) {
    return { ok: false, error: "Keep the cover under 6 MB." };
  }

  const stored = await storeWebp(new Uint8Array(await file.arrayBuffer()));

  return stored
    ? { ok: true, url: stored }
    : { ok: false, error: "That file is not a readable image." };
}

/** Downloads a SteamGridDB pick so the row owns its copy of the art. */
export async function saveCoverUrl(url: string): Promise<SaveResult> {
  if (!isSteamGridDBUrl(url)) {
    return { ok: false, error: "Only SteamGridDB art can be saved." };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "image/*" },
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: "Couldn't download that cover." };
  }

  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/")
  ) {
    await response.body?.cancel().catch(() => {});
    return { ok: false, error: "Couldn't download that cover." };
  }

  const bytes = await readCapped(response, REMOTE_COVER_MAX_BYTES);
  if (!bytes) {
    return { ok: false, error: "That cover is too large to download." };
  }

  const stored = await storeWebp(bytes);

  return stored
    ? { ok: true, url: stored }
    : { ok: false, error: "That cover could not be converted." };
}

/** Best effort: a missing file must not fail the save that replaced it. */
export async function deleteCover(url: string | null | undefined) {
  if (!url || !isLocalCoverUrl(url)) return;

  await unlink(join(coversDir, url.slice(LOCAL_COVER_PREFIX.length))).catch(
    () => {},
  );
}

export async function readCover(name: string) {
  if (!COVER_NAME.test(name)) return null;

  try {
    return {
      body: await readFile(join(coversDir, name)),
      contentType: "image/webp",
    };
  } catch {
    return null;
  }
}
