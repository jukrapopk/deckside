"use client";

import { ChevronUp, SearchX } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { selectedControl } from "@/components/field";
import {
  isLucideIconName,
  LUCIDE_ICON_NAMES,
  SUGGESTED_ICON_NAMES,
} from "@/lib/lucide-catalog";
import {
  CUSTOM_ICON_PREFIX,
  customIconName,
  type PlatformIconValue,
} from "@/lib/platforms";

/** Four rows of eight, sized to fit most windows without scrolling. */
const RESULT_LIMIT = 32;

type Anchor = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

/** Where the results hang: under the field, never past the viewport. */
function measure(input: HTMLInputElement): Anchor {
  const rect = input.getBoundingClientRect();
  const top = rect.bottom + 8;

  return {
    left: rect.left,
    top,
    width: rect.width,
    maxHeight: Math.max(140, window.innerHeight - top - 16),
  };
}

/**
 * The ninth cell of the icon field. Clicking it swaps the button for a search
 * input and drops the results under the field. The panel is fixed so the
 * dialog's scroll container cannot clip it, and the form never reflows.
 */
export function CustomIconPicker({
  value,
  onChange,
}: {
  value: PlatformIconValue;
  onChange: (value: PlatformIconValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = customIconName(value);
  const hasIcon = Boolean(selected && isLucideIconName(selected));

  useEffect(() => {
    const dialog = wrapperRef.current?.closest("dialog");
    if (!dialog) return;

    // The panel is fixed, so it would outlive the form if the dialog closed
    // underneath it — Escape or a backdrop click, with no pointerdown inside.
    function onClose() {
      setOpen(false);
    }

    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  useEffect(() => {
    if (!open) return;

    const input = inputRef.current;
    if (!input) return;

    setAnchor(measure(input));
    input.focus();

    function reposition() {
      if (inputRef.current) setAnchor(measure(inputRef.current));
    }

    // A click anywhere outside the field closes the menu; the tiles and the
    // input live inside the wrapper, so they keep it open.
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }

    // The panel is fixed, so it would drift away from the field if the dialog
    // body scrolled under it. Scrolling the results themselves is fine.
    function onScroll(event: Event) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", reposition);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const results = useMemo(() => {
    // "pc case" and "pc-case" should both find `pc-case`, so the query is split
    // the same way the names are.
    const tokens = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    if (tokens.length === 0) return SUGGESTED_ICON_NAMES;

    return LUCIDE_ICON_NAMES.filter((name) =>
      tokens.every((token) => name.includes(token)),
    ).slice(0, RESULT_LIMIT);
  }, [query]);

  function choose(name: string) {
    onChange(`${CUSTOM_ICON_PREFIX}${name}`);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef}>
      {open ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              // Both keys would otherwise reach the platform form: Enter would
              // submit it, Escape would close the whole dialog.
              if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
                return;
              }

              if (event.key !== "Enter") return;

              event.preventDefault();
              const first = results[0];
              if (first) choose(first);
            }}
            placeholder="Search Lucide"
            aria-label="Search Lucide icons"
            className="h-12 w-full border border-accent bg-surface pl-3 pr-11 text-sm text-ink placeholder:text-muted"
          />

          <button
            type="button"
            aria-label="Close icon search"
            title="Close icon search"
            onClick={() => setOpen(false)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
          >
            <ChevronUp size={16} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={hasIcon ? "Custom icon" : undefined}
          title={hasIcon ? "Custom icon" : undefined}
          onClick={() => {
            setQuery("");
            setOpen(true);
          }}
          className={`flex h-12 w-full items-center justify-center border px-3 text-sm transition-colors motion-reduce:transition-none ${
            hasIcon ? selectedControl : "border-line text-muted hover:text-ink"
          }`}
        >
          {hasIcon ? (
            <DynamicIcon
              name={selected as IconName}
              size={20}
              strokeWidth={2.25}
              aria-hidden="true"
            />
          ) : (
            "Custom icon"
          )}
        </button>
      )}

      {open && anchor && (
        <div
          ref={panelRef}
          style={{
            left: anchor.left,
            top: anchor.top,
            width: anchor.width,
            maxHeight: anchor.maxHeight,
          }}
          className="fixed z-50 overflow-y-auto border border-line bg-surface p-2"
        >
          {results.length === 0 ? (
            // Nothing to list: the centered glyph says it without a sentence.
            <div
              role="status"
              className="flex items-center justify-center py-6 text-muted"
            >
              <SearchX size={20} strokeWidth={2.25} aria-hidden="true" />
              <span className="sr-only">No matching icons</span>
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-2">
              {results.map((name) => {
                const active = value === `${CUSTOM_ICON_PREFIX}${name}`;

                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={active}
                    aria-label={name}
                    title={name}
                    onClick={() => choose(name)}
                    className={`flex h-10 items-center justify-center border transition-colors motion-reduce:transition-none ${
                      active
                        ? selectedControl
                        : "border-line text-muted hover:text-ink"
                    }`}
                  >
                    <DynamicIcon
                      name={name as IconName}
                      size={18}
                      strokeWidth={2.25}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
