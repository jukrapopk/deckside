"use client";

import { Warning } from "@phosphor-icons/react";

export default function LibraryError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 px-6 py-20">
      <Warning size={36} weight="bold" aria-hidden="true" className="text-muted" />
      <h1 className="text-xl font-semibold">The library failed to load</h1>
      <p className="max-w-[55ch] text-base text-muted">
        The database query did not complete. This is usually temporary.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 bg-accent-strong px-5 py-3 text-base font-semibold text-white hover:brightness-110"
      >
        Try again
      </button>
    </div>
  );
}
