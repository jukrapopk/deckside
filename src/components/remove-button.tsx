"use client";

import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "./button";

/** Compact destructive action for clearing a saved value. */
export function RemoveButton({
  className = "",
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      variant="dangerGhost"
      size="none"
      className={`shrink-0 whitespace-nowrap text-sm ${className}`}
    >
      <X size={14} strokeWidth={2.5} aria-hidden="true" />
      {children}
    </Button>
  );
}
