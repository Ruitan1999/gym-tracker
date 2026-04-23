import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        el.select();
      });
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
        className="flex flex-wrap gap-1.5"
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

      {modalOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => setModalOpen(false)}
          />
          <div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[60] max-w-md mx-auto p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Enter custom reps"
            style={{
              background: 'var(--color-elev)',
              border: '1px solid var(--color-line-2)',
              borderRadius: '2px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-baseline justify-between mb-4">
              <div className="caps text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                CUSTOM REPS
              </div>
              <div className="caps text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                0–99
              </div>
            </div>
            <div className="flex items-stretch gap-2 mb-4">
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
                className="font-mono flex-1 min-w-0 text-center outline-none"
                style={{
                  background: 'var(--color-ink)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-line-2)',
                  borderRadius: '2px',
                  fontSize: '2rem',
                  fontWeight: 500,
                  padding: '0.5rem 0',
                  height: '3.5rem',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const n = parseInt(draft, 10);
                  const base = Number.isFinite(n) ? n : 0;
                  setDraft(String(Math.max(0, base - 1)));
                }}
                aria-label="Decrease reps"
                className="w-14 flex items-center justify-center press"
                style={{
                  border: '1px solid var(--color-line-2)',
                  borderRadius: '2px',
                  background: 'var(--color-ink)',
                  color: 'var(--color-text)',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" className="w-5 h-5">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  const n = parseInt(draft, 10);
                  const base = Number.isFinite(n) ? n : 0;
                  setDraft(String(Math.min(99, base + 1)));
                }}
                aria-label="Increase reps"
                className="w-14 flex items-center justify-center press"
                style={{
                  border: '1px solid var(--color-volt)',
                  borderRadius: '2px',
                  background: 'var(--color-volt)',
                  color: '#ffffff',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" className="w-5 h-5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-12 btn-ghost press caps-tight text-[11px]"
                style={{ borderRadius: '2px' }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirm}
                className="h-12 btn-volt press caps-tight text-[11px]"
                style={{ borderRadius: '2px' }}
              >
                SET REPS
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
