import type { ComponentProps } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerGhost"
  | "link";

type Size = "md" | "sm" | "plain" | "none";

const BASE =
  "inline-flex items-center justify-center gap-2 transition-[color,background-color,border-color,filter] motion-reduce:transition-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent-strong font-semibold text-white hover:brightness-110 disabled:opacity-60",
  secondary: "border border-line font-medium text-muted hover:text-ink",
  outline:
    "border border-line font-medium hover:border-accent disabled:opacity-40",
  ghost: "font-medium text-muted hover:text-ink",
  danger:
    "bg-danger-strong font-semibold text-white hover:brightness-110 disabled:opacity-60",
  dangerGhost: "font-medium text-muted hover:text-danger",
  link: "text-sm text-muted hover:text-ink disabled:opacity-40",
};

const SIZES: Record<Size, string> = {
  md: "px-5 py-3 text-base",
  sm: "px-4 py-3 text-base",
  plain: "px-1 py-3 text-base",
  none: "",
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

/** One text button: the variant carries the role, the size the weight. */
export function Button({
  variant = "secondary",
  size = "md",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
