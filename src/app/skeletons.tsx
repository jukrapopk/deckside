export function TopBarSkeleton() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
        <span className="font-semibold tracking-tight text-muted">
          Game Library
        </span>
        <div className="ml-auto h-9 w-32 animate-pulse rounded-[10px] bg-surface-2 motion-reduce:animate-none" />
      </div>
      <div className="mx-auto flex max-w-[1400px] gap-2 px-4 pb-3 sm:px-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-7 w-24 animate-pulse rounded-full bg-surface-2 motion-reduce:animate-none"
          />
        ))}
      </div>
    </header>
  );
}

export function GameGridSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="h-4 w-20 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="aspect-2/3 animate-pulse rounded-[10px] bg-surface-2 motion-reduce:animate-none" />
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
