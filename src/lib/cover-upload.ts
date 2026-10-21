export type CoverUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Turns a chosen file into a cover value. The server posts the file itself; the
 * demo has nowhere to post it, so it encodes a downscaled image in the browser.
 */
export type CoverUpload = (file: File) => Promise<CoverUploadResult>;
