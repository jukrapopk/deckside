import type { ReactNode } from "react";

/** The alert under a form's fields; nothing renders without a message. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="text-base text-danger">
      {message}
    </p>
  );
}

/**
 * The action row at the bottom of a dialog's content: an optional leading
 * control (usually delete) and the closing buttons. The spacer keeps the
 * buttons on the right when there is nothing to lead with.
 */
export function FormFooter({
  left,
  children,
}: {
  left?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
      {left ?? <span />}
      <div className="flex gap-3">{children}</div>
    </div>
  );
}
