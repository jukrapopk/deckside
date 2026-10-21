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

/** The shared shape of a platform, independent of where it is stored. */
export type Platform = {
  id: number;
  name: string;
  icon: string;
};

/*
  Platform icons are stored as a value, not as a component, so the database stays
  portable and an unknown value can fall back instead of breaking a card.

  The presets are deliberately few: these are the shapes that read at 18px on a
  tile, and they cover most of a library in one tap. Anything else is stored as
  `lucide:<name>` and drawn from the full Lucide catalogue, which the picker
  searches. The prefix separates the two forms, so the column and the preset
  keys needed no migration.
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

/** Marks a value as a full Lucide name instead of one of the presets. */
export const CUSTOM_ICON_PREFIX = "lucide:";

/**
 * A custom value is the prefix plus a kebab-case Lucide name. The longest name
 * in Lucide 1.59 is 38 characters; the limit leaves room for longer ones while
 * still bounding what a form can write to the column.
 */
const CUSTOM_ICON_PATTERN = /^lucide:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLATFORM_ICON_MAX_LENGTH = 56;

export type CustomPlatformIcon = `lucide:${string}`;
export type PlatformIconValue = PlatformIconKey | CustomPlatformIcon;

function isPlatformIcon(value: string): value is PlatformIconKey {
  return PLATFORM_ICONS.some((option) => option.key === value);
}

function isCustomPlatformIcon(value: string): value is CustomPlatformIcon {
  return (
    value.length <= PLATFORM_ICON_MAX_LENGTH && CUSTOM_ICON_PATTERN.test(value)
  );
}

export function isPlatformIconValue(
  value: string,
): value is PlatformIconValue {
  return isPlatformIcon(value) || isCustomPlatformIcon(value);
}

/** The Lucide name inside a custom value, or null for a preset. */
export function customIconName(value: string): string | null {
  return value.startsWith(CUSTOM_ICON_PREFIX)
    ? value.slice(CUSTOM_ICON_PREFIX.length)
    : null;
}

export function platformIcon(key: string): LucideIcon {
  return (
    PLATFORM_ICONS.find((option) => option.key === key) ??
    PLATFORM_ICONS.find((option) => option.key === DEFAULT_PLATFORM_ICON)!
  ).icon;
}

/** The list as a lookup, for resolving the ids stored on a game. */
export function indexPlatforms(platforms: Platform[]): Map<number, Platform> {
  return new Map(platforms.map((platform) => [platform.id, platform]));
}

/** A game's platforms, skipping ids whose platform has since been deleted. */
export function platformsOf(
  game: { platformIds: number[] },
  byId: Map<number, Platform>,
): Platform[] {
  return game.platformIds
    .map((id) => byId.get(id))
    .filter((platform): platform is Platform => Boolean(platform));
}
