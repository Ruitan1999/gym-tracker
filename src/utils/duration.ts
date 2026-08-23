/**
 * How long a session took, from the first exercise to saving it.
 *
 * Wall clock, deliberately: it counts the rests, the queue for the rack and
 * the time spent deciding — which is what "how long was I in there" means.
 */

/** Milliseconds between two ISO timestamps, or null if that can't be known. */
export function sessionDurationMs(
  startedAt: string | undefined | null,
  finishedAt: string | undefined | null,
): number | null {
  if (!startedAt || !finishedAt) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  const ms = end - start;
  // A clock that went backwards, or a session saved before it started, is not
  // a duration worth showing.
  if (ms < 0) return null;
  return ms;
}

/**
 * Short enough for a stat tile: "48m", "1h 04m", "12s".
 *
 * Minutes are padded once there are hours so the number stops jumping about
 * as it ticks, and seconds only show below a minute, where they are the whole
 * story rather than noise.
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/** The running clock: always ticking seconds, so it reads as live. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
