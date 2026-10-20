"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { games } from "@/db/schema";
import { clearSetting, setSetting, STEAMGRIDDB_KEY } from "@/lib/settings";
import { isStatus, type Status } from "@/lib/statuses";
import { parseRating } from "@/lib/rating";

export type FormState = { ok?: boolean; error?: string };

type Fields =
  | {
      ok: true;
      values: {
        title: string;
        platform: string | null;
        status: Status;
        rating: number | null;
        coverUrl: string | null;
      };
    }
  | { ok: false; error: string };

function readFields(formData: FormData): Fields {
  const title = String(formData.get("title") ?? "").trim();
  const platform = String(formData.get("platform") ?? "").trim();
  const status = String(formData.get("status") ?? "backlog");
  const coverUrl = String(formData.get("coverUrl") ?? "").trim();

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
      platform: platform || null,
      status,
      rating: parsed.rating,
      coverUrl: coverUrl || null,
    },
  };
}

export async function addGame(formData: FormData): Promise<FormState> {
  const fields = readFields(formData);
  if (!fields.ok) return { error: fields.error };

  getDb().insert(games).values(fields.values).run();

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

  getDb()
    .update(games)
    .set({ ...fields.values, updatedAt: new Date() })
    .where(eq(games.id, id))
    .run();

  refresh();
  return { ok: true };
}

export async function deleteGame(id: number): Promise<void> {
  if (!Number.isInteger(id)) return;

  getDb().delete(games).where(eq(games.id, id)).run();
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
