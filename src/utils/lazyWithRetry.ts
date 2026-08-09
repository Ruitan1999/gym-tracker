/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, type ComponentType } from 'react';

const RETRY_KEY = 'liftgauge.chunkRetry.v1';
const BUST_PARAM = '_fresh';
/**
 * How long a retry counts as "just tried". Long enough that a genuinely missing
 * chunk can't loop, short enough that a flaky connection an hour into the
 * session still gets its own attempt instead of inheriting an old verdict.
 */
const RETRY_WINDOW_MS = 15_000;

function retriedJustNow(): boolean {
  try {
    const at = Number(sessionStorage.getItem(RETRY_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < RETRY_WINDOW_MS;
  } catch {
    return false;
  }
}

function markRetry(): void {
  try {
    sessionStorage.setItem(RETRY_KEY, String(Date.now()));
  } catch {
    /* private mode — we just lose the loop guard */
  }
}

function clearRetry(): void {
  try {
    sessionStorage.removeItem(RETRY_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Reloads in a way the HTTP cache can't satisfy from what it already holds.
 *
 * location.reload() is not enough: a stale document was cached under whatever
 * headers were in force when it was stored, so the browser is entitled to hand
 * the same one back. Only a URL it has never seen forces a real fetch.
 */
export function reloadFresh(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(BUST_PARAM, Date.now().toString(36));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

/** Drops the cache-busting parameter once the app is up, so it isn't sticky. */
export function tidyReloadMarker(): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(BUST_PARAM)) return;
    url.searchParams.delete(BUST_PARAM);
    window.history.replaceState(null, '', url.toString());
  } catch {
    /* ignore */
  }
}

/**
 * A route that fails to load leaves Suspense showing its fallback forever — a
 * blank screen with nothing to act on. This happens for real: a deploy replaces
 * the hashed chunks, and a browser still holding the previous index.html asks
 * for filenames that no longer exist.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      clearRetry();
      return mod;
    } catch (err) {
      if (retriedJustNow()) throw err;
      markRetry();
      reloadFresh();
      // The navigation takes over; never resolve, so nothing renders meanwhile.
      return new Promise<{ default: T }>(() => {});
    }
  });
}
