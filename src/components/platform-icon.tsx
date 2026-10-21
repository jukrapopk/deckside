"use client";

import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { isLucideIconName } from "@/lib/lucide-catalog";
import { customIconName, platformIcon } from "@/lib/platforms";

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
  const custom = customIconName(icon);

  // A stored name is checked against this build's catalogue first, so a row
  // written by an older version falls back to the preset default instead of a
  // console error and an empty slot.
  if (custom && isLucideIconName(custom)) {
    // The dynamic component draws nothing until its chunk resolves. At 18px that
    // gap is a frame or two; a placeholder glyph would swap shape twice.
    return (
      <DynamicIcon
        name={custom as IconName}
        size={size}
        strokeWidth={2.25}
        aria-hidden="true"
        className={className}
      />
    );
  }

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
