"use client";

import { Check, X } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Button } from "@/components/button";
import { CoverArt } from "@/components/cover-art";
import { inputClass } from "@/components/field";
import type {
  CoverOption,
  CoverPreset,
  CoverSearch,
} from "@/lib/cover-search";
import { STEAMGRIDDB_QUERY_MIN_LENGTH } from "@/lib/limits";

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

/** The ratio and frame shared by the preview and each option. */
const COVER_FRAME = "relative aspect-2/3 overflow-hidden border";

/**
 * Cover art picker. Writes the chosen URL into the game form's hidden field,
 * so Save is still the only thing that persists anything; the preview updates
 * immediately because that is what makes a choice feel like a choice.
 */
export function CoverPicker({
  title,
  value,
  onChange,
  onSearch,
  presets,
}: {
  title: string;
  value: string;
  onChange: (url: string) => void;
  /** Omitted in the demo, where there is no server-side SteamGridDB key. */
  onSearch?: CoverSearch;
  /** Bundled posters the demo can choose without a network search. */
  presets?: CoverPreset[];
}) {
  // Until the search box is touched it follows the title, so adding a game
  // does not ask for the same words twice.
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? title;
  const searchTerm = query.trim();
  const canSearch = searchTerm.length >= STEAMGRIDDB_QUERY_MIN_LENGTH;
  const [result, setResult] = useState<Result>({ status: "idle" });
  const [searching, startSearch] = useTransition();

  function search() {
    if (!canSearch || !onSearch) return;

    startSearch(async () => {
      const response = await onSearch(searchTerm);
      setResult(
        response.ok
          ? { status: "found", game: response.game, options: response.options }
          : { status: "message", message: response.message },
      );
    });
  }

  const frame = `${COVER_FRAME} w-20 shrink-0 border-line`;
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
            {/* Touch has no hover, so the remove action needs a visible mark.
                On a fine pointer the full label appears on hover instead. */}
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 hidden size-6 items-center justify-center bg-bg/85 text-white pointer-coarse:flex"
            >
              <X size={14} strokeWidth={2.5} />
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-bg/80 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:hidden motion-reduce:transition-none"
            >
              <X size={20} strokeWidth={2.25} />
              Remove
            </span>
          </button>
        ) : (
          <div className={frame}>{preview}</div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {onSearch ? (
            <div className="flex flex-col gap-2 sm:flex-row">
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
                className={`${inputClass} min-w-0`}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
                onClick={search}
                disabled={searching || !canSearch}
              >
                {searching ? "Searching" : "Search"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">
              SteamGridDB cover search is unavailable in the demo.
            </p>
          )}
        </div>
      </div>

      {presets?.length ? (
        <>
          <p className="break-words text-sm text-muted">Demo posters</p>
          <CoverOptions
            choices={presets.map((poster) => ({
              id: poster.url,
              url: poster.url,
              thumb: poster.url,
              label: `Use ${poster.label} poster`,
            }))}
            value={value}
            onChange={onChange}
          />
        </>
      ) : (
        <>
          {result.status === "found" && (
            <>
              <p role="status" className="break-words text-sm text-muted">
                Art for <span className="text-ink">{result.game}</span>
              </p>
              <CoverOptions
                choices={result.options
                  .slice(0, VISIBLE_OPTIONS)
                  .map((option, index) => ({
                    id: option.id,
                    url: option.url,
                    thumb: option.thumb,
                    label: `Cover art option ${index + 1}`,
                  }))}
                value={value}
                onChange={onChange}
              />
            </>
          )}

          {result.status === "message" && (
            <p role="status" className="break-words text-sm text-muted">
              {result.message}
            </p>
          )}
        </>
      )}

      <input type="hidden" name="coverUrl" value={value} />
    </div>
  );
}

type CoverChoice = {
  id: number | string;
  url: string;
  thumb: string;
  label: string;
};

function CoverOptions({
  choices,
  value,
  onChange,
}: {
  choices: CoverChoice[];
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <ul className="grid grid-cols-4 gap-2">
      {choices.map((choice) => {
        const selected = choice.url === value;

        return (
          <li key={choice.id}>
            <button
              type="button"
              onClick={() => onChange(choice.url)}
              aria-label={choice.label}
              aria-pressed={selected}
              title={choice.label}
              className={`${COVER_FRAME} block w-full transition-colors motion-reduce:transition-none ${
                selected ? "border-accent" : "border-line hover:border-accent"
              }`}
            >
              <Image
                src={choice.thumb}
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
  );
}
