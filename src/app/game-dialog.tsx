"use client";

import { Pencil, Plus } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { addGame, deleteGame, updateGame } from "@/app/actions";
import { CoverPicker } from "@/app/cover-picker";
import { PlatformPicker } from "@/app/platform-picker";
import { Button } from "@/components/button";
import { DeleteButton } from "@/components/delete-button";
import { Field, FieldGroup, Select, TextField } from "@/components/field";
import { FormError, FormFooter } from "@/components/form";
import { IconButton } from "@/components/icon-button";
import { Modal, useModal } from "@/components/modal";
import { StarPicker } from "@/components/star-picker";
import { SubmitButton } from "@/components/submit-button";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/statuses";
import { TopBarAction } from "./top-bar-action";

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
      <TopBarAction
        label="Add game"
        onClick={modal.openModal}
        icon={<Plus size={22} strokeWidth={2.25} aria-hidden="true" />}
      />

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
  // The field keeps what was typed (so it can be emptied) and the value is
  // clamped when it is read.
  const [progressText, setProgressText] = useState(
    String(existing?.progress ?? 0),
  );
  const progress = Math.min(100, Number(progressText) || 0);
  const [platformIds, setPlatformIds] = useState<number[]>(
    existing?.platformIds ?? [],
  );
  const [coverUrl, setCoverUrl] = useState(existing?.coverUrl ?? "");
  const [error, setError] = useState<string>();

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
      <TextField
        label={props.mode === "add" ? "Title *" : "Title"}
        name="title"
        required
        maxLength={200}
        autoComplete="off"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

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
        <Select name="status" defaultValue={existing?.status ?? "backlog"}>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

      <FieldGroup legend="Progress">
        <div className="flex items-center gap-3">
          <input
            type="range"
            name="progress"
            min={0}
            max={100}
            step={1}
            value={progress}
            aria-label="Progress"
            onChange={(event) => setProgressText(event.target.value)}
            style={{ "--progress": `${progress}%` } as CSSProperties}
            className="progress-range min-w-0 flex-1"
          />

          <div className="relative w-20 shrink-0">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={progressText}
              aria-label="Progress percent"
              onChange={(event) =>
                setProgressText(
                  event.target.value.replace(/\D/g, "").slice(0, 3),
                )
              }
              onFocus={(event) => event.target.select()}
              onBlur={() => setProgressText(String(progress))}
              className="h-11 w-full border border-line bg-surface pl-3 pr-7 text-right text-base tabular-nums text-ink focus:border-accent"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-base text-muted"
            >
              %
            </span>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup legend="Rating">
        <StarPicker name="rating" value={rating} onChange={setRating} />
      </FieldGroup>

      <FormError message={error} />

      <FormFooter
        left={
          props.mode === "edit" ? (
            <DeleteButton
              onDelete={() => deleteGame(props.game.id)}
              onDone={props.onDone}
            />
          ) : undefined
        }
      >
        <Button variant="secondary" onClick={props.onDone}>
          Cancel
        </Button>
        <SubmitButton label={props.mode === "edit" ? "Save" : "Add game"} />
      </FormFooter>
    </form>
  );
}
