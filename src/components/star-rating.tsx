import { Star } from "lucide-react";
import { RATING_MAX } from "@/lib/rating";

/** Read-only star rating. The number is exposed to assistive tech only. */
export function StarRating({ value }: { value: number }) {
  return (
    <span
      role="img"
      aria-label={`Rated ${value} out of ${RATING_MAX}`}
      className="flex items-center gap-0.5"
    >
      {Array.from({ length: RATING_MAX }, (_, index) => {
        const filled = index < value;

        return (
          <Star
            key={index}
            size={12}
            strokeWidth={2}
            fill={filled ? "currentColor" : "none"}
            aria-hidden="true"
            className={filled ? "text-white" : "text-white/35"}
          />
        );
      })}
    </span>
  );
}
