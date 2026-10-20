"use client";

import { Check, X } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { findCovers, type CoverOption } from "./artwork-actions";
import { Button } from "@/components/button";
import { CoverArt } from "@/components/cover-art";
import { inputClass } from "@/components/field";

type Result =
  | { status: "idle" }
  | { status: "found"; game: string; options: CoverOption[] }
  | { status: "message"; message: string };

/**
 * Two rows of four. A taller grid would push the rest of the form a screen
 * down; eight is enough to choose between, and the picker previews the
 * selection at full size.
 */
const VISIBLE_OPTIONS = 8;

/**
 * Cover art picker. Writes the chosen URL into the game form's hidden field,
 * so Save is still the only thing that persists anything; the preview updates
 * immediately because that is what makes a choice feel like a choice.
 */
export function CoverPicker({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (url: string) => void;
}) {
  // Until the search box is touched it follows the title, so adding a game
  // does not ask for the same words twice.
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? title;
  const [result, setResult] = useState<Result>({ status: "idle" });
  const [searching, startSearch] = useTransition();

  function search() {
    const term = query.trim();
    if (term.length < 2) return;

    startSearch(async () => {
      const response = await findCovers(term);
      setResult(
        response.ok
          ? { status: "found", game: response.game, options: response.options }
          : { status: "message", message: response.message },
      );
    });
  }

  const frame =
    "relative aspect-2/3 w-20 shrink-0 overflow-hidden border border-line";
  const preview = (
    <CoverArt
      src={value || null}
      title={title}
      sizes="80px"
      letterClassName="text-4xl"
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove cover"
            title="Remove cover"
            className={`group ${frame} cursor-pointer`}
          >
            {preview}
            <span
              aria-hidden="true"
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-bg/80 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
            >
              <X size={20} strokeWidth={2.25} />
              Remove
            </span>
          </button>
        ) : (
          <div className={frame}>{preview}</div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-2">
            <label htmlFor="cover-search" className="sr-only">
              Search SteamGridDB
            </label>
            <input
              id="cover-search"
              value={query}
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={(event) => {
                // Enter searches. It must not submit the game form.
                if (event.key === "Enter") {
                  event.preventDefault();
                  search();
                }
              }}
              placeholder="Search SteamGridDB"
              autoComplete="off"
              className={inputClass}
            />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={search}
              disabled={searching || query.trim().length < 2}
            >
              {searching ? "Searching" : "Search"}
            </Button>
          </div>
        </div>
      </div>

      {result.status === "found" && (
        <>
          <p className="text-sm text-muted">
            Art for <span className="text-ink">{result.game}</span>
          </p>
          <ul className="grid grid-cols-4 gap-2">
            {result.options.slice(0, VISIBLE_OPTIONS).map((option, index) => {
              const selected = option.url === value;

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => onChange(option.url)}
                    aria-label={`Cover art option ${index + 1}`}
                    aria-pressed={selected}
                    className={`relative block aspect-2/3 w-full overflow-hidden border transition-colors motion-reduce:transition-none ${
                      selected
                        ? "border-accent"
                        : "border-line hover:border-accent"
                    }`}
                  >
                    <Image
                      src={option.thumb}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                    {selected && (
                      <span className="absolute right-0 top-0 flex size-5 items-center justify-center bg-accent-strong text-white">
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {result.status === "message" && (
        <p role="status" className="text-sm text-muted">
          {result.message}
        </p>
      )}

      <input type="hidden" name="coverUrl" value={value} />
    </div>
  );
}
