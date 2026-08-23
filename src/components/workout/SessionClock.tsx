import { useEffect, useState } from 'react';
import { formatElapsed } from '../../utils/duration';

/**
 * How long this session has been going.
 *
 * Reads the clock rather than counting its own ticks, so time spent with the
 * app in the background or the phone asleep still counts — a timer that only
 * advances while you are looking at it would undercount every rest.
 */
export default function SessionClock({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    // Coming back from the background, the interval may not have run: catch up
    // straight away rather than showing a stale time for up to a second.
    const resync = () => setNow(Date.now());
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('focus', resync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('focus', resync);
    };
  }, []);

  const started = Date.parse(startedAt);
  if (Number.isNaN(started)) return null;
  const elapsed = Math.max(0, now - started);

  return (
    <span className="flex items-center gap-1.5" aria-label="Session time">
      <span
        aria-hidden
        className="inline-block"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--color-volt)',
        }}
      />
      <span
        className="font-mono"
        style={{
          fontSize: '13px',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--color-text-muted)',
        }}
      >
        {formatElapsed(elapsed)}
      </span>
    </span>
  );
}
