"use client";

import { GameGrid } from "@/app/game-grid";
import { TopBar } from "@/app/top-bar";
import { ViewProvider } from "@/app/view-provider";
import { DemoLibraryProvider } from "./provider";

/**
 * The public demo is deliberately its own client tree. It shares presentation
 * and form validation with the SQLite app, but none of its data or actions.
 */
export function DemoLibrary() {
  return (
    <ViewProvider storageKey="deckside:demo:view">
      <DemoLibraryProvider>
        <div className="flex min-h-[100dvh] flex-col">
          <h1 className="sr-only">Deckside demo</h1>
          <p className="border-b border-line bg-surface px-5 py-2 text-sm text-muted">
            Demo library. Changes stay in this browser.
          </p>

          <TopBar />

          <main className="flex-1">
            <GameGrid />
          </main>
        </div>
      </DemoLibraryProvider>
    </ViewProvider>
  );
}
