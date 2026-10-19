export const RATING_MIN = 0;
export const RATING_MAX = 5;

/** Empty string means unrated. Otherwise a whole number of stars. */
export function parseRating(value: string):
  | { rating: number | null; error?: undefined }
  | { rating: null; error: string } {
  const trimmed = value.trim();

  if (!trimmed) return { rating: null };

  const rating = Number(trimmed);
  if (
    !Number.isInteger(rating) ||
    rating < RATING_MIN ||
    rating > RATING_MAX
  ) {
    return {
      rating: null,
      error: `Rating must be a whole number from ${RATING_MIN} to ${RATING_MAX}.`,
    };
  }

  return { rating };
}
