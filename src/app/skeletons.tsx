import { GRID_COLS, GRID_TILE } from "@/lib/grid";

export function TopBarSkeleton() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
      <div className="flex items-stretch">
        {/* The placeholder bar has to shrink with the search field; a fixed
            width here overflowed the header on narrow phones. */}
        <div className="flex h-16 min-w-0 flex-1 items-center gap-4 px-5">
          <div className="size-5 shrink-0 animate-pulse bg-surface-2 motion-reduce:animate-none" />
          <div className="h-5 min-w-0 max-w-56 flex-1 animate-pulse bg-surface-2 motion-reduce:animate-none" />
        </div>
        <div className="size-16 shrink-0 border-l border-line" />
        <div className="size-16 shrink-0 border-l border-line" />
        <div className="size-16 shrink-0 border-l border-line" />
      </div>
    </header>
  );
}

export function GameGridSkeleton() {
  return (
    /* Tiles carry the same shape as a card, so nothing moves on arrival. */
    <div className={GRID_COLS} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className={`${GRID_TILE} animate-pulse motion-reduce:animate-none`}
        />
      ))}
    </div>
  );
}
