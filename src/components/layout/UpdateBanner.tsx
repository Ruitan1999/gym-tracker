import { useEffect, useState } from 'react';
import { RUNNING_BUILD, fetchDeployedBuild } from '../../utils/buildVersion';
import { reloadFresh } from '../../utils/lazyWithRetry';

/** Long enough that flicking between apps doesn't mean a request each time. */
const MIN_GAP_MS = 60_000;

/**
 * Says when the app has been left running long enough to fall behind what is
 * deployed, and offers to fetch it.
 *
 * Offers rather than does. A phone can freeze an installed app for days and
 * hand the same page back untouched, so this is exactly the moment a stale
 * build shows up — and exactly the moment an unannounced reload would throw
 * away whatever was on screen.
 */
export default function UpdateBanner() {
  const [stale, setStale] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (RUNNING_BUILD === 'dev') return;

    let checkedAt = 0;
    let cancelled = false;

    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - checkedAt < MIN_GAP_MS) return;
      checkedAt = now;

      const deployed = await fetchDeployedBuild();
      if (cancelled || !deployed) return;
      if (deployed !== RUNNING_BUILD) setStale(true);
    };

    document.addEventListener('visibilitychange', check);
    // Coming back from frozen doesn't always change visibility on its own.
    window.addEventListener('focus', check);
    check();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);

  if (!stale || dismissed) return null;

  return (
    <div
      className="fixed left-4 right-4 z-[70]"
      style={{ top: 'calc(var(--safe-top) + 1rem)' }}
      role="status"
    >
      <div
        className="flex items-center gap-3 px-3.5 py-3"
        style={{
          background: 'var(--color-ink)',
          border: '1px solid var(--color-volt)',
          borderRadius: '2px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
        }}
      >
        <span className="w-1.5 h-8 shrink-0" style={{ background: 'var(--color-volt)' }} />
        <div className="flex-1 min-w-0">
          <div
            className="caps-tight text-[9px]"
            style={{ color: 'var(--color-volt)', letterSpacing: '0.18em' }}
          >
            UPDATE READY
          </div>
          <div className="text-[13px] mt-0.5" style={{ color: 'var(--color-text)' }}>
            You're on an older version of the app.
          </div>
        </div>
        <button
          type="button"
          onClick={reloadFresh}
          className="h-9 px-3 btn-volt press caps-tight text-[10px] shrink-0"
          style={{ borderRadius: '2px' }}
        >
          RELOAD
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          className="h-9 px-2 press caps-tight text-[10px] shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
