"use client";

import { Warning } from "@phosphor-icons/react";

export default function LibraryError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-3 px-4 py-16 sm:px-6">
      <Warning size={28} weight="bold" aria-hidden="true" className="text-muted" />
      <h1 className="text-lg font-semibold">The library failed to load</h1>
      <p className="max-w-[50ch] text-sm text-muted">
        The database query did not complete. This is usually temporary.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-1 rounded-[10px] bg-accent-strong px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
      >
        Try again
      </button>
    </div>
  );
}
