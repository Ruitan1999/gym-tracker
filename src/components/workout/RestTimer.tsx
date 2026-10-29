import { Pause, Play } from 'lucide-react';
import { prefersReducedMotion } from '../../utils/motion';
import { REST_STEP_SECONDS, useRemaining, type RestTimerCore } from '../../utils/useRestTimer';

function format(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

const stepBtn = {
  minWidth: '48px',
  height: '44px',
  borderRadius: 'var(--radius)',
  fontVariantNumeric: 'tabular-nums' as const,
};

/**
 * Docked rest countdown for an open session. It exists only while a rest is
 * under way: it appears when a set is logged and removes itself when the rest
 * ends or is skipped, so there is never a banner left to dismiss.
 */
export default function RestTimer({ timer }: { timer: RestTimerCore }) {
  const { phase, total, adjust, togglePause, skip } = timer;
  const remaining = useRemaining(timer);
  if (phase === 'idle') return null;

  const isGo = phase === 'go';
  const paused = phase === 'paused';
  const progress = total > 0 && !isGo ? Math.min(1, Math.max(0, remaining / total)) : 0;

  return (
    <div
      data-testid="rest-timer"
      className="fixed inset-x-0 bottom-0 z-40"
      style={{
        background: 'var(--color-surface)',
        borderTop: `1px solid ${isGo ? 'var(--color-done-line)' : 'var(--color-line-2)'}`,
        paddingBottom: 'var(--safe-bottom)',
        animation: prefersReducedMotion() ? undefined : 'slideUp 0.18s ease-out',
      }}
    >
      <div aria-hidden style={{ height: '2px', background: 'var(--color-line)' }}>
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: 'var(--color-volt)',
          }}
        />
      </div>
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex flex-col min-w-0 mr-auto">
          <span
            role="status"
            className="caps-tight text-[9px]"
            style={{ color: isGo ? 'var(--color-done-deep)' : 'var(--color-text-muted)' }}
          >
            {isGo ? 'Go' : paused ? 'Rest paused' : 'Rest'}
          </span>
          <span
            className="font-mono leading-none"
            style={{
              fontSize: '1.75rem',
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              color: isGo ? 'var(--color-done-deep)' : 'var(--color-text)',
              opacity: paused ? 0.55 : 1,
            }}
          >
            {isGo ? '0:00' : format(remaining)}
          </span>
        </div>
        {!isGo && (
          <>
            <button
              type="button"
              onClick={() => adjust(-REST_STEP_SECONDS)}
              aria-label={`Shorten rest by ${REST_STEP_SECONDS} seconds`}
              className="btn-ghost press font-mono text-[12px]"
              style={stepBtn}
            >
              -{REST_STEP_SECONDS}
            </button>
            <button
              type="button"
              onClick={() => adjust(REST_STEP_SECONDS)}
              aria-label={`Extend rest by ${REST_STEP_SECONDS} seconds`}
              className="btn-ghost press font-mono text-[12px]"
              style={stepBtn}
            >
              +{REST_STEP_SECONDS}
            </button>
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? 'Resume rest' : 'Pause rest'}
              className="btn-ghost press flex items-center justify-center"
              style={{ ...stepBtn, minWidth: '44px' }}
            >
              {paused ? <Play size={16} strokeWidth={1.75} /> : <Pause size={16} strokeWidth={1.75} />}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={skip}
          className="btn-volt press caps-tight text-[11px] px-4"
          style={{ height: '44px', borderRadius: 'var(--radius)', letterSpacing: '0.12em' }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
