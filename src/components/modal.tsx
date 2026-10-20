"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconButton } from "./icon-button";

/** Open/close state for a `<Modal>`. */
export function useModal() {
  const [open, setOpen] = useState(false);

  return {
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Short line under the title. Keep it to one sentence. */
  description?: string;
  children: ReactNode;
};

/**
 * Base dialog. Owns the native <dialog>, backdrop dismissal, Escape handling,
 * and the header. Content and actions belong to the caller.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // A modal makes the rest of the page inert, so it should also stop the page
  // scrolling: otherwise its scrollbar sits next to the dialog body's and the
  // two read as one nested control. The padding replaces the width the
  // scrollbar gave back, so nothing shifts while the dialog is up.
  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const scrollbar = window.innerWidth - root.clientWidth;
    const previousOverflow = root.style.overflow;
    const previousPadding = root.style.paddingRight;

    root.style.overflow = "hidden";
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;

    return () => {
      root.style.overflow = previousOverflow;
      root.style.paddingRight = previousPadding;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={(event) => {
        // React gives even the non-bubbling `close` event a synthetic bubbling
        // phase, so a nested dialog closing would otherwise close this one too.
        if (event.target === dialogRef.current) onClose();
      }}
      onClick={(event) => {
        // Clicks land on the dialog element itself only on the backdrop.
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] flex-col overflow-hidden border border-line bg-surface p-0 text-ink open:flex"
    >
      {/* Only `display` is tied to [open]; the browser needs that to hide the
          closed dialog. The other layout rules stay on the element so the
          closing fade keeps its shape instead of snapping to a row before it
          leaves the top layer. The header stays put; the body is the single
          scroller. This `max-height` also beats the browser's own modal cap,
          which would otherwise make the dialog a second scroll container. */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
        {/* A game title can be a single long word; without min-w-0 and
            break-words it would push the close button out of the dialog. */}
        <div className="min-w-0">
          <h2 id={headingId} className="break-words text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p className="mt-1 break-words text-sm text-muted">{description}</p>
          )}
        </div>
        <IconButton
          label="Close"
          size="sm"
          onClick={onClose}
          icon={<X size={18} strokeWidth={2.25} aria-hidden="true" />}
        />
      </div>

      <div className="min-h-0 overflow-y-auto px-5 py-5">{children}</div>
    </dialog>
  );
}
