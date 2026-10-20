import Image from "next/image";

/** First visible character, upper-cased. Spread so an emoji is not cut in half. */
export function initialOf(title: string): string {
  return [...title.trim()][0]?.toUpperCase() ?? "?";
}

/**
 * The cover a game has when it has none: its initial on the dark tile. Solid
 * fill rather than a gradient, like every other surface in the app, and quiet
 * enough that the title block below stays the loudest thing on the card.
 */
export function CoverInitial({
  title,
  letterClassName = "text-7xl",
}: {
  title: string;
  letterClassName?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-surface-2"
    >
      <span
        className={`select-none font-semibold leading-none text-white/15 ${letterClassName}`}
      >
        {initialOf(title)}
      </span>
    </div>
  );
}

/**
 * Cover art with the initial as its empty state. The parent supplies the box:
 * the card is already relative, the picker's preview sets its own.
 */
export function CoverArt({
  src,
  title,
  eager = false,
}: {
  src: string | null;
  title: string;
  eager?: boolean;
}) {
  if (!src) return <CoverInitial title={title} />;

  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      fill
      priority={eager}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      className="object-cover"
    />
  );
}
