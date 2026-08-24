import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DAY_LETTERS, DAY_NAMES, dayListSentence } from '../../utils/schedule';

/**
 * Picks the weekdays a template is trained on.
 *
 * Built as a sheet in the same chrome as every other one, and it hands the days
 * back rather than writing them: the template page it opens from has its own
 * save, and two different ways to keep a change on one screen is one too many.
 */
export default function DaySchedulePicker({
  templateName,
  days,
  onDone,
  onClose,
}: {
  templateName: string;
  days: number[];
  onDone: (days: number[]) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<number[]>(days);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sorted = [...picked].sort((a, b) => a - b);

  function toggle(day: number) {
    setPicked((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(5,5,5,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[60] animate-[slideUp_0.2s_ease-out]"
        role="dialog"
        aria-label={`Workout days for ${templateName}`}
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-line-2)',
          paddingBottom: 'var(--safe-bottom)',
        }}
      >
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--color-line)' }}>
          <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
            WORKOUT DAYS
          </div>
          <div
            className="font-display truncate mt-0.5"
            style={{
              fontSize: '1.0625rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--color-text)',
            }}
          >
            {templateName}
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-end gap-1.5 mb-3.5">
            {DAY_LETTERS.map((letter, day) => {
              const on = picked.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggle(day)}
                  aria-pressed={on}
                  aria-label={DAY_NAMES[day]}
                  className="flex-1 aspect-square flex items-center justify-center press caps-tight text-[15px]"
                  style={{
                    background: on ? 'var(--color-volt)' : 'var(--color-surface)',
                    border: `1px solid ${on ? 'var(--color-volt)' : 'var(--color-line-2)'}`,
                    borderRadius: '7px',
                    color: on ? '#ffffff' : 'var(--color-text)',
                    fontWeight: on ? 700 : 400,
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          <div className="flex items-baseline justify-between gap-3 mb-5">
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
              {sorted.length === 0 ? (
                'Pick the days you train this one.'
              ) : (
                <>
                  Waiting for you as{' '}
                  <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>Next Up</span> every{' '}
                  {dayListSentence(sorted)}.
                </>
              )}
            </p>
            <span
              className="caps-tight text-[9px] shrink-0"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {sorted.length} {sorted.length === 1 ? 'DAY' : 'DAYS'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onDone(sorted)}
            className="w-full h-14 btn-volt press caps-tight text-[11px]"
            style={{
              borderRadius: 'var(--radius)',
              letterSpacing: '0.12em',
              boxShadow:
                '0 12px 32px -8px var(--color-volt-glow), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            }}
          >
            DONE
          </button>

          <button
            type="button"
            onClick={() => setPicked([])}
            disabled={sorted.length === 0}
            className="w-full h-11 mt-1.5 press caps-tight text-[10px]"
            style={{
              color: sorted.length === 0 ? 'var(--color-text-faint)' : 'var(--color-text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            CLEAR ALL DAYS
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
