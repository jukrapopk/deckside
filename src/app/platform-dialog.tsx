"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addPlatform, deletePlatform, updatePlatform } from "@/app/actions";
import { Field, FieldGroup, inputClass } from "@/components/field";
import { IconButton } from "@/components/icon-button";
import { Modal, useModal } from "@/components/modal";
import { SubmitButton } from "@/components/submit-button";
import type { Platform } from "@/db/schema";
import {
  DEFAULT_PLATFORM_ICON,
  isPlatformIcon,
  PLATFORM_ICONS,
  type PlatformIconKey,
} from "@/lib/platforms";

export function AddPlatformDialog() {
  const modal = useModal();
  // Remount on open, not on close: the fade-out should keep what the user
  // last saw instead of snapping back to an empty form.
  const [session, setSession] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSession((value) => value + 1);
          modal.openModal();
        }}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-base font-medium text-muted hover:bg-surface-2 hover:text-ink"
      >
        Add platform
        <span className="flex size-8 items-center justify-center">
          <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
        </span>
      </button>

      <Modal open={modal.open} onClose={modal.closeModal} title="Add platform">
        <PlatformForm key={session} mode="add" onDone={modal.closeModal} />
      </Modal>
    </>
  );
}

export function EditPlatformDialog({ platform }: { platform: Platform }) {
  const modal = useModal();
  const [session, setSession] = useState(0);

  return (
    <>
      <IconButton
        label={`Edit ${platform.name}`}
        size="sm"
        onClick={() => {
          setSession((value) => value + 1);
          modal.openModal();
        }}
        icon={<Pencil size={16} strokeWidth={2.25} aria-hidden="true" />}
      />

      <Modal open={modal.open} onClose={modal.closeModal} title={platform.name}>
        <PlatformForm
          key={session}
          mode="edit"
          platform={platform}
          onDone={modal.closeModal}
        />
      </Modal>
    </>
  );
}

type PlatformFormProps =
  | { mode: "add"; onDone: () => void }
  | { mode: "edit"; platform: Platform; onDone: () => void };

function PlatformForm(props: PlatformFormProps) {
  const existing = props.mode === "edit" ? props.platform : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState<PlatformIconKey>(
    existing && isPlatformIcon(existing.icon)
      ? existing.icon
      : DEFAULT_PLATFORM_ICON,
  );
  const [error, setError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  async function submit(formData: FormData) {
    const result =
      props.mode === "edit"
        ? await updatePlatform(props.platform.id, formData)
        : await addPlatform(formData);

    if (result.ok) {
      props.onDone();
      return;
    }

    setError(result.error);
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      <Field label="Name">
        <input
          name="name"
          required
          maxLength={40}
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
      </Field>

      <FieldGroup legend="Icon">
        <div className="grid grid-cols-4 gap-2">
          {PLATFORM_ICONS.map(({ key, label, icon: Icon }) => {
            const active = key === icon;

            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                aria-label={label}
                title={label}
                onClick={() => setIcon(key)}
                className={`flex h-12 items-center justify-center border transition-colors motion-reduce:transition-none ${
                  active
                    ? "border-accent-strong bg-accent-strong text-white"
                    : "border-line text-muted hover:text-ink"
                }`}
              >
                <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <input type="hidden" name="icon" value={icon} />
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
                    deletePlatform(props.platform.id).then(props.onDone),
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
          <SubmitButton label={props.mode === "edit" ? "Save" : "Add platform"} />
        </div>
      </div>
    </form>
  );
}
