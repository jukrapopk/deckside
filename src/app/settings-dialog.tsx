"use client";

import { Settings as SettingsIcon, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import {
  addPlatform,
  clearSteamGridDbKey,
  deletePlatform,
  saveSteamGridDbKey,
} from "@/app/actions";
import { usePlatforms } from "./platforms-provider";
import { Field, inputClass } from "@/components/field";
import { IconButton } from "@/components/icon-button";
import { Modal, useModal } from "@/components/modal";
import { PlatformIcon } from "@/components/platform-icon";
import { SubmitButton } from "@/components/submit-button";
import {
  DEFAULT_PLATFORM_ICON,
  PLATFORM_ICONS,
  type PlatformIconKey,
} from "@/lib/platforms";

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

/** The list games choose from, with the icon that stands for each on a tile. */
function PlatformSettings() {
  const platforms = usePlatforms();
  const [error, setError] = useState<string>();
  const [icon, setIcon] = useState<PlatformIconKey>(DEFAULT_PLATFORM_ICON);
  const [removing, startRemove] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  async function add(formData: FormData) {
    const result = await addPlatform(formData);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(undefined);
    setIcon(DEFAULT_PLATFORM_ICON);
    if (nameRef.current) nameRef.current.value = "";
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">Platforms</h3>
      <p className="text-sm text-muted">Games pick from this list.</p>

      {platforms.length > 0 ? (
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
              <button
                type="button"
                aria-label={`Remove ${platform.name}`}
                disabled={removing}
                onClick={() => startRemove(() => deletePlatform(platform.id))}
                className="flex size-8 items-center justify-center text-muted hover:text-danger disabled:opacity-40"
              >
                <Trash2 size={16} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No platforms yet.</p>
      )}

      <form action={add} className="flex flex-col gap-3">
        <input
          ref={nameRef}
          name="name"
          autoComplete="off"
          maxLength={40}
          placeholder="New platform"
          aria-label="New platform name"
          className={inputClass}
        />

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

        {error && (
          <p role="alert" className="text-base text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="self-start border border-line px-4 py-2 text-base font-medium hover:border-accent"
        >
          Add platform
        </button>
      </form>
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
