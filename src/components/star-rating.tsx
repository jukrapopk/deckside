import { RATING_MAX } from "@/lib/rating";
import { StarGlyph } from "./star";

/** Read-only star rating. The number is exposed to assistive tech only. */
export function StarRating({ value }: { value: number }) {
  return (
    <span
      role="img"
      aria-label={`Rated ${value} out of ${RATING_MAX}`}
      className="flex items-center gap-1"
    >
      {Array.from({ length: RATING_MAX }, (_, index) => {
        const filled = index < value;

        return (
          <StarGlyph
            key={index}
            filled={filled}
            className={filled ? "text-white" : "text-white/35"}
          />
        );
      })}
    </span>
  );
}
