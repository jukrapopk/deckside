import {
  Cloud,
  Gamepad,
  Gamepad2,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Tv,
  type LucideIcon,
} from "lucide-react";

/*
  Platform icons are stored as a key, not as a component, so the database stays
  portable and an unknown key can fall back instead of breaking a card. The
  set is deliberately small: these are the shapes that read at 18px on a tile.
*/
export const PLATFORM_ICONS = [
  { key: "monitor", label: "Desktop", icon: Monitor },
  { key: "laptop", label: "Laptop", icon: Laptop },
  { key: "console", label: "Console", icon: Gamepad2 },
  { key: "handheld", label: "Handheld", icon: Gamepad },
  { key: "phone", label: "Phone", icon: Smartphone },
  { key: "tablet", label: "Tablet", icon: Tablet },
  { key: "tv", label: "TV", icon: Tv },
  { key: "cloud", label: "Cloud", icon: Cloud },
] as const;

export type PlatformIconKey = (typeof PLATFORM_ICONS)[number]["key"];

export const DEFAULT_PLATFORM_ICON: PlatformIconKey = "console";

export function isPlatformIcon(value: string): value is PlatformIconKey {
  return PLATFORM_ICONS.some((option) => option.key === value);
}

export function platformIcon(key: string): LucideIcon {
  return (
    PLATFORM_ICONS.find((option) => option.key === key) ??
    PLATFORM_ICONS.find((option) => option.key === DEFAULT_PLATFORM_ICON)!
  ).icon;
}
