import { Heart } from "lucide-react";

/**
 * One heart, filled once a game is a favourite. Matches the edit pencil's
 * weight so the tile and the form use the same mark.
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
      strokeWidth={2.25}
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
      className={className}
    />
  );
}
