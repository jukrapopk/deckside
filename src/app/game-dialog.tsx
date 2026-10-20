"use client";

import { Pencil, Plus } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { addGame, deleteGame, updateGame } from "@/app/actions";
import { CoverPicker } from "@/app/cover-picker";
import { PlatformPicker } from "@/app/platform-picker";
import { Button } from "@/components/button";
import { DialogForm } from "@/components/dialog-form";
import {
  controlAction,
  Field,
  FieldGroup,
  Select,
  TextField,
} from "@/components/field";
import { HeartGlyph } from "@/components/heart";
import { IconButton } from "@/components/icon-button";
import { Modal, useModal } from "@/components/modal";
import { StarPicker } from "@/components/star-picker";
import {
  PROGRESS_MAX,
  PROGRESS_MIN,
  TITLE_MAX_LENGTH,
} from "@/lib/limits";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/statuses";
import { TopBarAction } from "./top-bar-action";

export type GameValues = {
  id: number;
  title: string;
  platformIds: number[];
  status: Status;
  rating: number | null;
  favourite: boolean;
  progress: number;
  coverUrl: string | null;
};

export function AddGameDialog({
  trigger = "top-bar",
}: {
  trigger?: "top-bar" | "empty";
}) {
  const modal = useModal();

  return (
    <>
      {trigger === "top-bar" ? (
        <TopBarAction
          label="Add game"
          onClick={modal.openModal}
          icon={<Plus size={22} strokeWidth={2.25} aria-hidden="true" />}
        />
      ) : (
        <Button variant="primary" onClick={modal.openModal}>
          <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
          Add game
        </Button>
      )}

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
  const [favourite, setFavourite] = useState(existing?.favourite ?? false);
  // The field keeps what was typed (so it can be emptied) and the value is
  // clamped when it is read.
  const [progressText, setProgressText] = useState(
    String(existing?.progress ?? 0),
  );
  const progress = Math.min(PROGRESS_MAX, Number(progressText) || 0);
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
    <DialogForm
      action={submit}
      error={error}
      onClose={props.onDone}
      onDelete={
        props.mode === "edit" ? () => deleteGame(props.game.id) : undefined
      }
      submitLabel={props.mode === "edit" ? "Save" : "Add game"}
    >
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextField
            label={props.mode === "add" ? "Title *" : "Title"}
            name="title"
            required
            maxLength={TITLE_MAX_LENGTH}
            autoComplete="off"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        {/* The hidden value lets the toggle post with the rest of the form. */}
        <input
          type="hidden"
          name="favourite"
          value={favourite ? "1" : ""}
        />
        <button
          type="button"
          aria-label="Favourite"
          aria-pressed={favourite}
          title={favourite ? "Remove from favourites" : "Add to favourites"}
          onClick={() => setFavourite((value) => !value)}
          className={`${controlAction} border transition-colors motion-reduce:transition-none ${
            favourite
              ? "border-accent bg-accent-strong text-white"
              : "border-line bg-surface text-muted hover:border-accent hover:text-ink"
          }`}
        >
          <HeartGlyph filled={favourite} size={20} />
        </button>
      </div>

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
            min={PROGRESS_MIN}
            max={PROGRESS_MAX}
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
    </DialogForm>
  );
}
