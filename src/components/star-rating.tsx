import { Star } from "@phosphor-icons/react/dist/ssr";
import { RATING_MAX } from "@/lib/rating";

/** Read-only star rating. The number is exposed to assistive tech only. */
export function StarRating({
  value,
  size = 12,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`Rated ${value} out of ${RATING_MAX}`}
      className={`flex items-center gap-0.5 ${className}`}
    >
      {Array.from({ length: RATING_MAX }, (_, index) => {
        const filled = index < value;

        return (
          <Star
            key={index}
            size={size}
            weight={filled ? "fill" : "regular"}
            aria-hidden="true"
            className={filled ? "text-white" : "text-white/35"}
          />
        );
      })}
    </span>
  );
}
