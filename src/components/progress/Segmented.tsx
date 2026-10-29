import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
}

/**
 * A pill with the chosen side raised. One tab stop, arrow keys move the
 * choice, and every side is a 44px target.
 */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex p-[3px] gap-[3px]"
      style={{ background: 'var(--color-elev-2)', borderRadius: 'var(--radius)' }}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className="caps-tight text-[11px] flex-1 min-h-[48px] px-3 press"
            style={{
              background: active ? 'var(--color-surface)' : 'transparent',
              color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
              borderRadius: 'calc(var(--radius) - 3px)',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.12), 0 0 0 1px var(--color-line)' : 'none',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
