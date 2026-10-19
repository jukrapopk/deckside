"use client";

import type { ComponentProps, ReactNode } from "react";

type Variant = "ghost" | "accent" | "bare";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-16",
};

const VARIANTS: Record<Variant, string> = {
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
  accent: "bg-accent-strong text-white hover:brightness-110",
  // No background, for icons sitting directly on artwork. The shadow keeps
  // the glyph legible over a bright photo without adding a chip behind it.
  // Tinted to the page ground rather than black.
  bare: "text-white/85 hover:text-white drop-shadow-[0_1px_3px_rgba(18,28,38,0.9)]",
};

type IconButtonProps = Omit<
  ComponentProps<"button">,
  "children" | "className" | "size"
> & {
  /** Required: the button has no visible text. */
  label: string;
  icon: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

/** Square, sharp, icon-only button. The app's one action affordance. */
export function IconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`flex shrink-0 items-center justify-center transition-colors motion-reduce:transition-none ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}
