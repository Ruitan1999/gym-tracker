declare const __BUILD_ID__: string;

/** The build this running app came from. Stamped in by vite.config.ts. */
export const RUNNING_BUILD: string = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';

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
