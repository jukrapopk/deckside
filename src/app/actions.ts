"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { games } from "@/db/schema";
import { isStatus, type Status } from "@/lib/statuses";

export type FormState = {
  error?: string;
  values?: {
    title: string;
    platform: string;
    status: string;
    rating: string;
  };
};

export async function addGame(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    title: String(formData.get("title") ?? "").trim(),
    platform: String(formData.get("platform") ?? "").trim(),
    status: String(formData.get("status") ?? "backlog"),
    rating: String(formData.get("rating") ?? "").trim(),
  };

  if (!values.title) {
    return { error: "Title is required.", values };
  }

  if (values.title.length > 200) {
    return { error: "Title must be 200 characters or fewer.", values };
  }

  if (!isStatus(values.status)) {
    return { error: "Unknown status.", values };
  }

  let rating: number | null = null;
  if (values.rating) {
    rating = Number(values.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      return { error: "Rating must be a whole number from 1 to 10.", values };
    }
  }

  getDb()
    .insert(games)
    .values({
      title: values.title,
      platform: values.platform || null,
      status: values.status,
      rating,
    })
    .run();

  refresh();
  return {};
}

export async function setGameStatus(id: number, status: Status): Promise<void> {
  if (!Number.isInteger(id) || !isStatus(status)) return;

  getDb()
    .update(games)
    .set({ status, updatedAt: new Date() })
    .where(eq(games.id, id))
    .run();

  refresh();
}

export async function deleteGame(id: number): Promise<void> {
  if (!Number.isInteger(id)) return;

  getDb().delete(games).where(eq(games.id, id)).run();
  refresh();
}
