import { GRID_COLS, GRID_TILE } from "@/lib/grid";

export function TopBarSkeleton() {
  return (
    <header className="border-b border-line">
      <div className="flex items-stretch">
        <div className="flex h-16 flex-1 items-center gap-4 px-5">
          <div className="size-5 shrink-0 animate-pulse bg-surface-2 motion-reduce:animate-none" />
          <div className="h-5 w-56 animate-pulse bg-surface-2 motion-reduce:animate-none" />
        </div>
        <div className="size-16 shrink-0 border-l border-line" />
        <div className="size-16 shrink-0 border-l border-line" />
      </div>
    </header>
  );
}

export function GameGridSkeleton() {
  return (
    <div className="flex flex-col" aria-hidden="true">
      <div className="border-b border-line px-5 py-3">
        <div className="h-5 w-24 animate-pulse bg-surface-2 motion-reduce:animate-none" />
      </div>
      {/* Tiles carry the same shape as a card, so nothing moves on arrival. */}
      <div className={GRID_COLS}>
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className={`${GRID_TILE} animate-pulse motion-reduce:animate-none`}
          />
        ))}
      </div>
    </div>
  );
}
