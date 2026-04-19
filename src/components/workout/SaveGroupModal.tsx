import { useEffect, useRef, useState } from 'react';

interface SaveGroupModalProps {
  defaultName?: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function SaveGroupModal({ defaultName = '', onSave, onClose }: SaveGroupModalProps) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  }

  return (
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
          SAVE AS GROUP
        </div>
        <h3
          className="font-display mb-1"
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--color-text)',
          }}
        >
          Name this protocol
        </h3>
        <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
          A group lets you start from it next session.
        </p>
        <div className="caps-tight text-[9px] mb-1.5" style={{ color: 'var(--color-text-faint)' }}>
          GROUP LABEL
        </div>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="e.g. LEG DAY A"
          className="w-full h-12 px-3 font-display outline-none"
          style={{
            background: 'var(--color-ink)',
            border: '1px solid var(--color-line-2)',
            borderRadius: '2px',
            fontSize: '16px',
            fontWeight: 500,
            color: 'var(--color-text)',
          }}
        />
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
            disabled={!name.trim()}
            className="h-12 btn-volt press caps-tight text-[11px] disabled:opacity-40"
            style={{ borderRadius: '2px' }}
          >
            COMMIT →
          </button>
        </div>
      </div>
    </>
  );
}
