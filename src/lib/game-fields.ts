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
  | { ok: true; values: GameFields; platformIds: number[] }
  | { ok: false; error: string };

/** FormData is untrusted; both backends run the same checks. */
export function readGameFields(formData: FormData): GameFieldsResult {
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
  if (title.length > TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }
  if (!isStatus(status)) return { ok: false, error: "Unknown status." };
  // The picker only writes https links, but the field is still form input.
  if (
    coverUrl &&
    (!coverUrl.startsWith("https://") ||
      coverUrl.length > COVER_URL_MAX_LENGTH)
  ) {
    return { ok: false, error: "Cover art must be an https link." };
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
      error: `Progress must be a whole number from ${PROGRESS_MIN} to ${PROGRESS_MAX}.`,
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
  };
}
