import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { databasePath } from "@/db";
import { COVER_UPLOAD_MAX_BYTES } from "@/lib/limits";

/*
  Uploaded covers sit next to the database rather than in `public`: `public` is
  baked into the image, while this directory rides the same volume as the
  SQLite file, so a redeploy keeps the artwork. The route in app/covers serves
  them, since nothing outside `public` is reachable otherwise.
*/
export const coversDir = join(dirname(databasePath), "covers");

export const LOCAL_COVER_PREFIX = "/covers/";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

/** Names are generated here, so anything else is a stray request. */
const COVER_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;

export function isLocalCoverUrl(url: string): boolean {
  return (
    url.startsWith(LOCAL_COVER_PREFIX) &&
    COVER_NAME.test(url.slice(LOCAL_COVER_PREFIX.length))
  );
}

/** A stored cover is either an uploaded file or a SteamGridDB link. */
export function isCoverUrl(url: string): boolean {
  return url.startsWith("https://") || isLocalCoverUrl(url);
}

/**
 * The browser's content type is a hint, not proof. Checking the first bytes
 * keeps a renamed text file from being stored with an image extension.
 */
function hasImageSignature(bytes: Uint8Array, mime: string): boolean {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  switch (mime) {
    case "image/jpeg":
      return startsWith([0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return (
        startsWith([0x52, 0x49, 0x46, 0x46]) &&
        startsWith([0x57, 0x45, 0x42, 0x50], 8)
      );
    case "image/avif": {
      const brand = String.fromCharCode(...bytes.slice(8, 12));
      return (
        startsWith([0x66, 0x74, 0x79, 0x70], 4) &&
        ["avif", "avis", "mif1"].includes(brand)
      );
    }
    default:
      return false;
  }
}

type SaveResult = { ok: true; url: string } | { ok: false; error: string };

/** Writes an uploaded cover and returns the URL to store on the game. */
export async function saveCover(file: File): Promise<SaveResult> {
  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return { ok: false, error: "Covers must be a JPEG, PNG, WebP, or AVIF image." };
  }
  if (file.size > COVER_UPLOAD_MAX_BYTES) {
    return { ok: false, error: "Keep the cover under 6 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasImageSignature(bytes, file.type)) {
    return { ok: false, error: "That file is not a readable image." };
  }

  await mkdir(coversDir, { recursive: true });
  const name = `${randomUUID()}.${extension}`;
  await writeFile(join(coversDir, name), bytes);

  return { ok: true, url: `${LOCAL_COVER_PREFIX}${name}` };
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

  const extension = name.slice(name.lastIndexOf(".") + 1);

  try {
    return {
      body: await readFile(join(coversDir, name)),
      contentType: CONTENT_TYPES[extension] ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}
