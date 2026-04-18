import { useEffect, useRef, useState } from 'react';

interface SaveTemplatePromptProps {
  exerciseNames: string[];
  onSave: (name: string) => void;
  onDismiss: () => void;
}

export default function SaveTemplatePrompt({
  exerciseNames,
  onSave,
  onDismiss,
}: SaveTemplatePromptProps) {
  const [step, setStep] = useState<'ask' | 'name'>('ask');
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'name') {
      inputRef.current?.focus();
    }
  }, [step]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  }

  const previewCount = 3;
  const preview = exerciseNames.slice(0, previewCount);
  const remaining = Math.max(0, exerciseNames.length - previewCount);

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onDismiss}
      />
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto p-5"
        style={{
          background: 'var(--color-elev)',
          border: '1px solid var(--color-line-2)',
          borderRadius: '2px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {step === 'ask' ? (
          <>
            <div
              className="flex items-center gap-1.5 caps-tight text-[9px] mb-2"
              style={{ color: 'var(--color-volt)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="square"
                className="w-3 h-3"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              SESSION SAVED
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
              Save as template?
            </h3>
            <p
              className="text-[13px] mb-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Reuse these exercises next session without re-adding them.
            </p>
            <div
              className="p-3 mb-5"
              style={{
                background: 'var(--color-ink)',
                border: '1px solid var(--color-line-2)',
                borderRadius: '2px',
              }}
            >
              <div
                className="caps-tight text-[9px] mb-2"
                style={{ color: 'var(--color-text-faint)' }}
              >
                EXERCISES
              </div>
              <ul className="flex flex-col gap-1">
                {preview.map((n, i) => (
                  <li
                    key={i}
                    className="text-[13px] truncate"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {n}
                  </li>
                ))}
                {remaining > 0 && (
                  <li
                    className="caps-tight text-[10px]"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    +{remaining} MORE
                  </li>
                )}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onDismiss}
                className="h-12 btn-ghost press caps-tight text-[11px]"
                style={{ borderRadius: '2px' }}
              >
                NOT NOW
              </button>
              <button
                type="button"
                onClick={() => setStep('name')}
                className="h-12 btn-volt press caps-tight text-[11px]"
                style={{ borderRadius: '2px' }}
              >
                SAVE TEMPLATE →
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="caps-tight text-[9px] mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              NAME TEMPLATE
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
            <p
              className="text-[13px] mb-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              A template lets you start from it next session.
            </p>
            <div
              className="caps-tight text-[9px] mb-1.5"
              style={{ color: 'var(--color-text-faint)' }}
            >
              TEMPLATE LABEL
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
                onClick={() => setStep('ask')}
                className="h-12 btn-ghost press caps-tight text-[11px]"
                style={{ borderRadius: '2px' }}
              >
                ← BACK
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
          </>
        )}
      </div>
    </>
  );
}
