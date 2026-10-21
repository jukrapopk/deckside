"use client";

import { Check, X } from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { findCovers, type CoverOption } from "./artwork-actions";
import { Button } from "@/components/button";
import { CoverArt } from "@/components/cover-art";
import { inputClass } from "@/components/field";
import {
  COVER_UPLOAD_ACCEPT,
  COVER_UPLOAD_MAX_BYTES,
  COVER_UPLOAD_TYPES,
  STEAMGRIDDB_QUERY_MIN_LENGTH,
} from "@/lib/limits";

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
 * Cover art picker. It writes the chosen URL into the game form's hidden field
 * and leaves a picked file on the form's file input; Save is still the only
 * thing that persists anything. The preview updates immediately because that is
 * what makes a choice feel like a choice.
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
  const searchTerm = query.trim();
  const canSearch = searchTerm.length >= STEAMGRIDDB_QUERY_MIN_LENGTH;
  const [result, setResult] = useState<Result>({ status: "idle" });
  const [searching, startSearch] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string>();
  // Kept in a ref so the unmount cleanup reads the latest URL, not the first.
  const previewRef = useRef<string | null>(null);

  // A blob URL is the only way to show a file that has not been uploaded yet.
  // It is created in the change handler rather than an effect, so the render
  // that shows the file is the same one that creates the URL.
  function releasePreview() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
  }

  useEffect(() => releasePreview, []);

  function clearFile() {
    releasePreview();
    setFilePreview(null);
    setFileError(undefined);

    // The input keeps its own copy of the file until it is cleared, and it is
    // what posts with the form.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function chooseCover(url: string) {
    // A SteamGridDB choice replaces a staged file, not just its URL.
    clearFile();
    onChange(url);
  }

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    if (!chosen) return;

    // Mirrored on the server; catching it here saves a round trip.
    if (!COVER_UPLOAD_TYPES.includes(chosen.type)) {
      setFileError("Use a JPEG, PNG, WebP, or AVIF image.");
      event.target.value = "";
      return;
    }

    if (chosen.size > COVER_UPLOAD_MAX_BYTES) {
      setFileError("Keep the cover under 6 MB.");
      event.target.value = "";
      return;
    }

    setFileError(undefined);
    releasePreview();
    const preview = URL.createObjectURL(chosen);
    previewRef.current = preview;
    setFilePreview(preview);
    // The file supersedes a URL; the server writes it on Save.
    onChange("");
  }

  function search() {
    if (!canSearch) return;

    startSearch(async () => {
      const response = await findCovers(searchTerm);
      setResult(
        response.ok
          ? { status: "found", game: response.game, options: response.options }
          : { status: "message", message: response.message },
      );
    });
  }

  const frame = `${COVER_FRAME} w-20 shrink-0 border-line`;
  const hasCover = Boolean(filePreview || value);
  const preview = filePreview ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={filePreview}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 size-full object-cover"
    />
  ) : (
    <CoverArt
      src={value || null}
      title={title}
      sizes="80px"
      letterClassName="text-4xl"
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {/* `items-start` matters: as a stretched flex item the preview would take
          the control column's height and lose its 2:3 frame on narrow screens. */}
      <div className="flex items-start gap-3">
        {hasCover ? (
          <button
            type="button"
            onClick={() => {
              clearFile();
              onChange("");
            }}
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

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            name="coverFile"
            accept={COVER_UPLOAD_ACCEPT}
            className="hidden"
            onChange={pickFile}
          />

          {/* The two ways in are alternatives, so a rule reads better than a
              second label; the divider itself carries no meaning. */}
          <div aria-hidden="true" className="flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-sm text-muted">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
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
              aria-label="Search SteamGridDB"
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

          {fileError && (
            <p role="status" className="text-sm text-danger">
              {fileError}
            </p>
          )}
        </div>
      </div>

      {result.status === "found" && (
        <>
          <p role="status" className="break-words text-sm text-muted">
            Art for <span className="text-ink">{result.game}</span>
          </p>
          <ul className="grid grid-cols-4 gap-2">
            {result.options.slice(0, VISIBLE_OPTIONS).map((option, index) => {
              const selected = option.url === value;

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => chooseCover(option.url)}
                    aria-label={`Cover art option ${index + 1}`}
                    aria-pressed={selected}
                    className={`${COVER_FRAME} block w-full transition-colors motion-reduce:transition-none ${
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
        <p role="status" className="break-words text-sm text-muted">
          {result.message}
        </p>
      )}

      <input type="hidden" name="coverUrl" value={value} />
    </div>
  );
}
