"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/button";

export default function LibraryError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 px-6 py-20">
      <TriangleAlert
        size={36}
        strokeWidth={1.75}
        aria-hidden="true"
        className="text-muted"
      />
      <h1 className="text-xl font-semibold">The library failed to load</h1>
      <p className="max-w-[55ch] text-base text-muted">
        The database query did not complete. This is usually temporary.
      </p>
      <Button variant="primary" className="mt-2" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
