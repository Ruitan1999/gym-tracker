/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, type ComponentType } from 'react';

/**
 * localStorage, not sessionStorage: an installed app relaunched from the home
 * screen starts a brand new session, so a session-scoped guard is empty on
 * exactly the load it exists to catch. A chunk that stays missing then reloads,
 * comes back to an empty guard, and reloads again — forever.
 */
const RETRY_KEY = 'liftgauge.chunkRetry.v2';
const BUST_PARAM = '_fresh';
/**
 * How long a retry counts as "just tried". Long enough that a genuinely missing
 * chunk can't loop, short enough that a flaky connection an hour into the
 * session still gets its own attempt instead of inheriting an old verdict.
 */
const RETRY_WINDOW_MS = 60_000;
/** One reload is the whole fix; a second has never been the difference. */
const MAX_RETRIES = 1;

interface RetryState {
  at: number;
  count: number;
}

function readRetry(): RetryState | null {
  try {
    const raw = localStorage.getItem(RETRY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RetryState>;
    const at = Number(parsed?.at);
    if (!Number.isFinite(at) || at <= 0) return null;
    const count = Number(parsed?.count);
    return { at, count: Number.isFinite(count) ? count : 0 };
  } catch {
    return null;
  }
}

/** True once reloading has been tried and clearly isn't working. */
export function retriesExhausted(): boolean {
  const state = readRetry();
  if (!state) return false;
  if (Date.now() - state.at >= RETRY_WINDOW_MS) return false;
  return state.count >= MAX_RETRIES;
}

export function markRetry(): void {
  const previous = readRetry();
  const stillInWindow = !!previous && Date.now() - previous.at < RETRY_WINDOW_MS;
  const next: RetryState = {
    at: Date.now(),
    count: stillInWindow ? previous.count + 1 : 1,
  };
  try {
    localStorage.setItem(RETRY_KEY, JSON.stringify(next));
  } catch {
    /* private mode — we just lose the loop guard */
  }
}

export function clearRetry(): void {
  try {
    localStorage.removeItem(RETRY_KEY);
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
      if (retriesExhausted()) throw err;
      markRetry();
      reloadFresh();
      // The navigation takes over; never resolve, so nothing renders meanwhile.
      return new Promise<{ default: T }>(() => {});
    }
  });
}
