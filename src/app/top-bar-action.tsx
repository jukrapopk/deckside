import type { ReactNode } from "react";
import { IconButton } from "@/components/icon-button";

/** One top-bar action: the rule that separates it, and the button itself. */
export function TopBarAction({
  label,
  icon,
  variant = "ghost",
  onClick,
}: {
  label: string;
  icon: ReactNode;
  variant?: "ghost" | "accent";
  onClick: () => void;
}) {
  return (
    <div className="border-l border-line">
      <IconButton
        label={label}
        size="lg"
        variant={variant}
        onClick={onClick}
        className="max-sm:w-14"
        icon={icon}
      />
    </div>
  );
}
