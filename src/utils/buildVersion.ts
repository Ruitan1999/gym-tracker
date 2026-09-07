import { reloadFresh } from './lazyWithRetry';

declare const __BUILD_ID__: string;

/** The build this running app came from. Stamped in by vite.config.ts. */
export const RUNNING_BUILD: string = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';

/**
 * Marks that a stale document has already been reloaded once, so a mismatch a
 * reload cannot fix — a CDN mid-deploy, a rollback, an intermediary answering
 * with something else entirely — can't put the app in a reload loop.
 */
const STALE_KEY = 'liftgauge.staleReload.v1';
/** Long enough to cover a relaunch, short enough that a later deploy still heals. */
const STALE_WINDOW_MS = 120_000;

function staleReloadJustTried(): boolean {
  try {
    const at = Number(localStorage.getItem(STALE_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < STALE_WINDOW_MS;
  } catch {
    return false;
  }
}

function markStaleReload(): void {
  try {
    localStorage.setItem(STALE_KEY, String(Date.now()));
  } catch {
    /* private mode — we just lose the loop guard */
  }
}

/** Called once the running build is confirmed current, so the next one can heal too. */
export function clearStaleReload(): void {
  try {
    localStorage.removeItem(STALE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * What the server is currently serving, or null if it can't be reached or
 * doesn't say — an older deployment has no version.json, and the SPA rewrite
 * answers with the app's HTML instead.
 *
 * no-store rather than a cache-buster: this runs on every return to the app,
 * and a fresh query string each time would fill the HTTP cache with answers
 * nobody reads again.
 */
export async function fetchDeployedBuild(): Promise<string | null> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const body = (await res.json()) as { build?: unknown };
    return typeof body.build === 'string' ? body.build : null;
  } catch {
    return null;
  }
}

/**
 * Corrects a stale document at the moment the app starts.
 *
 * A phone relaunching an installed app fetches the page again, and a browser
 * that can't reach the network in that instant is entitled to hand back the
 * copy it already has — so the app comes up on whatever build was cached,
 * sometimes a very old one. The banner covers a deploy that lands while the app
 * is open, where an unannounced reload would take the screen out from under
 * someone. Boot is the opposite case: nothing has been typed yet and there is
 * nothing to lose, so being behind is worth fixing outright rather than asking
 * about and hoping it gets tapped.
 *
 * Returns whether a reload was started, which is the only observable part.
 */
export async function healStaleBuildOnBoot(): Promise<boolean> {
  if (RUNNING_BUILD === 'dev') return false;

  const deployed = await fetchDeployedBuild();
  if (!deployed) return false;
  if (deployed === RUNNING_BUILD) {
    // The check runs before the guard is consulted, so a heal that worked
    // clears its own marker on the very next launch.
    clearStaleReload();
    return false;
  }
  // Already reloaded for this and still behind: the reload is not the fix, so
  // stop here and leave it to the banner rather than bouncing the app forever.
  if (staleReloadJustTried()) return false;

  markStaleReload();
  reloadFresh();
  return true;
}
