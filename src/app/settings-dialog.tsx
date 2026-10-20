"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { clearSteamGridDbKey, saveSteamGridDbKey } from "@/app/actions";
import { AddPlatformDialog, EditPlatformDialog } from "./platform-dialog";
import { usePlatforms } from "./platforms-provider";
import { Button } from "@/components/button";
import { TextField } from "@/components/field";
import { FormError, FormFooter } from "@/components/form";
import { Modal, useModal } from "@/components/modal";
import { PlatformIcon } from "@/components/platform-icon";
import { SubmitButton } from "@/components/submit-button";
import { TopBarAction } from "./top-bar-action";

/**
 * Settings live in the top bar because they belong to the library, not to a
 * game. The key is write-only here: it goes in, and the browser never gets it
 * back — the form shows only whether one is saved.
 */
export function SettingsDialog({ hasKey }: { hasKey: boolean }) {
  const modal = useModal();

  return (
    <>
      <TopBarAction
        label="Settings"
        onClick={modal.openModal}
        icon={<SettingsIcon size={22} strokeWidth={2.25} aria-hidden="true" />}
      />

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
        <TextField
          label="SteamGridDB API key"
          name="apiKey"
          type="password"
          autoComplete="off"
          spellCheck={false}
          disabled={hasKey}
          value={hasKey ? "***************" : undefined}
          placeholder="Paste your key"
          className="disabled:text-muted"
        />

        {hasKey && (
          <Button
            variant="link"
            size="none"
            className="self-start"
            disabled={removing}
            onClick={() =>
              startRemove(() => clearSteamGridDbKey().then(onDone))
            }
          >
            {removing ? "Removing" : "Remove key"}
          </Button>
        )}
      </div>

      <FormError message={error} />

      <FormFooter>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        {!hasKey && <SubmitButton label="Save" />}
      </FormFooter>
    </form>
  );
}
