"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { AddGameDialog } from "./add-game-dialog";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/statuses";

type Counts = { all: number } & Record<Status, number>;

type TopBarProps = {
  q: string;
  status?: Status;
  counts: Counts;
};

export function TopBar({ q, status, counts }: TopBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  function buildHref(nextQ: string, nextStatus?: Status) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus) params.set("status", nextStatus);
    const query = params.toString();
    return query ? `/?${query}` : "/";
  }

  function go(nextQ: string, nextStatus?: Status) {
    startTransition(() => router.push(buildHref(nextQ, nextStatus)));
  }

  return (
    <header
      className={`sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur transition-opacity motion-reduce:transition-none ${
        isPending ? "opacity-70" : ""
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <span className="font-semibold tracking-tight">Game Library</span>

        <form
          className="order-3 flex min-w-[12rem] flex-1 items-center gap-2 sm:order-2"
          onSubmit={(event) => {
            event.preventDefault();
            go(searchRef.current?.value ?? "", status);
          }}
        >
          <label htmlFor="library-search" className="sr-only">
            Search games
          </label>
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              weight="bold"
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="library-search"
              ref={searchRef}
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search title or platform"
              className="w-full rounded-[10px] border border-line bg-surface py-2 pl-9 pr-9 text-sm text-ink placeholder:text-muted focus:border-accent"
            />
            {q && (
              <Link
                href={buildHref("", status)}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
              >
                <X size={14} weight="bold" aria-hidden="true" />
              </Link>
            )}
          </div>
        </form>

        <div className="order-2 ml-auto sm:order-3">
          <AddGameDialog />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] items-center gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
        <FilterChip
          label="All"
          count={counts.all}
          active={!status}
          href={buildHref(q)}
          onSelect={() => go(searchRef.current?.value ?? q)}
        />
        {STATUSES.map((value) => (
          <FilterChip
            key={value}
            label={STATUS_LABELS[value]}
            count={counts[value]}
            active={status === value}
            href={buildHref(q, value)}
            onSelect={() => go(searchRef.current?.value ?? q, value)}
          />
        ))}
      </div>
    </header>
  );
}

function FilterChip({
  label,
  count,
  active,
  href,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  href: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      onClick={(event) => {
        // Keep whatever is typed in the search box when switching filters.
        event.preventDefault();
        onSelect();
      }}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors motion-reduce:transition-none ${
        active
          ? "border-accent bg-accent-strong text-white"
          : "border-line bg-surface text-muted hover:border-accent hover:text-ink"
      }`}
    >
      {label}
      <span className={active ? "text-white/80" : "text-muted"}>{count}</span>
    </Link>
  );
}
