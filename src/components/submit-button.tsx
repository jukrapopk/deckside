"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

/** Submit button that reports the pending state of the form it belongs to. */
export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving" : label}
    </Button>
  );
}
