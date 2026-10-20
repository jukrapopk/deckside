"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Platform } from "@/db/schema";

const PlatformsContext = createContext<Platform[] | null>(null);

/**
 * The platform list is a setting, so every game-picking surface needs the same
 * copy of it. It arrives from the server with each render, which keeps a
 * Settings change one refresh away from every dialog and card.
 */
export function PlatformsProvider({
  platforms,
  children,
}: {
  platforms: Platform[];
  children: ReactNode;
}) {
  return (
    <PlatformsContext.Provider value={platforms}>
      {children}
    </PlatformsContext.Provider>
  );
}

export function usePlatforms(): Platform[] {
  const platforms = useContext(PlatformsContext);
  if (!platforms) {
    throw new Error("usePlatforms must be used inside PlatformsProvider");
  }
  return platforms;
}
