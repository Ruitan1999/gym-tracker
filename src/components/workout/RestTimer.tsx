import { useState, useEffect, useRef } from 'react';

const PRESETS = [30, 60, 90, 120, 180];

export default function RestTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [targetSeconds, setTargetSeconds] = useState(90);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setIsRunning(false);
            setHasFinished(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds]);

  function startTimer(secs: number) {
    setTargetSeconds(secs);
    setSeconds(secs);
    setIsRunning(true);
    setHasFinished(false);
  }

  function stopTimer() {
    setIsRunning(false);
    setSeconds(0);
    setHasFinished(false);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = targetSeconds > 0 ? ((targetSeconds - seconds) / targetSeconds) * 100 : 0;

  if (!isOpen) {
    const badgeColor = isRunning
      ? 'var(--color-volt)'
      : hasFinished
      ? 'var(--color-rust)'
      : 'var(--color-text)';

    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open rest timer"
        className="fixed right-4 z-30 h-14 min-w-[56px] px-3 flex items-center justify-center gap-2 press"
        style={{
          bottom: 'calc(5rem + var(--safe-bottom))',
          background: 'var(--color-surface)',
          border: `1px solid ${isRunning ? 'var(--color-volt)' : 'var(--color-line-3)'}`,
          boxShadow: '0 6px 18px rgba(20, 20, 20, 0.12)',
          color: badgeColor,
          borderRadius: '2px',
          animation: isRunning ? 'pulse-volt 1.8s ease-in-out infinite' : undefined,
        }}
      >
        {isRunning ? (
          <span
            className="font-mono"
            style={{ fontSize: '1.125rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
          >
            {mins}:{String(secs).padStart(2, '0')}
          </span>
        ) : hasFinished ? (
          <span className="caps-tight text-[11px]" style={{ letterSpacing: '0.14em' }}>
            GO
          </span>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" className="w-4 h-4">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2.5M9 3h6" />
            </svg>
            <span className="caps-tight text-[10px]">REST</span>
          </>
        )}
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(5, 5, 5, 0.7)', backdropFilter: 'blur(6px)' }}
        onClick={() => setIsOpen(false)}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 animate-[slideUp_0.22s_ease-out]"
        style={{
          background: 'var(--color-elev)',
          borderTop: '1px solid var(--color-line-2)',
          paddingBottom: 'calc(1.5rem + var(--safe-bottom))',
        }}
      >
        <div className="flex justify-center pt-2 pb-3">
          <div className="w-10 h-[3px]" style={{ background: 'var(--color-line-3)' }} />
        </div>

        <div className="px-6">
          <div className="flex items-center justify-between mb-5">
            <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
              REST INTERVAL
            </div>
            <div
              className="caps-tight text-[9px]"
              style={{ color: isRunning ? 'var(--color-text)' : 'var(--color-text-faint)' }}
            >
              {isRunning ? '● RUNNING' : hasFinished ? '✓ COMPLETE' : '○ STANDBY'}
            </div>
          </div>

          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-line)" strokeWidth="1" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke={hasFinished ? 'var(--color-rust)' : 'var(--color-volt)'}
                strokeWidth="2"
                strokeLinecap="butt"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-linear"
              />
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="2"
                  x2="50"
                  y2="6"
                  stroke="var(--color-line-2)"
                  strokeWidth="0.5"
                  transform={`rotate(${i * 30} 50 50)`}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {hasFinished ? (
                <span
                  className="caps"
                  style={{
                    fontSize: '1.5rem',
                    color: 'var(--color-rust)',
                    letterSpacing: '0.2em',
                  }}
                >
                  GO
                </span>
              ) : (
                <span
                  className="font-mono leading-none"
                  style={{
                    fontSize: '2.75rem',
                    fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--color-text)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {mins}:{String(secs).padStart(2, '0')}
                </span>
              )}
              <span
                className="caps-tight text-[9px] mt-1"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {isRunning ? `OF ${targetSeconds}S` : 'TARGET'}
              </span>
            </div>
          </div>

          <div className="flex justify-between gap-1.5 mb-4">
            {PRESETS.map((p) => {
              const active = targetSeconds === p && isRunning;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => startTimer(p)}
                  className="flex-1 h-11 press caps-tight text-[10px]"
                  style={{
                    background: active ? 'var(--color-volt)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--color-text)',
                    border: `1px solid ${active ? 'var(--color-volt)' : 'var(--color-line-2)'}`,
                    borderRadius: '2px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {p >= 60 ? `${p / 60}M` : `${p}S`}
                </button>
              );
            })}
          </div>

          {(isRunning || hasFinished) && (
            <button
              type="button"
              onClick={stopTimer}
              className="w-full h-12 btn-ghost press caps-tight text-[11px]"
              style={{ borderRadius: '2px' }}
            >
              {hasFinished ? 'DISMISS' : 'STOP'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
