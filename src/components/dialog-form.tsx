"use client";

import type { ReactNode } from "react";
import { Button } from "./button";
import { DeleteButton } from "./delete-button";
import { FormError, FormFooter } from "./form";
import { SubmitButton } from "./submit-button";

/**
 * The shared shell of an add/edit dialog form: fields, the error line, and the
 * action row. Editing can also carry the delete confirmation.
 */
export function DialogForm({
  action,
  error,
  onClose,
  onDelete,
  submitLabel,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  onClose: () => void;
  onDelete?: () => Promise<void>;
  submitLabel: string;
  children: ReactNode;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      {children}

      <FormError message={error} />

      <FormFooter
        left={
          onDelete ? (
            <DeleteButton onDelete={onDelete} onDone={onClose} />
          ) : undefined
        }
      >
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <SubmitButton label={submitLabel} />
      </FormFooter>
    </form>
  );
}
