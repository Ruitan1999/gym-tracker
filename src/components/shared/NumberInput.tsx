import { useState, useEffect, useRef, useId } from 'react';

interface NumberInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  label?: string;
  placeholder?: string;
  min?: number;
  id?: string;
}

export default function NumberInput({ value, onChange, label, placeholder, min, id: externalId }: NumberInputProps) {
  const generatedId = useId();
  const inputId = externalId ?? generatedId;

  const [rawValue, setRawValue] = useState<string>(value === '' ? '' : String(value));
  const isTypingRef = useRef(false);

  // Sync rawValue from external value prop, but only when the change comes from outside (not from typing)
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
      // Revert to the last known good value from props
      setRawValue(value === '' ? '' : String(value));
    } else {
      // Normalize the display (e.g., "1." becomes "1")
      setRawValue(String(num));
      onChange(num);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm text-gray-500 font-medium">{label}</label>
      )}
      <input
        id={inputId}
        type="text"
        inputMode="decimal"
        value={rawValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg text-[16px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
    </div>
  );
}
