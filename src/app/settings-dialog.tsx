"use client";

import {
  Check,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { checkSteamGridDbKey, saveSteamGridDbKey } from "@/app/actions";
import { AddPlatformDialog, EditPlatformDialog } from "./platform-dialog";
import { usePlatforms } from "./platforms-provider";
import { Button } from "@/components/button";
import { inputClass } from "@/components/field";
import { FormError, FormFooter } from "@/components/form";
import { Modal, useModal } from "@/components/modal";
import { PlatformIcon } from "@/components/platform-icon";
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
          <KeySettings
            key={modal.open ? "open" : "closed"}
            hasKey={hasKey}
            onDone={modal.closeModal}
          />
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

const MASKED_KEY = "***************";

function KeySettings({
  hasKey,
  onDone,
}: {
  hasKey: boolean;
  onDone: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [key, setKey] = useState("");
  const [saveError, setSaveError] = useState<string>();
  const [checkResult, setCheckResult] = useState<{
    ok: boolean;
    message: string;
  }>();
  const [checking, startCheck] = useTransition();
  const [saving, startSave] = useTransition();
  const keyInput = useRef<HTMLInputElement>(null);

  const editable = !hasKey || editing;
  const canCheck = hasKey && !editing ? true : key.trim().length > 0;
  const checkFailed = checkResult?.ok === false;
  const checkPassed = checkResult?.ok === true;
  const checkLabel = checking
    ? "Checking API key"
    : checkFailed
      ? "API key check failed"
      : checkPassed
        ? "API key works"
        : "Check API key";
  const checkTitle = checkFailed ? checkResult.message : checkLabel;

  useEffect(() => {
    if (editing) keyInput.current?.focus();
  }, [editing]);

  function startEditing() {
    setEditing(true);
    setKey("");
    setSaveError(undefined);
    setCheckResult(undefined);
  }

  function changeKey(value: string) {
    setKey(value);
    setSaveError(undefined);
    setCheckResult(undefined);
  }

  function checkKey() {
    setSaveError(undefined);
    setCheckResult(undefined);

    startCheck(async () => {
      const result = await checkSteamGridDbKey(editable ? key : undefined);

      setCheckResult(
        result.ok
          ? { ok: true, message: "Key works." }
          : {
              ok: false,
              message: result.error ?? "Could not check that key.",
            },
      );
    });
  }

  function saveKey() {
    setSaveError(undefined);
    setCheckResult(undefined);

    startSave(async () => {
      const result = await saveSteamGridDbKey(key);

      if (!result.ok) {
        setSaveError(result.error);
        return;
      }

      // Stay open: the saved key is now masked and the pencil returns.
      setEditing(false);
      setKey("");
      setCheckResult(undefined);
    });
  }

  return (
    <div className="flex flex-col gap-5 border-t border-line pt-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="steamgriddb-key"
          className="text-sm font-medium text-muted"
        >
          SteamGridDB API key
        </label>

        <div className="flex items-center gap-2">
          {/* Text, not password: the saved key never reaches the browser, so
              the literal asterisk mask stays consistent with the edit state. */}
          <input
            ref={keyInput}
            id="steamgriddb-key"
            type="text"
            autoComplete="off"
            spellCheck={false}
            disabled={!editable}
            value={editable ? key : MASKED_KEY}
            onChange={(event) => changeKey(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && key.trim() && !saving && !checking) {
                event.preventDefault();
                saveKey();
              }
            }}
            placeholder={hasKey ? MASKED_KEY : undefined}
            className={`${inputClass} min-w-0 flex-1 disabled:text-muted`}
          />

          {editable ? (
            <button
              type="button"
              aria-label="Save API key"
              title="Save API key"
              onClick={saveKey}
              disabled={saving || checking}
              className="flex size-[50px] shrink-0 items-center justify-center bg-accent-strong text-white transition-[filter] hover:brightness-110 disabled:opacity-60 motion-reduce:transition-none"
            >
              {saving ? (
                <LoaderCircle
                  size={18}
                  strokeWidth={2.25}
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Save size={18} strokeWidth={2.25} aria-hidden="true" />
              )}
            </button>
          ) : (
            <button
              type="button"
              aria-label="Edit API key"
              title="Edit API key"
              onClick={startEditing}
              className="flex size-[50px] shrink-0 items-center justify-center border border-line text-muted transition-colors hover:border-accent hover:text-ink motion-reduce:transition-none"
            >
              <Pencil size={18} strokeWidth={2.25} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            aria-label={checkLabel}
            title={checkTitle}
            onClick={checkKey}
            disabled={checking || saving || !canCheck}
            className={`flex size-[50px] shrink-0 items-center justify-center text-white transition-[background-color,filter] hover:brightness-110 disabled:opacity-60 motion-reduce:transition-none ${
              checkFailed ? "bg-danger-strong" : "bg-status-completed"
            }`}
          >
            {checking ? (
              <LoaderCircle
                size={18}
                strokeWidth={2.25}
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : checkFailed ? (
              <X size={18} strokeWidth={2.5} aria-hidden="true" />
            ) : checkPassed ? (
              <Check size={18} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <RefreshCw size={18} strokeWidth={2.25} aria-hidden="true" />
            )}
          </button>
        </div>

        <span className="sr-only" role="status">
          {checking ? "Checking API key" : checkResult?.message}
        </span>
      </div>

      <FormError message={saveError} />

      <FormFooter>
        <Button variant="outline" onClick={onDone}>
          Done
        </Button>
      </FormFooter>
    </div>
  );
}
