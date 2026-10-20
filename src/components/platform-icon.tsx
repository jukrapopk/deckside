import { platformIcon } from "@/lib/platforms";

/** The platform's chosen glyph, sized for the row it sits in. */
export function PlatformIcon({
  icon,
  size = 18,
  className = "",
}: {
  icon: string;
  size?: number;
  className?: string;
}) {
  const Icon = platformIcon(icon);

  return (
    <Icon
      size={size}
      strokeWidth={2.25}
      aria-hidden="true"
      className={className}
    />
  );
}
