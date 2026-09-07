/**
 * Puts the worker in charge of how the app is fetched.
 *
 * Registered straight away rather than on window load, which is the usual
 * advice: this page links a stylesheet from another origin, and a network that
 * is slow to answer for it — or blocks it outright — leaves load pending for a
 * long time or forever. Waiting on that would mean the worker never installs
 * for exactly the connections that need it most. Registration is cheap and the
 * browser gives it a low priority of its own.
 *
 * Only in a real build: the dev server has no /sw.js to register, and a worker
 * holding on to a dev bundle would be its own kind of stale.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/sw.js').catch(() => {
    // An app that can't register one still works; it just goes back to relying
    // on the boot check to notice it is behind.
  });
}
