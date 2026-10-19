import {
  Archive,
  CheckFat,
  Play,
  StackSimple,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { STATUS_BADGE, STATUS_LABELS, type Status } from "@/lib/statuses";

const STATUS_ICONS: Record<Status, Icon> = {
  backlog: StackSimple,
  playing: Play,
  completed: CheckFat,
  dropped: Archive,
};

/**
 * Status indicator: a coloured circle with a white glyph. The label is
 * exposed to assistive tech only.
 */
export function StatusBadge({
  status,
  size = 16,
  className = "",
}: {
  status: Status;
  size?: number;
  className?: string;
}) {
  const Glyph = STATUS_ICONS[status];

  return (
    <span
      role="img"
      aria-label={STATUS_LABELS[status]}
      className={`flex size-7 items-center justify-center rounded-full text-white ${STATUS_BADGE[status]} ${className}`}
    >
      <Glyph size={size} weight="bold" aria-hidden="true" />
    </span>
  );
}
