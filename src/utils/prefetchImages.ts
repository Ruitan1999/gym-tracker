/**
 * Warms the browser cache for pictures about to be needed.
 *
 * Starting a workout from a template mounts every exercise card at once, and
 * only then does the browser learn which pictures it needs. Asking for them
 * while the template is still sitting on screen means the tap has nothing left
 * to fetch.
 */

/** Asked for already, so a re-render doesn't queue the same picture again. */
const asked = new Set<string>();

/**
 * Resolved per call rather than once at import: whether the browser has an
 * idle callback is a property of the moment this runs, not of when the module
 * happened to load.
 */
function schedule(run: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(run, { timeout: 2000 });
    return () => cancelIdleCallback(handle);
  }
  const handle = setTimeout(run, 200);
  return () => clearTimeout(handle);
}

/** True when the device has asked for less data; warming is a courtesy. */
function savingData(): boolean {
  const c = (navigator as { connection?: { saveData?: boolean } }).connection;
  return c?.saveData === true;
}

/**
 * Fetches up to `limit` of the given URLs when the browser is otherwise idle.
 *
 * Returns a function that stops any it hasn't started yet — a screen that
 * unmounts should not still be pulling pictures for it.
 */
export function prefetchImages(urls: (string | null)[], limit = 24): () => void {
  if (typeof Image !== 'function') return () => {};
  if (savingData()) return () => {};

  const wanted: string[] = [];
  for (const url of urls) {
    if (!url || asked.has(url) || wanted.includes(url)) continue;
    wanted.push(url);
    if (wanted.length >= limit) break;
  }
  if (wanted.length === 0) return () => {};

  return schedule(() => {
    for (const url of wanted) {
      // Marked here rather than when this was scheduled. An effect that
      // re-runs cancels the scheduled fetch first, and a URL marked at
      // schedule time would then be skipped by the re-run as already handled
      // — leaving it never fetched by anybody.
      if (asked.has(url)) continue;
      asked.add(url);
      // Assigning src is enough: the response lands in the HTTP cache, which
      // is what the <img> that renders next will read from.
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    }
  });
}

/** Only for tests — the cache of what has been asked for is module-level. */
export function resetPrefetchCache(): void {
  asked.clear();
}
