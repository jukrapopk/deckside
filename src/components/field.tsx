import type { ReactNode } from "react";

/** Shared input styling so every control matches across dialogs. */
export const inputClass =
  "w-full border border-line bg-surface px-3 py-3 text-base text-ink placeholder:text-muted focus:border-accent";

/** Label above the control, per the form conventions. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-muted">
      {label}
      {children}
    </label>
  );
}

/** For control groups that are not a single labelled input (radios, custom). */
export function FieldGroup({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-muted">{legend}</legend>
      {children}
    </fieldset>
  );
}
