import { Star } from "lucide-react";

/** One star at the app's reading weight; the caller supplies the colour. */
export function StarGlyph({
  filled,
  className = "",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <Star
      size={16}
      strokeWidth={2}
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
      className={className}
    />
  );
}
