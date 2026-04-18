import { useEffect, useState } from 'react';
import { formatVolume } from '../../utils/conversions';

export interface SessionSavedStats {
  exercises: number;
  sets: number;
  reps: number;
  volumeKg: number;
}

interface Props {
  stats: SessionSavedStats;
  onClose: () => void;
  duration?: number;
}

export default function SessionSavedBanner({ stats, onClose, duration = 2800 }: Props) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const exit = window.setTimeout(() => setLeaving(true), duration - 240);
    const close = window.setTimeout(onClose, duration);
    return () => {
      window.clearTimeout(exit);
      window.clearTimeout(close);
    };
  }, [duration, onClose]);

  return (
    <div
      className="fixed left-4 right-4 z-50"
      style={{
        top: 'calc(var(--safe-top) + 1rem)',
        animation: leaving
          ? 'banner-out 220ms ease-in forwards'
          : 'banner-in 320ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="relative overflow-hidden"
        style={{
          background: 'var(--color-ink)',
          border: '1px solid var(--color-volt)',
          borderRadius: '2px',
          boxShadow: '0 18px 44px rgba(0,0,0,0.55)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-y-0 left-0"
          style={{ width: '6px', background: 'var(--color-volt)' }}
        />
        <div className="pl-5 pr-4 py-3.5 flex items-center gap-4">
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              background: 'var(--color-volt)',
              color: '#ffffff',
              borderRadius: '2px',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="square"
              className="w-5 h-5"
            >
              <path d="M4 12l5 5L20 6" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="caps-tight text-[9px]"
              style={{ color: 'var(--color-volt)', letterSpacing: '0.18em' }}
            >
              SESSION LOGGED
            </div>
            <div
              className="font-display leading-tight mt-0.5"
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                letterSpacing: '-0.02em',
              }}
            >
              Nice work — it's in the book.
            </div>
            <div
              className="mt-1.5 flex items-center gap-3 font-mono"
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Stat value={stats.exercises} label="EX" />
              <Dot />
              <Stat value={stats.sets} label="SETS" />
              <Dot />
              <Stat value={stats.reps} label="REPS" />
              <Dot />
              <Stat value={formatVolume(stats.volumeKg)} label="KG" />
            </div>
          </div>
        </div>
        <div
          aria-hidden
          className="absolute bottom-0 left-0 h-[2px]"
          style={{
            background: 'var(--color-volt)',
            animation: `banner-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{value}</span>
      <span className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </span>
    </span>
  );
}

function Dot() {
  return (
    <span
      aria-hidden
      style={{
        width: 2,
        height: 2,
        borderRadius: 999,
        background: 'var(--color-line-3)',
        display: 'inline-block',
      }}
    />
  );
}
