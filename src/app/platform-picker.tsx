"use client";

import { PlatformIcon } from "@/components/platform-icon";
import { usePlatforms } from "./platforms-provider";

/**
 * Multi-select from the list maintained in Settings. Plain toggle buttons,
 * with the chosen ids mirrored into hidden inputs by the form so the server
 * action reads them like any other field.
 */
export function PlatformPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const platforms = usePlatforms();

  if (platforms.length === 0) {
    return (
      <p className="text-sm text-muted">
        No platforms yet. Add them in Settings.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => {
        const selected = value.includes(platform.id);

        return (
          <button
            key={platform.id}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onChange(
                selected
                  ? value.filter((id) => id !== platform.id)
                  : [...value, platform.id],
              )
            }
            className={`flex items-center gap-2 border px-3 py-2 text-base transition-colors motion-reduce:transition-none ${
              selected
                ? "border-accent-strong bg-accent-strong text-white"
                : "border-line text-ink hover:border-accent"
            }`}
          >
            <PlatformIcon icon={platform.icon} />
            {platform.name}
          </button>
        );
      })}
    </div>
  );
}
