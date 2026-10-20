import type { ComponentProps, ReactNode } from "react";

/** Shared input styling so every control matches across dialogs. */
export const inputClass =
  "w-full border border-line bg-surface px-3 py-3 text-base text-ink placeholder:text-muted focus:border-accent";

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
  action,
  children,
}: {
  legend: string;
  /** Optional action aligned with the legend, such as Remove. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      {action ? (
        <>
          <legend className="sr-only">{legend}</legend>
          <div className="flex items-center justify-between gap-3 text-sm font-medium text-muted">
            <span>{legend}</span>
            {action}
          </div>
        </>
      ) : (
        /* A rendered legend is laid out in the fieldset's border area rather
            than as a flex item, so the gap never opens between it and the
            controls. The margin supplies the same 8px the other fields get. */
        <legend className="mb-2 text-sm font-medium text-muted">{legend}</legend>
      )}
      {children}
    </fieldset>
  );
}
