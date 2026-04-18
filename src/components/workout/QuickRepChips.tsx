import { useEffect, useRef, useState } from 'react';

interface QuickRepChipsProps {
  values: number[];
  current: number | '';
  onPick: (value: number | '') => void;
  ariaLabelPrefix?: string;
}

export default function QuickRepChips({
  values,
  current,
  onPick,
  ariaLabelPrefix = 'Set reps to',
}: QuickRepChipsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentInList = typeof current === 'number' && values.includes(current);
  const showCustom = typeof current === 'number' && !currentInList && current > 0;

  useEffect(() => {
    if (modalOpen) {
      setDraft(typeof current === 'number' ? String(current) : '');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [modalOpen, current]);

  function confirm() {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n >= 0) {
      onPick(Math.min(99, n));
      setModalOpen(false);
    }
  }

  const chipBase =
    'shrink-0 min-w-[46px] h-[44px] px-3 font-mono text-sm font-medium press flex items-center justify-center';

  return (
    <>
      <div
        className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5 no-scrollbar"
        role="group"
        aria-label="Quick rep values"
      >
        {showCustom && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label={`Current reps ${current}. Edit`}
            aria-pressed
            className={chipBase}
            style={{
              background: 'var(--color-volt)',
              color: '#ffffff',
              border: '1px solid var(--color-volt)',
              borderRadius: '2px',
            }}
          >
            {current}
          </button>
        )}
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
                borderRadius: '2px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {n}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label="Enter custom reps"
          className={chipBase}
          style={{
            background: 'transparent',
            color: 'var(--color-text-muted)',
            border: '1px dashed var(--color-line-3)',
            borderRadius: '2px',
          }}
        >
          +
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Enter custom reps"
          onClick={() => setModalOpen(false)}
          style={{ background: 'rgba(5, 5, 5, 0.72)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-sm card-elev p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-baseline justify-between">
              <div className="caps text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                CUSTOM REPS
              </div>
              <div className="caps text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                0–99
              </div>
            </div>
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={draft}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') { setDraft(''); return; }
                const n = parseInt(raw, 10);
                setDraft(Number.isFinite(n) ? String(Math.min(99, Math.max(0, n))) : '');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirm();
                if (e.key === 'Escape') setModalOpen(false);
              }}
              placeholder="0"
              className="font-mono w-full text-center outline-none"
              style={{
                background: 'var(--color-ink)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-line-2)',
                borderRadius: '2px',
                fontSize: '3rem',
                fontWeight: 500,
                padding: '0.75rem 0',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 h-12 btn-ghost press caps-tight text-[11px]"
                style={{ borderRadius: '2px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                className="flex-1 h-12 btn-volt press caps-tight text-[11px]"
                style={{ borderRadius: '2px' }}
              >
                Set Reps
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
