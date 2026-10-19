"use client";

import { Star } from "@phosphor-icons/react";
import { RATING_MAX } from "@/lib/rating";

/** Star picker. Radios, so arrow keys work and the value posts as a field. */
export function StarPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number | null;
  onChange: (rating: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: RATING_MAX }, (_, index) => {
        const stars = index + 1;
        const filled = value !== null && stars <= value;

        return (
          <label key={stars} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={stars}
              checked={value === stars}
              onChange={() => onChange(stars)}
              className="peer sr-only"
            />
            <span
              className={`flex size-9 items-center justify-center border peer-focus-visible:border-2 peer-focus-visible:border-accent ${
                filled
                  ? "border-accent bg-accent-strong text-white"
                  : "border-line bg-surface text-muted peer-hover:text-ink"
              }`}
            >
              <Star
                size={16}
                weight={filled ? "fill" : "regular"}
                aria-hidden="true"
              />
            </span>
          </label>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={value === null}
        className="ml-1 px-2 py-1 text-sm text-muted hover:text-ink disabled:opacity-40"
      >
        Clear
      </button>
    </div>
  );
}
