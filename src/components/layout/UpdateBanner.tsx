import { useEffect, useState } from 'react';
import { RUNNING_BUILD, clearStaleReload, fetchDeployedBuild } from '../../utils/buildVersion';
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
      if (cancelled) return;
      // Unreachable, or answered by something that isn't a version at all. Let
      // the next return to the app try again rather than sitting out the gap on
      // the strength of a question that was never answered.
      if (!deployed) {
        checkedAt = 0;
        return;
      }
      if (deployed !== RUNNING_BUILD) setStale(true);
      // Confirmed current, so boot is free to heal the next stale document
      // outright instead of finding a spent guard from this session.
      else clearStaleReload();
    };

    document.addEventListener('visibilitychange', check);
    // Coming back from frozen doesn't always change visibility on its own.
    window.addEventListener('focus', check);
    // A page handed back from the back/forward cache resumes mid-flight: it can
    // raise neither of the above, and is exactly the stale case worth catching.
    window.addEventListener('pageshow', check);
    check();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
      window.removeEventListener('pageshow', check);
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
          borderRadius: 'var(--radius)',
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
          style={{ borderRadius: 'var(--radius)' }}
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
