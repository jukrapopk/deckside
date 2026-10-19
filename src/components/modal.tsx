"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
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
  children: React.ReactNode;
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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={(event) => {
        // Clicks land on the dialog element itself only on the backdrop.
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-lg border border-line bg-surface p-0 text-ink"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 id={headingId} className="text-lg font-semibold">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        <IconButton
          label="Close"
          size="sm"
          onClick={onClose}
          icon={<X size={18} weight="bold" aria-hidden="true" />}
        />
      </div>

      <div className="px-5 py-5">{children}</div>
    </dialog>
  );
}
