import { useEffect } from 'react';

interface SentinelLike {
  release: () => Promise<void>;
  addEventListener?: (type: 'release', cb: () => void) => void;
}

/**
 * Keeps the screen on while `active`, so the phone doesn't go dark between
 * sets. The browser drops the lock whenever the page is hidden, so it is taken
 * again when the page comes back. Unsupported browsers and refusals (low
 * battery, no user activation) are ignored: it is a nicety, never an error.
 *
 * It does not stop Android from discarding the app in the background.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    const wakeLock = (
      navigator as unknown as { wakeLock: { request: (type: 'screen') => Promise<SentinelLike> } }
    ).wakeLock;

    let cancelled = false;
    let sentinel: SentinelLike | null = null;

    async function acquire() {
      if (sentinel || cancelled) return;
      try {
        const lock = await wakeLock.request('screen');
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
        // The browser drops it when hidden; forget it so the next show re-acquires.
        lock.addEventListener?.('release', () => {
          if (sentinel === lock) sentinel = null;
        });
      } catch {
        /* refused or unavailable right now */
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') void acquire();
    }

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      const held = sentinel;
      sentinel = null;
      held?.release().catch(() => {});
    };
  }, [active]);
}
