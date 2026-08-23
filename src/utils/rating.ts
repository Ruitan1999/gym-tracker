/**
 * How hard a session felt, as a colour.
 *
 * Easy to maximal, and it has to read as a ramp: green, amber, orange, red.
 * It used to end on the accent colour, which meant that when the accent moved
 * to blue the 7-8 band came out cooler than the amber below it and the scale
 * stopped meaning anything. The accent says "act on this", not "rated seven",
 * so the ramp owns its colours.
 *
 * Two screens show a rating, and they used to carry a copy of this each.
 */
export function ratingColor(rating: number | null | undefined): string | null {
  if (rating == null || !Number.isFinite(rating)) return null;
  if (rating <= 3) return 'var(--color-done)';
  if (rating <= 6) return 'var(--color-ember)';
  if (rating <= 8) return 'var(--color-rust)';
  return 'var(--color-blood)';
}

/** The rating a session's notes carry, if any. */
export function parseRating(notes: string | undefined | null): number | null {
  const match = notes?.match(/^Rating: (\d+)/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}
