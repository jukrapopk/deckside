"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { addPlatform, deletePlatform, updatePlatform } from "@/app/actions";
import { DialogForm } from "@/components/dialog-form";
import {
  FieldGroup,
  selectedControl,
  TextField,
} from "@/components/field";
import { IconButton } from "@/components/icon-button";
import { Modal, useModal } from "@/components/modal";
import type { Platform } from "@/db/schema";
import { PLATFORM_NAME_MAX_LENGTH } from "@/lib/limits";
import {
  DEFAULT_PLATFORM_ICON,
  isPlatformIconValue,
  PLATFORM_ICONS,
  type PlatformIconValue,
} from "@/lib/platforms";
import { CustomIconPicker } from "./custom-icon-picker";

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
        size="md"
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
  const [icon, setIcon] = useState<PlatformIconValue>(
    existing && isPlatformIconValue(existing.icon)
      ? existing.icon
      : DEFAULT_PLATFORM_ICON,
  );
  const [error, setError] = useState<string>();

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
    <DialogForm
      action={submit}
      error={error}
      onClose={props.onDone}
      onDelete={
        props.mode === "edit"
          ? () => deletePlatform(props.platform.id)
          : undefined
      }
      submitLabel={props.mode === "edit" ? "Save" : "Add platform"}
    >
      <TextField
        label="Name *"
        name="name"
        required
        maxLength={PLATFORM_NAME_MAX_LENGTH}
        autoComplete="off"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

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
                    ? selectedControl
                    : "border-line text-muted hover:text-ink"
                }`}
              >
                <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <CustomIconPicker value={icon} onChange={setIcon} />

        <input type="hidden" name="icon" value={icon} />
      </FieldGroup>
    </DialogForm>
  );
}
