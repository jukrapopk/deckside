import type { ComponentProps, ReactNode } from "react";

/** Shared input styling so every control matches across dialogs. */
export const inputClass =
  "w-full border border-line bg-surface px-3 py-3 text-base text-ink placeholder:text-muted focus:border-accent";

/** The height shared by a field row's input and its square actions. */
export const controlHeight = "h-[50px]";

/** A square action that sits on a field row, beside the input. */
export const controlAction =
  "flex size-[50px] shrink-0 items-center justify-center";

/** The filled state of a selectable field control. */
export const selectedControl =
  "border-accent-strong bg-accent-strong text-white";

/** The app's select: field chrome plus a chevron inset from the right edge. */
export function Select({
  className = "",
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <select className={`${inputClass} select-chevron ${className}`} {...props}>
      {children}
    </select>
  );
}

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

/** A labelled text input; `className` adds to the input, not the label. */
export function TextField({
  label,
  className = "",
  ...props
}: { label: string } & ComponentProps<"input">) {
  return (
    <Field label={label}>
      <input className={`${inputClass} ${className}`} {...props} />
    </Field>
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
      {/* A rendered legend is laid out in the fieldset's border area rather
          than as a flex item, so the gap never opens between it and the
          controls. The margin supplies the same 8px the other fields get. */}
      <legend className="mb-2 text-sm font-medium text-muted">{legend}</legend>
      {children}
    </fieldset>
  );
}
