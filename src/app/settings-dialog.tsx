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
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { checkSteamGridDbKey, saveSteamGridDbKey } from "@/app/actions";
import { Button } from "@/components/button";
import { controlAction, inputClass } from "@/components/field";
import { FormError, FormFooter } from "@/components/form";
import { Modal, useModal } from "@/components/modal";
import { PlatformIcon } from "@/components/platform-icon";
import { AddPlatformDialog, EditPlatformDialog } from "./platform-dialog";
import { usePlatforms } from "./platforms-provider";
import { TopBarAction } from "./top-bar-action";

/**
 * Settings live in the top bar because they belong to the library, not to a
 * game. The saved key never leaves the server: the form only ever learns
 * whether one exists.
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
            <span className="flex min-w-0 items-center gap-3">
              <PlatformIcon icon={platform.icon} className="shrink-0" />
              <span className="truncate">{platform.name}</span>
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

type CheckResult = { ok: boolean; message: string };

function Spinner() {
  return (
    <LoaderCircle
      size={18}
      strokeWidth={2.25}
      aria-hidden="true"
      className="animate-spin motion-reduce:animate-none"
    />
  );
}

function KeyActionButton({
  label,
  title = label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${controlAction} ${className}`}
    >
      {children}
    </button>
  );
}

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
  const [checkResult, setCheckResult] = useState<CheckResult>();
  const [checking, startCheck] = useTransition();
  const [saving, startSave] = useTransition();
  const keyInput = useRef<HTMLInputElement>(null);

  const editable = !hasKey || editing;
  const canCheck = (hasKey && !editing) || key.trim().length > 0;
  const checkFailed = checkResult?.ok === false;
  const checkPassed = checkResult?.ok === true;
  const checkLabel = "Check API key";
  const checkTitle = checkFailed
    ? checkResult.message
    : checkPassed
      ? "API key works — check again"
      : "Check API key";

  useEffect(() => {
    if (editing) keyInput.current?.focus();
  }, [editing]);

  function clearFeedback() {
    setSaveError(undefined);
    setCheckResult(undefined);
  }

  function startEditing() {
    setEditing(true);
    setKey("");
    clearFeedback();
  }

  function changeKey(value: string) {
    setKey(value);
    clearFeedback();
  }

  function checkKey() {
    clearFeedback();

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
    clearFeedback();

    startSave(async () => {
      const result = await saveSteamGridDbKey(key);

      if (!result.ok) {
        setSaveError(result.error);
        return;
      }

      // Stay open; the refreshed `hasKey` decides whether the field is masked.
      setEditing(false);
      setKey("");
      clearFeedback();
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
            <KeyActionButton
              label="Save API key"
              onClick={saveKey}
              disabled={saving || checking}
              className="bg-accent-strong text-white transition-[filter] hover:brightness-110 disabled:opacity-60 motion-reduce:transition-none"
            >
              {saving ? (
                <Spinner />
              ) : (
                <Save size={18} strokeWidth={2.25} aria-hidden="true" />
              )}
            </KeyActionButton>
          ) : (
            <KeyActionButton
              label="Edit API key"
              onClick={startEditing}
              className="border border-line text-muted transition-colors hover:border-accent hover:text-ink motion-reduce:transition-none"
            >
              <Pencil size={18} strokeWidth={2.25} aria-hidden="true" />
            </KeyActionButton>
          )}

          <KeyActionButton
            label={checkLabel}
            title={checkTitle}
            onClick={checkKey}
            disabled={checking || saving || !canCheck}
            className={`border transition-[color,background-color,border-color,filter] disabled:opacity-60 motion-reduce:transition-none ${
              checkFailed
                ? "border-danger-strong bg-danger-strong text-white hover:brightness-110"
                : checkPassed
                  ? "border-status-completed bg-status-completed text-white hover:brightness-110"
                  : "border-line text-muted hover:border-accent hover:text-ink"
            }`}
          >
            {checking ? (
              <Spinner />
            ) : checkFailed ? (
              <X size={18} strokeWidth={2.5} aria-hidden="true" />
            ) : checkPassed ? (
              <Check size={18} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <RefreshCw size={18} strokeWidth={2.25} aria-hidden="true" />
            )}
          </KeyActionButton>
        </div>

        {checkResult && (
          <p
            role="status"
            className={`break-words text-sm ${checkFailed ? "text-danger" : "text-muted"}`}
          >
            {checkResult.message}
          </p>
        )}
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
