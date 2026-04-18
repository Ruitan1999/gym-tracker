import { useState, useEffect, useRef, useId } from 'react';

interface NumberInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  label?: string;
  placeholder?: string;
  min?: number;
  id?: string;
  variant?: 'default' | 'bare';
}

export default function NumberInput({
  value,
  onChange,
  label,
  placeholder,
  min,
  id: externalId,
  variant = 'default',
}: NumberInputProps) {
  const generatedId = useId();
  const inputId = externalId ?? generatedId;

  const [rawValue, setRawValue] = useState<string>(value === '' ? '' : String(value));
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!isTypingRef.current) {
      setRawValue(value === '' ? '' : String(value));
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    isTypingRef.current = true;
    setRawValue(raw);

    if (raw === '') {
      onChange('');
      return;
    }

    const num = parseFloat(raw);
    if (!isNaN(num) && (min === undefined || num >= min)) {
      onChange(num);
    }
  }

  function handleBlur() {
    isTypingRef.current = false;

    if (rawValue === '') {
      onChange('');
      return;
    }

    const num = parseFloat(rawValue);
    if (isNaN(num) || (min !== undefined && num < min)) {
      setRawValue(value === '' ? '' : String(value));
    } else {
      setRawValue(String(num));
      onChange(num);
    }
  }

  if (variant === 'bare') {
    return (
      <input
        id={inputId}
        type="text"
        inputMode="decimal"
        value={rawValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="font-mono w-full h-12 px-3 bg-transparent outline-none"
        style={{
          color: 'var(--color-text)',
          fontSize: '1.25rem',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="caps-tight text-[9px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        inputMode="decimal"
        value={rawValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="font-mono w-full h-12 px-3 outline-none focus:border-[var(--color-volt)] transition-colors"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-line-2)',
          borderRadius: '2px',
          fontSize: '1rem',
          fontVariantNumeric: 'tabular-nums',
        }}
      />
    </div>
  );
}
