"use client";

import { Button } from "@/components/button";
import { RATING_MAX } from "@/lib/rating";
import { StarGlyph } from "./star";

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
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {Array.from({ length: RATING_MAX }, (_, index) => {
        const stars = index + 1;
        const filled = value !== null && stars <= value;

        return (
          <label key={stars} className="group cursor-pointer">
            <input
              type="radio"
              name={name}
              value={stars}
              checked={value === stars}
              onChange={() => onChange(stars)}
              aria-label={`${stars} star${stars === 1 ? "" : "s"}`}
              className="peer sr-only"
            />
            <span
              className={`flex size-9 items-center justify-center border peer-focus-visible:border-2 peer-focus-visible:border-accent ${
                filled
                  ? "border-accent bg-accent-strong text-white"
                  : "border-line bg-surface text-muted group-hover:text-ink"
              }`}
            >
              <StarGlyph filled={filled} />
            </span>
          </label>
        );
      })}

      <Button
        variant="link"
        size="none"
        className="ml-1 px-2 py-1"
        onClick={() => onChange(null)}
        disabled={value === null}
      >
        Clear
      </Button>
    </div>
  );
}
