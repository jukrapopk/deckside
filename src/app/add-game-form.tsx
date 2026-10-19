"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addGame, type FormState } from "@/app/actions";
import { STATUSES } from "@/lib/statuses";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
    >
      {pending ? "Adding…" : "Add game"}
    </button>
  );
}

const fieldClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950";

export function AddGameForm() {
  const [state, formAction] = useActionState(addGame, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="title"
          placeholder="Title"
          required
          maxLength={200}
          defaultValue={state.values?.title}
          aria-label="Title"
          className={fieldClass}
        />
        <input
          name="platform"
          placeholder="Platform (optional)"
          defaultValue={state.values?.platform}
          aria-label="Platform"
          className={fieldClass}
        />
        <select
          name="status"
          defaultValue={state.values?.status ?? "backlog"}
          aria-label="Status"
          className={fieldClass}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          name="rating"
          type="number"
          min={1}
          max={10}
          placeholder="Rating 1–10 (optional)"
          defaultValue={state.values?.rating}
          aria-label="Rating"
          className={fieldClass}
        />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
