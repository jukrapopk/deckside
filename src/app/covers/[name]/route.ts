import { readCover } from "@/lib/covers";

/** Serves uploaded covers; `readCover` rejects anything but a generated name. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const cover = await readCover(name);

  if (!cover) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(cover.body), {
    headers: {
      "content-type": cover.contentType,
      // A name is generated per upload, so the bytes behind it never change.
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
