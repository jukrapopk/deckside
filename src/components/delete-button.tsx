"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
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

  if (!confirming) {
    return (
      <Button
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
        variant="secondary"
        size="sm"
        onClick={() => setConfirming(false)}
      >
        Keep
      </Button>
    </div>
  );
}
