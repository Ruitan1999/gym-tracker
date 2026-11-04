import { useEffect, useRef, useState } from 'react';

interface QuickRepChipsProps {
  values: number[];
  current: number | '';
  onPick: (value: number | '') => void;
  ariaLabelPrefix?: string;
}

const MAX_REPS = 99;

/**
 * The quick rep values, plus a "+" that turns into a number field right where
 * it is. No pop-up: the keyboard comes up, the number is typed, and Done (or
 * tapping anywhere else) sets it.
 */
export default function QuickRepChips({
  values,
  current,
  onPick,
  ariaLabelPrefix = 'Set reps to',
}: QuickRepChipsProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Escape closes without setting; the blur that follows must not set it either.
  const cancelled = useRef(false);

  const currentInList = typeof current === 'number' && values.includes(current);
  const showCustom = typeof current === 'number' && !currentInList && current > 0;

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  function startEditing() {
    cancelled.current = false;
    setDraft(showCustom ? String(current) : '');
    setEditing(true);
  }

  function commit() {
    if (cancelled.current) return;
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n > 0) onPick(Math.min(MAX_REPS, n));
    setEditing(false);
  }

  const chipBase =
    'shrink-0 min-w-[46px] h-[48px] px-3 font-mono text-sm font-medium press flex items-center justify-center';

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
      aria-label="Quick rep values"
    >
      {values.map((n) => {
        const active = current === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onPick(n)}
            aria-label={`${ariaLabelPrefix} ${n}`}
            aria-pressed={active}
            className={chipBase}
            style={{
              background: active ? 'var(--color-volt)' : 'transparent',
              color: active ? '#ffffff' : 'var(--color-text)',
              border: `1px solid ${active ? 'var(--color-volt)' : 'var(--color-line-2)'}`,
              borderRadius: 'var(--radius)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {n}
          </button>
        );
      })}
      {showCustom && !editing && (
        <button
          type="button"
          onClick={startEditing}
          aria-label={`Current reps ${current}. Edit`}
          aria-pressed
          className={chipBase}
          style={{
            background: 'var(--color-volt)',
            color: '#ffffff',
            border: '1px solid var(--color-volt)',
            borderRadius: 'var(--radius)',
          }}
        >
          {current}
        </button>
      )}
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="done"
          aria-label="Custom reps"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              cancelled.current = true;
              setEditing(false);
            }
          }}
          // Same size and type as the chips beside it; the blue edge (as on a
          // chosen chip) shows where the typing goes.
          className={`${chipBase} w-[46px] px-0 text-center outline-none`}
          style={{
            background: 'transparent',
            color: 'var(--color-text)',
            border: '1px solid var(--color-volt)',
            borderRadius: 'var(--radius)',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          aria-label="Enter custom reps"
          className={chipBase}
          style={{
            background: 'transparent',
            color: 'var(--color-text-muted)',
            border: '1px dashed var(--color-line-3)',
            borderRadius: 'var(--radius)',
          }}
        >
          +
        </button>
      )}
    </div>
  );
}
