"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { clearSteamGridDbKey, saveSteamGridDbKey } from "@/app/actions";
import { Field, inputClass } from "@/components/field";
import { IconButton } from "@/components/icon-button";
import { Modal, useModal } from "@/components/modal";
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

      <Modal
        open={modal.open}
        onClose={modal.closeModal}
        title="Settings"
        description="Cover art and local preferences."
      >
        <SettingsForm hasKey={hasKey} onDone={modal.closeModal} />
      </Modal>
    </>
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
    <form action={submit} className="flex flex-col gap-5">
      <Field label="SteamGridDB API key">
        <input
          name="apiKey"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={
            hasKey
              ? "A key is saved — enter a new one to replace it"
              : "Paste your key"
          }
          className={inputClass}
        />
      </Field>

      <p className="text-sm text-muted">
        Used to search cover art in the edit dialog. Create a key on the{" "}
        <a
          href="https://www.steamgriddb.com/profile/preferences"
          target="_blank"
          rel="noreferrer"
          className="text-ink underline underline-offset-2 hover:text-white"
        >
          SteamGridDB preferences page
        </a>
        .
      </p>

      {error && (
        <p role="alert" className="text-base text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
        {hasKey ? (
          <button
            type="button"
            disabled={removing}
            onClick={() =>
              startRemove(() => clearSteamGridDbKey().then(onDone))
            }
            className="px-1 py-3 text-base font-medium text-muted hover:text-danger disabled:opacity-60"
          >
            {removing ? "Removing" : "Remove key"}
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDone}
            className="border border-line px-5 py-3 text-base font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
          <SubmitButton label="Save" />
        </div>
      </div>
    </form>
  );
}
