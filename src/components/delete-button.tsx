"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./button";

/**
 * The inline delete confirmation shared by dialog forms: a quiet trigger,
 * then a Delete/Keep pair. Deleting closes the dialog through `onDone`.
 */
export function DeleteButton({
  onDelete,
  onDone,
}: {
  onDelete: () => Promise<void>;
  onDone: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  // The trigger is replaced by the confirmation, so focus would otherwise
  // fall to the page. It lands on the safe option when the pair appears,
  // and returns to the trigger when the confirmation is dismissed.
  useEffect(() => {
    if (confirming) {
      keepRef.current?.focus();
      return;
    }

    if (restoreFocus.current) {
      restoreFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [confirming]);

  if (!confirming) {
    return (
      <Button
        ref={triggerRef}
        variant="dangerGhost"
        size="plain"
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={18} strokeWidth={2.25} aria-hidden="true" />
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="danger"
        size="sm"
        disabled={deleting}
        onClick={() => startDelete(() => onDelete().then(onDone))}
      >
        {deleting ? "Deleting" : "Delete"}
      </Button>
      <Button
        ref={keepRef}
        variant="secondary"
        size="sm"
        onClick={() => {
          restoreFocus.current = true;
          setConfirming(false);
        }}
      >
        Keep
      </Button>
    </div>
  );
}
