import {
  COVER_URL_MAX_LENGTH,
  PROGRESS_MAX,
  PROGRESS_MIN,
  TITLE_MAX_LENGTH,
} from "@/lib/limits";
import { parseRating } from "@/lib/rating";
import { isStatus, type Status } from "@/lib/statuses";

export type GameFields = {
  title: string;
  status: Status;
  rating: number | null;
  favourite: boolean;
  progress: number;
  coverUrl: string | null;
};

export type GameFieldsResult =
  | {
      ok: true;
      values: GameFields;
      platformIds: number[];
      /** The file input's payload; only the server action has somewhere to put it. */
      coverFile: File | null;
    }
  | { ok: false; error: string };

type GameFieldOptions = {
  /** The demo can keep bundled posters and uploads encoded as data URLs. */
  allowDemoCover?: boolean;
};

/**
 * An upload lives in localStorage as a data URL, which is orders of magnitude
 * longer than a link. The larger bound is only reachable with the demo option,
 * so the server still rejects an oversized field.
 */
const DEMO_COVER_MAX_LENGTH = 400_000;
const DEMO_POSTER_PREFIX = "/demo/";
const DATA_IMAGE_PATTERN =
  /^data:image\/(?:avif|jpeg|png|webp);base64,[a-z0-9+/]+=*$/i;

const COVER_ERROR = "Upload an image or paste an https link.";

/** FormData is untrusted; both backends run the same checks. */
export function readGameFields(
  formData: FormData,
  options: GameFieldOptions = {},
): GameFieldsResult {
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

  /*
    The picker only writes links it made or received, but the field is still
    form input. `/covers/` is the server's own store, `/demo/` and data URLs are
    the demo's, and an https link is a SteamGridDB pick the action will localize.
  */
  const demoCover =
    options.allowDemoCover === true &&
    (coverUrl.startsWith(DEMO_POSTER_PREFIX) ||
      DATA_IMAGE_PATTERN.test(coverUrl));
  const validCover =
    !coverUrl ||
    coverUrl.startsWith("https://") ||
    coverUrl.startsWith("/covers/") ||
    demoCover;
  if (!validCover) return { ok: false, error: COVER_ERROR };

  const coverMaxLength = options.allowDemoCover
    ? DEMO_COVER_MAX_LENGTH
    : COVER_URL_MAX_LENGTH;
  if (coverUrl.length > coverMaxLength) {
    return {
      ok: false,
      error: options.allowDemoCover
        ? "That cover is too large to keep in this browser. Try a smaller image."
        : COVER_ERROR,
    };
  }

  const parsed = parseRating(String(formData.get("rating") ?? ""));
  if (parsed.error) return { ok: false, error: parsed.error };

  const progressRaw = formData.get("progress");
  const progress = progressRaw === null ? PROGRESS_MIN : Number(progressRaw);
  if (
    !Number.isInteger(progress) ||
    progress < PROGRESS_MIN ||
    progress > PROGRESS_MAX
  ) {
    return {
      ok: false,
      error: `Progress must be ${PROGRESS_MIN}–${PROGRESS_MAX}.`,
    };
  }

  return {
    ok: true,
    values: {
      title,
      status,
      rating: parsed.rating,
      favourite: formData.get("favourite") === "1",
      progress,
      coverUrl: coverUrl || null,
    },
    platformIds,
    coverFile,
  };
}
