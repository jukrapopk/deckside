"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addGame, deleteGame, updateGame } from "@/app/actions";
import { CoverPicker } from "@/app/cover-picker";
import { PlatformPicker } from "@/app/platform-picker";
import { Field, FieldGroup, inputClass } from "@/components/field";
import { IconButton } from "@/components/icon-button";
import { Modal, useModal } from "@/components/modal";
import { StarPicker } from "@/components/star-picker";
import { SubmitButton } from "@/components/submit-button";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/statuses";

export type GameValues = {
  id: number;
  title: string;
  platformIds: number[];
  status: Status;
  rating: number | null;
  progress: number;
  coverUrl: string | null;
};

export function AddGameDialog() {
  const modal = useModal();

  return (
    <>
      <div className="border-l border-line">
        <IconButton
          label="Add game"
          size="lg"
          onClick={modal.openModal}
          icon={<Plus size={22} strokeWidth={2.25} aria-hidden="true" />}
        />
      </div>

      <Modal open={modal.open} onClose={modal.closeModal} title="Add new game">
        <GameForm
          key={modal.open ? "open" : "closed"}
          mode="add"
          onDone={modal.closeModal}
        />
      </Modal>
    </>
  );
}

export function EditGameDialog({
  game,
  triggerClassName = "",
}: {
  game: GameValues;
  triggerClassName?: string;
}) {
  const modal = useModal();

  return (
    <>
      <IconButton
        label={`Edit ${game.title}`}
        variant="bare"
        onClick={modal.openModal}
        className={`absolute right-0 top-0 ${triggerClassName}`}
        icon={<Pencil size={18} strokeWidth={2.25} aria-hidden="true" />}
      />

      <Modal open={modal.open} onClose={modal.closeModal} title={game.title}>
        <GameForm
          key={modal.open ? "open" : "closed"}
          mode="edit"
          game={game}
          onDone={modal.closeModal}
        />
      </Modal>
    </>
  );
}

type GameFormProps =
  | { mode: "add"; onDone: () => void }
  | { mode: "edit"; game: GameValues; onDone: () => void };

/**
 * The one form behind both dialogs. Callers give it a `key` that changes with
 * the open state, so each opening remounts it and starts from a clean slate
 * rather than the previous attempt's fields and error.
 */
function GameForm(props: GameFormProps) {
  const existing = props.mode === "edit" ? props.game : null;

  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [progress, setProgress] = useState(existing?.progress ?? 0);
  const [platformIds, setPlatformIds] = useState<number[]>(
    existing?.platformIds ?? [],
  );
  const [coverUrl, setCoverUrl] = useState(existing?.coverUrl ?? "");
  const [error, setError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  async function submit(formData: FormData) {
    const result =
      props.mode === "edit"
        ? await updateGame(props.game.id, formData)
        : await addGame(formData);

    if (result.ok) {
      props.onDone();
      return;
    }

    setError(result.error);
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      <Field label={props.mode === "add" ? "Title *" : "Title"}>
        <input
          name="title"
          required
          maxLength={200}
          autoComplete="off"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClass}
        />
      </Field>

      <FieldGroup legend="Cover">
        <CoverPicker title={title} value={coverUrl} onChange={setCoverUrl} />
      </FieldGroup>

      <FieldGroup legend="Platforms">
        <PlatformPicker value={platformIds} onChange={setPlatformIds} />
        {platformIds.map((id) => (
          <input key={id} type="hidden" name="platformIds" value={id} />
        ))}
      </FieldGroup>

      <Field label="Status">
        <select
          name="status"
          defaultValue={existing?.status ?? "backlog"}
          className={inputClass}
        >
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </Field>

      <FieldGroup legend="Progress">
        <div className="flex items-center gap-4">
          <input
            type="range"
            name="progress"
            min={0}
            max={100}
            step={1}
            value={progress}
            aria-label="Progress"
            onChange={(event) => setProgress(Number(event.target.value))}
            className="w-full accent-accent"
          />
          <span className="w-12 shrink-0 text-right text-base tabular-nums text-muted">
            {progress}%
          </span>
        </div>
      </FieldGroup>

      <FieldGroup legend="Rating">
        <StarPicker name="rating" value={rating} onChange={setRating} />
      </FieldGroup>

      {error && (
        <p role="alert" className="text-base text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
        {props.mode === "edit" ? (
          confirmingDelete ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  startDelete(() =>
                    deleteGame(props.game.id).then(props.onDone),
                  )
                }
                className="bg-danger-strong px-4 py-3 text-base font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60 motion-reduce:transition-none"
              >
                {isDeleting ? "Deleting" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="border border-line px-4 py-3 text-base font-medium text-muted hover:text-ink"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-2 px-1 py-3 text-base font-medium text-muted hover:text-danger"
            >
              <Trash2 size={18} strokeWidth={2.25} aria-hidden="true" />
              Delete
            </button>
          )
        ) : (
          <span />
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={props.onDone}
            className="border border-line px-5 py-3 text-base font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
          <SubmitButton label={props.mode === "edit" ? "Save" : "Add game"} />
        </div>
      </div>
    </form>
  );
}
