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
  // `platformIcon` returns one of the module-level Lucide components, so the
  // identity is stable; nothing is created during render.
  const Icon = platformIcon(icon);

  return (
    // eslint-disable-next-line react-hooks/static-components
    <Icon
      size={size}
      strokeWidth={2.25}
      aria-hidden="true"
      className={className}
    />
  );
}
