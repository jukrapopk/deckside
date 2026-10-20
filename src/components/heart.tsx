import { Heart } from "lucide-react";

/**
 * One heart, filled once a game is a favourite. An unfilled heart keeps the
 * edit pencil's 2.25 stroke. A filled heart drops the stroke: painting a
 * translucent fill and stroke in the same colour double-paints the edge, so
 * the outline reads brighter than the fill.
 */
export function HeartGlyph({
  filled,
  size = 18,
  className = "",
}: {
  filled: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <Heart
      size={size}
      strokeWidth={filled ? 0 : 2.25}
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
      className={className}
    />
  );
}
