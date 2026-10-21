"use client";

import { iconNames } from "lucide-react/dynamic";

/*
  The whole Lucide catalogue, for the surfaces that offer a custom icon. Importing
  it here rather than in `platforms.ts` keeps the name list off the server graph,
  where the actions only need the `lucide:` shape check.
*/
export const LUCIDE_ICON_NAMES: readonly string[] = iconNames;

const known = new Set<string>(iconNames);

/** A stored name is only drawn if this build of Lucide still ships it. */
export function isLucideIconName(name: string): boolean {
  return known.has(name);
}

/**
 * The first screen of the picker. Alphabetical order opens on arrow glyphs, so
 * the panel leads with the shapes a platform is likely to want; typing searches
 * the rest.
 */
export const SUGGESTED_ICON_NAMES = [
  // Screens and boxes.
  "pc-case",
  "monitor",
  "laptop",
  "tablet",
  "smartphone",
  "tv-minimal",
  "projector",
  "app-window",
  // Controllers and handhelds.
  "gamepad-2",
  "joystick",
  "watch",
  "headset",
  "glasses",
  "keyboard",
  "mouse",
  "speaker",
  // Media and capture.
  "camera",
  "radio-receiver",
  "satellite-dish",
  "disc",
  // Storage, network, and the rest.
  "hard-drive",
  "server",
  "router",
  "wifi",
  "cloud",
  "cpu",
  "memory-stick",
  "box",
  "terminal",
  "usb",
  "plug",
  "rocket",
] as const;
