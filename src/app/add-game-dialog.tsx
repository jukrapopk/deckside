"use client";

import { Plus, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addGame } from "@/app/actions";
import { STATUSES, STATUS_LABELS } from "@/lib/statuses";

const fieldClass =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent";

const labelClass = "flex flex-col gap-2 text-xs font-medium text-muted";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[10px] bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-transform hover:brightness-110 active:translate-y-px disabled:opacity-60 motion-reduce:transition-none"
    >
      {pending ? "Adding" : "Add game"}
    </button>
  );
}

export function AddGameDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Ran as the form action, so the pending state is tracked by useFormStatus.
  async function submit(formData: FormData) {
    const result = await addGame({}, formData);

    if (result.ok) {
      setError(undefined);
      setOpen(false);
      formRef.current?.reset();
      return;
    }

    setError(result.error);
  }

  function close() {
    setError(undefined);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[10px] bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-transform hover:brightness-110 active:translate-y-px motion-reduce:transition-none"
      >
        <Plus size={16} weight="bold" aria-hidden="true" />
        Add game
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="add-game-heading"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-[10px] border border-line bg-surface p-0 text-ink"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id="add-game-heading" className="font-semibold">
              Add game
            </h2>
            <p className="mt-1 text-xs text-muted">Only the title is required.</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded p-1 text-muted hover:text-ink"
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <form ref={formRef} action={submit} className="flex flex-col gap-4 px-5 py-5">
          <label className={labelClass}>
            Title
            <input
              name="title"
              required
              maxLength={200}
              autoComplete="off"
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            Platform
            <input
              name="platform"
              placeholder="Optional"
              autoComplete="off"
              className={fieldClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              Status
              <select name="status" defaultValue="backlog" className={fieldClass}>
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Rating
              <input
                name="rating"
                type="number"
                min={1}
                max={10}
                inputMode="numeric"
                placeholder="1 to 10"
                className={fieldClass}
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="rounded-[10px] border border-line px-4 py-2 text-sm font-medium text-muted hover:text-ink"
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}
