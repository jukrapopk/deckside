"use client";

import { Filter, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AddGameDialog } from "./game-dialog";
import { IconButton } from "@/components/icon-button";
import { STATUSES, STATUS_LABELS, type Status, type StatusCounts } from "@/lib/statuses";

type TopBarProps = {
  q: string;
  status?: Status;
  counts: StatusCounts;
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

  const typed = () => searchRef.current?.value ?? q;

  return (
    <header
      className={`sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur transition-opacity motion-reduce:transition-none ${
        isPending ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-stretch">
        <form
          className="flex min-w-0 flex-1 items-center"
          onSubmit={(event) => {
            event.preventDefault();
            go(typed(), status);
          }}
        >
          <label htmlFor="library-search" className="sr-only">
            Search games
          </label>
          <Search
            size={20}
            strokeWidth={2.25}
            aria-hidden="true"
            className="pointer-events-none ml-5 shrink-0 text-muted"
          />
          <input
            id="library-search"
            ref={searchRef}
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search title or platform"
            className="h-16 w-full min-w-0 border-0 bg-transparent px-4 text-lg text-ink outline-none placeholder:text-muted"
          />
          {q && (
            <button
              type="button"
              onClick={() => go("", status)}
              aria-label="Clear search"
              className="mr-2 flex size-9 shrink-0 items-center justify-center text-muted hover:text-ink"
            >
              <X size={18} strokeWidth={2.25} aria-hidden="true" />
            </button>
          )}
        </form>

        <FilterButton
          status={status}
          counts={counts}
          hrefFor={(next) => buildHref(typed(), next)}
          onSelect={(next) => go(typed(), next)}
        />

        <AddGameDialog />
      </div>
    </header>
  );
}

function FilterButton({
  status,
  counts,
  hrefFor,
  onSelect,
}: {
  status?: Status;
  counts: StatusCounts;
  hrefFor: (next?: Status) => string;
  onSelect: (next?: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const options: { value?: Status; label: string; count: number }[] = [
    { value: undefined, label: "All", count: counts.all },
    ...STATUSES.map((value) => ({
      value,
      label: STATUS_LABELS[value],
      count: counts[value],
    })),
  ];

  return (
    <div ref={wrapRef} className="relative shrink-0 border-l border-line">
      <IconButton
        label={status ? `Filter: ${STATUS_LABELS[status]}` : "Filter games"}
        size="lg"
        variant={status ? "accent" : "ghost"}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        icon={<Filter size={22} strokeWidth={2.25} aria-hidden="true" />}
      />

      {open && (
        <div className="absolute right-0 top-full z-30 w-56 border border-line bg-surface py-1">
          {options.map((option) => {
            const active = option.value === status;

            return (
              // A real href, so the option can be opened in a new tab or
              // copied; the click handler keeps in-app navigation instant.
              <a
                key={option.label}
                href={hrefFor(option.value)}
                aria-current={active ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  setOpen(false);
                  onSelect(option.value);
                }}
                className={`flex items-center justify-between px-4 py-3 text-base transition-colors motion-reduce:transition-none ${
                  active
                    ? "bg-accent-strong text-white"
                    : "text-ink hover:bg-surface-2"
                }`}
              >
                {option.label}
                {/* Full white: white at 80% over the accent fill measures
                    3.83:1, under AA for text this size. */}
                <span className={active ? "text-white" : "text-muted"}>
                  {option.count}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
