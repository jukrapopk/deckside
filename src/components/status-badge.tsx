import { Bookmark, Check, Play, SquareText, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { STATUS_BADGE, STATUS_LABELS, type Status } from "@/lib/statuses";

/**
 * One silhouette per status, so the five stay distinguishable at 16px inside a
 * 28px circle: a list, a bookmark, a triangle, a tick, an X. Nothing here is a
 * circle-with-a-thing — the badge already is the circle.
 *
 * These are drawn, not filled, and every one is stroked at the same width. The
 * previous filled set could not be made to match: a solid triangle and a solid
 * bookmark carry far more ink than an X can, so the X always looked thin no
 * matter which weight it was given (measured: 36 white pixels against 60-89
 * for the rest). Uniform strokes remove the problem by construction instead of
 * patching one glyph.
 *
 * Backlog is `SquareText` — the list of what you own but have not started —
 * which pairs with `Bookmark` for the one item picked out of it. `ScrollText`
 * was tried and rejected: its curls turn to noise at 16px.
 */
const STATUS_ICONS: Record<Status, LucideIcon> = {
  backlog: SquareText,
  "up-next": Bookmark,
  playing: Play,
  completed: Check,
  dropped: X,
};

/**
 * Status indicator: a coloured circle with a white glyph. The status name is
 * announced to screen readers unless `decorative` is set.
 */
export function StatusBadge({
  status,
  className = "",
  decorative = false,
}: {
  status: Status;
  className?: string;
  /** The row already names the status; hide this duplicate from assistive tech. */
  decorative?: boolean;
}) {
  const Glyph = STATUS_ICONS[status];

  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : STATUS_LABELS[status]}
      aria-hidden={decorative || undefined}
      className={`flex size-7 items-center justify-center rounded-full text-white ${STATUS_BADGE[status]} ${className}`}
    >
      <Glyph
        size={16}
        // 3 in a 24 viewBox is 2px at 16px: heavy enough to hold against the
        // fill, and identical on every glyph.
        strokeWidth={3}
        aria-hidden="true"
      />
    </span>
  );
}
