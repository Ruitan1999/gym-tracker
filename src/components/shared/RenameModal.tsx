import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface RenameModalProps {
  eyebrow?: string;
  title: string;
  initialValue: string;
  placeholder?: string;
  /** Lets an optional name be emptied again by clearing the field and saving. */
  allowEmpty?: boolean;
  onSave: (value: string) => void;
  onClose: () => void;
}

export default function RenameModal({
  eyebrow = 'RENAME',
  title,
  initialValue,
  placeholder = 'Name',
  allowEmpty = false,
  onSave,
  onClose,
}: RenameModalProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const trimmed = value.trim();
  const canSave = allowEmpty || trimmed.length > 0;

  function submit() {
    if (!canSave) return;
    onSave(trimmed);
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[60] max-w-md mx-auto p-5"
        style={{
          background: 'var(--color-elev)',
          border: '1px solid var(--color-line-2)',
          borderRadius: '2px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div className="caps-tight text-[9px] mb-2" style={{ color: 'var(--color-text)' }}>
          {eyebrow}
        </div>
        <h3
          className="font-display mb-4"
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--color-text)',
          }}
        >
          {title}
        </h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onClose();
          }}
          className="w-full h-12 px-3 font-display outline-none"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-line-2)',
            borderRadius: '2px',
            fontSize: '16px',
            color: 'var(--color-text)',
          }}
        />
        {allowEmpty && (
          <p className="text-[12px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Leave it blank to go back to no name.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 btn-ghost press caps-tight text-[11px]"
            style={{ borderRadius: '2px' }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave}
            className="h-12 press caps-tight text-[11px]"
            style={{
              borderRadius: '2px',
              background: canSave ? 'var(--color-volt)' : 'var(--color-elev-2)',
              color: canSave ? '#ffffff' : 'var(--color-text-faint)',
              cursor: canSave ? undefined : 'not-allowed',
            }}
          >
            SAVE →
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
