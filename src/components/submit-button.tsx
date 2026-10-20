"use client";

import { useFormStatus } from "react-dom";

/** Submit button that reports the pending state of the form it belongs to. */
export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-accent-strong px-5 py-3 text-base font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60 motion-reduce:transition-none"
    >
      {pending ? "Saving" : label}
    </button>
  );
}
