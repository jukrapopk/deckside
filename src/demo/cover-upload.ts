import {
  COVER_UPLOAD_MAX_BYTES,
  COVER_UPLOAD_TYPES,
} from "@/lib/limits";
import type { CoverUpload } from "@/lib/cover-upload";

/**
 * The demo has no server to convert an upload, so the browser does it here and
 * the result becomes the game's `coverUrl` — a data URL inside the localStorage
 * record. 480×720 keeps a photo around 40-90 KB after base64, which leaves room
 * for dozens of covers in a 5 MB store; the server keeps 720×1080 files on disk.
 */
const COVER_WIDTH = 480;
const COVER_HEIGHT = 720;
const WEBP_QUALITY = 0.78;
/** Matches the bound `readGameFields` applies to a demo cover value. */
const DATA_URL_MAX_LENGTH = 400_000;

export const uploadDemoCover: CoverUpload = async (file) => {
  if (!COVER_UPLOAD_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: "Covers must be a JPEG, PNG, WebP, or AVIF image.",
    };
  }

  if (file.size > COVER_UPLOAD_MAX_BYTES) {
    return { ok: false, error: "Keep the cover under 6 MB." };
  }

  let bitmap: ImageBitmap;
  try {
    // `from-image` applies the EXIF rotation, so a phone photo is not sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return {
      ok: false,
      error: "That image could not be read. Try a JPEG or PNG.",
    };
  }

  try {
    const url = encode(bitmap);
    if (!url) {
      return { ok: false, error: "This browser cannot encode the image." };
    }
    if (!url.startsWith("data:image/")) {
      return { ok: false, error: "This browser cannot encode the image." };
    }
    if (url.length > DATA_URL_MAX_LENGTH) {
      return {
        ok: false,
        error: "That cover is too large to keep in this browser.",
      };
    }

    return { ok: true, url };
  } finally {
    bitmap.close();
  }
};

/** Centre-crops the source to 2:3, then downscales it to the demo's size. */
function encode(bitmap: ImageBitmap): string | null {
  const ratio = COVER_WIDTH / COVER_HEIGHT;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = bitmap.width;
  let sourceHeight = bitmap.height;

  if (sourceWidth / sourceHeight > ratio) {
    sourceWidth = sourceHeight * ratio;
    sourceX = (bitmap.width - sourceWidth) / 2;
  } else {
    sourceHeight = sourceWidth / ratio;
    sourceY = (bitmap.height - sourceHeight) / 2;
  }

  const width = Math.min(COVER_WIDTH, Math.round(sourceWidth));
  const height = Math.round(width / ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );

  // Browsers without WebP encoding fall back to PNG, which still works.
  return canvas.toDataURL("image/webp", WEBP_QUALITY);
}
