"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { clearSteamGridDbKey, saveSteamGridDbKey } from "@/app/actions";
import { AddPlatformDialog, EditPlatformDialog } from "./platform-dialog";
import { usePlatforms } from "./platforms-provider";
import { Field, inputClass } from "@/components/field";
import { IconButton } from "@/components/icon-button";
import { Modal, useModal } from "@/components/modal";
import { PlatformIcon } from "@/components/platform-icon";
import { SubmitButton } from "@/components/submit-button";

/**
 * Settings live in the top bar because they belong to the library, not to a
 * game. The key is write-only here: it goes in, and the browser never gets it
 * back — the form shows only whether one is saved.
 */
export function SettingsDialog({ hasKey }: { hasKey: boolean }) {
  const modal = useModal();

  return (
    <>
      <div className="border-l border-line">
        <IconButton
          label="Settings"
          size="lg"
          onClick={modal.openModal}
          icon={<SettingsIcon size={22} strokeWidth={2.25} aria-hidden="true" />}
        />
      </div>

      <Modal open={modal.open} onClose={modal.closeModal} title="Settings">
        <div className="flex flex-col gap-6">
          <PlatformSettings />
          <SettingsForm hasKey={hasKey} onDone={modal.closeModal} />
        </div>
      </Modal>
    </>
  );
}

/** The list games choose from; adding and editing happen in their own dialog. */
function PlatformSettings() {
  const platforms = usePlatforms();

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">Platforms</h3>

      <ul className="flex flex-col divide-y divide-line border border-line">
        {platforms.map((platform) => (
          <li
            key={platform.id}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <span className="flex items-center gap-3">
              <PlatformIcon icon={platform.icon} />
              {platform.name}
            </span>
            <EditPlatformDialog platform={platform} />
          </li>
        ))}
        <li>
          <AddPlatformDialog />
        </li>
      </ul>
    </section>
  );
}

function SettingsForm({
  hasKey,
  onDone,
}: {
  hasKey: boolean;
  onDone: () => void;
}) {
  const [error, setError] = useState<string>();
  const [removing, startRemove] = useTransition();

  async function submit(formData: FormData) {
    const result = await saveSteamGridDbKey(formData);

    if (result.ok) {
      onDone();
      return;
    }

    setError(result.error);
  }

  return (
    <form
      action={submit}
      className="flex flex-col gap-5 border-t border-line pt-6"
    >
      <div className="flex flex-col gap-2">
        <Field label="SteamGridDB API key">
          <input
            name="apiKey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            disabled={hasKey}
            value={hasKey ? "***************" : undefined}
            placeholder="Paste your key"
            className={`${inputClass} disabled:text-muted`}
          />
        </Field>

        {hasKey && (
          <button
            type="button"
            disabled={removing}
            onClick={() =>
              startRemove(() => clearSteamGridDbKey().then(onDone))
            }
            className="self-start text-sm text-muted hover:text-ink disabled:opacity-40"
          >
            {removing ? "Removing" : "Remove key"}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-base text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
        <span />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDone}
            className="border border-line px-5 py-3 text-base font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
          {!hasKey && <SubmitButton label="Save" />}
        </div>
      </div>
    </form>
  );
}
